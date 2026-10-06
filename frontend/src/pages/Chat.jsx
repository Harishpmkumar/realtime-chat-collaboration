import { useCallback, useEffect, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircle,
  faCircleExclamation,
} from "@fortawesome/free-solid-svg-icons";

import api from "../services/api";
import useAuth from "../hooks/useAuth";
import useSocket from "../hooks/useSocket";

import Navbar from "../components/Navbar";
import ConversationList from "../components/ConversationList";
import ChatWindow from "../components/ChatWindow";
import NewConversationModal from "../components/NewConversationModal";
import CreateGroupModal from "../components/CreateGroupModal";
import GroupDetailsModal from "../components/GroupDetailsModal";

const Chat = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [conversations, setConversations] = useState([]);

  const [selectedConversation, setSelectedConversation] = useState(null);

  const [messages, setMessages] = useState([]);

  const [loadingConversations, setLoadingConversations] = useState(true);

  const [loadingMessages, setLoadingMessages] = useState(false);

  const [typingUser, setTypingUser] = useState(null);

  const [socketConnected, setSocketConnected] = useState(false);

  const [error, setError] = useState("");

  const [showNewConversationModal, setShowNewConversationModal] =
    useState(false);

  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  const [showGroupDetailsModal, setShowGroupDetailsModal] = useState(false);

  const [groupDetailsConversation, setGroupDetailsConversation] =
    useState(null);

  const currentUserId = user?.id || user?._id;

  // =========================================================
  // LOAD CONVERSATIONS
  // =========================================================

  const loadConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      setError("");

      const response = await api.get("/conversations");

      setConversations(response.data?.conversations || []);
    } catch (error) {
      console.error("Load conversations error:", error);

      setError(error.message || "Failed to load conversations");
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  // =========================================================
  // LOAD MESSAGES
  // =========================================================

  const loadMessages = useCallback(async (conversationId) => {
    try {
      setLoadingMessages(true);
      setError("");

      const response = await api.get(
        `/conversations/${conversationId}/messages`,
      );

      setMessages(response.data?.messages || []);
    } catch (error) {
      console.error("Load messages error:", error);

      setMessages([]);

      setError(error.message || "Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // =========================================================
  // SOCKET CONNECTION
  // =========================================================

  useEffect(() => {
    if (!socket) {
      setSocketConnected(false);
      return;
    }

    const handleConnect = () => {
      console.log("Chat socket connected:", socket.id);

      setSocketConnected(true);
    };

    const handleDisconnect = () => {
      console.log("Chat socket disconnected");

      setSocketConnected(false);
    };

    const handleConnectError = (error) => {
      console.error("Chat socket error:", error.message);

      setSocketConnected(false);
    };

    socket.on("connect", handleConnect);

    socket.on("disconnect", handleDisconnect);

    socket.on("connect_error", handleConnectError);

    if (socket.connected) {
      setSocketConnected(true);
    }

    return () => {
      socket.off("connect", handleConnect);

      socket.off("disconnect", handleDisconnect);

      socket.off("connect_error", handleConnectError);
    };
  }, [socket]);

  // =========================================================
  // RECEIVE MESSAGE
  // =========================================================

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleReceiveMessage = (message) => {
      console.log("Received message:", message);

      const conversationId = message.conversation?.toString();

      const selectedId = selectedConversation?._id?.toString();

      const isCurrentConversation = conversationId === selectedId;

      if (!isCurrentConversation) {
        return;
      }

      setMessages((previousMessages) => {
        const alreadyExists = previousMessages.some(
          (item) => item._id?.toString() === message._id?.toString(),
        );

        if (alreadyExists) {
          return previousMessages;
        }

        return [...previousMessages, message];
      });
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, selectedConversation]);

  // =========================================================
  // MESSAGE UPDATED - EDIT / DELETE / REACTION
  // =========================================================

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleMessageUpdated = (updatedMessage) => {
      setMessages((previousMessages) =>
        previousMessages.map((message) =>
          message._id?.toString() === updatedMessage._id?.toString()
            ? updatedMessage
            : message,
        ),
      );

      setConversations((previousConversations) =>
        previousConversations.map((conversation) => {
          const lastMessageId =
            conversation.lastMessage?._id || conversation.lastMessage;

          if (lastMessageId?.toString() !== updatedMessage._id?.toString()) {
            return conversation;
          }

          return {
            ...conversation,
            lastMessage: updatedMessage,
          };
        }),
      );
    };

    socket.on("message_updated", handleMessageUpdated);

    return () => {
      socket.off("message_updated", handleMessageUpdated);
    };
  }, [socket]);

  // =========================================================
  // REAL-TIME CONVERSATION LIST UPDATE
  // =========================================================

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleConversationUpdated = ({ conversationId, message }) => {
      console.log("Conversation list updated:", conversationId, message);

      const normalizedConversationId = conversationId?.toString();

      const selectedId = selectedConversation?._id?.toString();

      const isCurrentConversation = normalizedConversationId === selectedId;

      setConversations((previousConversations) => {
        const conversation = previousConversations.find(
          (item) => item._id?.toString() === normalizedConversationId,
        );

        if (!conversation) {
          console.log(
            "Conversation not found in list:",
            normalizedConversationId,
          );

          return previousConversations;
        }

        const messageSenderId = message.sender?._id || message.sender;

        const isOwnMessage =
          messageSenderId?.toString() === currentUserId?.toString();

        const updatedConversation = {
          ...conversation,

          lastMessage: message,

          unreadCount:
            isCurrentConversation || isOwnMessage
              ? 0
              : (conversation.unreadCount || 0) + 1,

          updatedAt: message.createdAt,
        };

        const remainingConversations = previousConversations.filter(
          (item) => item._id?.toString() !== normalizedConversationId,
        );

        return [updatedConversation, ...remainingConversations];
      });
    };

    socket.on("conversation_updated", handleConversationUpdated);

    return () => {
      socket.off("conversation_updated", handleConversationUpdated);
    };
  }, [socket, selectedConversation, currentUserId]);

  // =========================================================
  // MESSAGE READ RECEIPT
  // =========================================================

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleMessageRead = ({ messageId, conversationId }) => {
      console.log("Message read:", messageId);

      setMessages((previousMessages) =>
        previousMessages.map((message) =>
          message._id?.toString() === messageId?.toString()
            ? {
                ...message,
                isRead: true,
              }
            : message,
        ),
      );

      setConversations((previousConversations) =>
        previousConversations.map((conversation) =>
          conversation._id?.toString() === conversationId?.toString()
            ? {
                ...conversation,
                unreadCount: 0,
              }
            : conversation,
        ),
      );
    };

    socket.on("message_read", handleMessageRead);

    return () => {
      socket.off("message_read", handleMessageRead);
    };
  }, [socket]);

  // =========================================================
  // USER ONLINE
  // =========================================================

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleUserOnline = ({ userId }) => {
      setConversations((previousConversations) =>
        previousConversations.map((conversation) => ({
          ...conversation,

          participants: conversation.participants?.map((participant) =>
            participant._id?.toString() === userId?.toString()
              ? {
                  ...participant,
                  isOnline: true,
                }
              : participant,
          ),
        })),
      );

      setSelectedConversation((previousConversation) => {
        if (!previousConversation) {
          return previousConversation;
        }

        return {
          ...previousConversation,

          participants: previousConversation.participants?.map((participant) =>
            participant._id?.toString() === userId?.toString()
              ? {
                  ...participant,
                  isOnline: true,
                }
              : participant,
          ),
        };
      });
    };

    socket.on("user_online", handleUserOnline);

    return () => {
      socket.off("user_online", handleUserOnline);
    };
  }, [socket]);

  // =========================================================
  // USER OFFLINE
  // =========================================================

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleUserOffline = ({ userId, lastSeen }) => {
      setConversations((previousConversations) =>
        previousConversations.map((conversation) => ({
          ...conversation,

          participants: conversation.participants?.map((participant) =>
            participant._id?.toString() === userId?.toString()
              ? {
                  ...participant,
                  isOnline: false,
                  lastSeen,
                }
              : participant,
          ),
        })),
      );

      setSelectedConversation((previousConversation) => {
        if (!previousConversation) {
          return previousConversation;
        }

        return {
          ...previousConversation,

          participants: previousConversation.participants?.map((participant) =>
            participant._id?.toString() === userId?.toString()
              ? {
                  ...participant,
                  isOnline: false,
                  lastSeen,
                }
              : participant,
          ),
        };
      });
    };

    socket.on("user_offline", handleUserOffline);

    return () => {
      socket.off("user_offline", handleUserOffline);
    };
  }, [socket]);

  // =========================================================
  // TYPING
  // =========================================================

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleTyping = ({ conversationId, userId, userName }) => {
      if (
        conversationId?.toString() !== selectedConversation?._id?.toString()
      ) {
        return;
      }

      if (userId?.toString() === currentUserId?.toString()) {
        return;
      }

      setTypingUser(userName);
    };

    const handleStopTyping = ({ conversationId, userId }) => {
      if (
        conversationId?.toString() !== selectedConversation?._id?.toString()
      ) {
        return;
      }

      if (userId?.toString() === currentUserId?.toString()) {
        return;
      }

      setTypingUser(null);
    };

    socket.on("typing", handleTyping);

    socket.on("stop_typing", handleStopTyping);

    return () => {
      socket.off("typing", handleTyping);

      socket.off("stop_typing", handleStopTyping);
    };
  }, [socket, selectedConversation, currentUserId]);

  // =========================================================
  // SOCKET ERROR
  // =========================================================

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleSocketError = (data) => {
      console.error("Socket error:", data);

      setError(data?.message || "Socket error occurred");
    };

    socket.on("socket_error", handleSocketError);

    return () => {
      socket.off("socket_error", handleSocketError);
    };
  }, [socket]);

  // =========================================================
  // SELECT CONVERSATION
  // =========================================================

  const handleSelectConversation = async (conversation) => {
    if (selectedConversation && socket) {
      socket.emit("leave_conversation", selectedConversation._id);
    }

    setTypingUser(null);

    setSelectedConversation(conversation);

    setConversations((previousConversations) =>
      previousConversations.map((item) =>
        item._id?.toString() === conversation._id?.toString()
          ? {
              ...item,
              unreadCount: 0,
            }
          : item,
      ),
    );

    setMessages([]);

    if (socket) {
      socket.emit("join_conversation", conversation._id);
    }

    await loadMessages(conversation._id);
  };

  // =========================================================
  // NEW CONVERSATION CREATED
  // =========================================================

  const handleConversationCreated = async (conversation) => {
    console.log("Conversation created:", conversation);

    setError("");

    // Add or replace conversation in sidebar.
    setConversations((previousConversations) => {
      const exists = previousConversations.some(
        (item) => item._id?.toString() === conversation._id?.toString(),
      );

      if (exists) {
        return previousConversations.map((item) =>
          item._id?.toString() === conversation._id?.toString()
            ? {
                ...item,
                ...conversation,
                unreadCount: 0,
              }
            : item,
        );
      }

      return [
        {
          ...conversation,
          lastMessage: null,
          unreadCount: 0,
        },
        ...previousConversations,
      ];
    });

    // Open the new conversation.
    await handleSelectConversation(conversation);
  };

  const handleGroupCreated = async (conversation) => {
    console.log("Group created:", conversation);

    setError("");

    setConversations((previousConversations) => {
      const exists = previousConversations.some(
        (item) => item._id?.toString() === conversation._id?.toString(),
      );

      if (exists) {
        return previousConversations.map((item) =>
          item._id?.toString() === conversation._id?.toString()
            ? {
                ...item,
                ...conversation,
                unreadCount: 0,
              }
            : item,
        );
      }

      return [
        {
          ...conversation,
          lastMessage: null,
          unreadCount: 0,
        },
        ...previousConversations,
      ];
    });

    await handleSelectConversation(conversation);
  };

  const handleGroupDetails = (conversation) => {
    setGroupDetailsConversation(conversation);
    setShowGroupDetailsModal(true);
  };

  const handleGroupConversationUpdated = (updatedConversation) => {
    setConversations((previousConversations) =>
      previousConversations.map((conversation) =>
        conversation._id?.toString() === updatedConversation._id?.toString()
          ? {
              ...conversation,
              ...updatedConversation,
            }
          : conversation,
      ),
    );

    setSelectedConversation((previousConversation) => {
      if (
        !previousConversation ||
        previousConversation._id?.toString() !==
          updatedConversation._id?.toString()
      ) {
        return previousConversation;
      }

      return {
        ...previousConversation,
        ...updatedConversation,
      };
    });

    setGroupDetailsConversation(updatedConversation);
  };

  const handleGroupLeft = (conversationId) => {
    setConversations((previousConversations) =>
      previousConversations.filter(
        (conversation) =>
          conversation._id?.toString() !== conversationId?.toString(),
      ),
    );

    if (selectedConversation?._id?.toString() === conversationId?.toString()) {
      if (socket) {
        socket.emit("leave_conversation", conversationId);
      }

      setSelectedConversation(null);
      setMessages([]);
      setTypingUser(null);
    }

    setGroupDetailsConversation(null);
  };

  // =========================================================
  // SEND MESSAGE
  // =========================================================

  const handleSendMessage = ({
    content = "",
    messageType = "text",
    attachment = null,
  }) => {
    if (!socket || !selectedConversation) {
      return;
    }

    const trimmedContent = typeof content === "string" ? content.trim() : "";

    if (!trimmedContent && !attachment) {
      return;
    }

    socket.emit("send_message", {
      conversationId: selectedConversation._id,

      content: trimmedContent,

      messageType,

      attachment,
    });
  };

  // =========================================================
  // BACK
  // =========================================================

  const handleBack = () => {
    if (selectedConversation && socket) {
      socket.emit("leave_conversation", selectedConversation._id);
    }

    setSelectedConversation(null);
    setMessages([]);
    setTypingUser(null);
  };

  // =========================================================
  // MARK RECEIVED MESSAGES AS READ
  // =========================================================

  useEffect(() => {
    if (!socket || !selectedConversation || !messages.length) {
      return;
    }

    const unreadMessages = messages.filter((message) => {
      const senderId = message.sender?._id || message.sender;

      return (
        !message.isRead && senderId?.toString() !== currentUserId?.toString()
      );
    });

    unreadMessages.forEach((message) => {
      socket.emit("message_read", message._id);
    });
  }, [socket, selectedConversation, messages, currentUserId]);

  // =========================================================
  // LOADING
  // =========================================================

  if (loadingConversations) {
    return (
      <div className="vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>

          <p className="text-muted mt-3 mb-0">Loading chats...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="chat-page d-flex flex-column">
      <Navbar />

      {/* ERROR */}

      {error && (
        <div className="container-fluid px-3 pt-2">
          <div className="alert alert-danger py-2 mb-2 d-flex align-items-center">
            <FontAwesomeIcon icon={faCircleExclamation} className="me-2" />

            <span className="small">{error}</span>

            <button
              type="button"
              className="btn-close ms-auto"
              onClick={() => setError("")}
            />
          </div>
        </div>
      )}

      {/* SOCKET STATUS */}

      <div className="container-fluid px-3 pb-2">
        <small className={socketConnected ? "text-success" : "text-danger"}>
          <FontAwesomeIcon
            icon={faCircle}
            className="me-1"
            style={{
              fontSize: "7px",
            }}
          />

          {socketConnected ? "Connected" : "Disconnected"}
        </small>
      </div>

      {/* CHAT AREA */}

      <div className="container-fluid flex-grow-1 min-height-0">
        <div className="row h-100 g-0">
          {/* CONVERSATION LIST */}

          <div
            className={`col-md-4 col-lg-3 conversation-panel ${
              selectedConversation ? "d-none d-md-block" : "d-block"
            }`}
          >
            <ConversationList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
              currentUserId={currentUserId}
              onNewConversation={() => setShowNewConversationModal(true)}
              onNewGroup={() => setShowCreateGroupModal(true)}
            />
          </div>

          {/* CHAT WINDOW */}

          <div
            className={`col-md-8 col-lg-9 chat-window ${
              selectedConversation ? "d-block" : "d-none d-md-block"
            }`}
          >
            {loadingMessages ? (
              <div className="h-100 d-flex align-items-center justify-content-center bg-white">
                <div className="text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading messages...</span>
                  </div>

                  <p className="text-muted mt-3 mb-0">Loading messages...</p>
                </div>
              </div>
            ) : (
              <ChatWindow
                conversation={selectedConversation}
                messages={messages}
                onSendMessage={handleSendMessage}
                onBack={handleBack}
                typingUser={typingUser}
                onGroupDetails={handleGroupDetails}
              />
            )}
          </div>
        </div>
      </div>

      {/* NEW CONVERSATION MODAL */}

      <NewConversationModal
        show={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onConversationCreated={handleConversationCreated}
        currentUserId={currentUserId}
      />
      <CreateGroupModal
        show={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onGroupCreated={handleGroupCreated}
        currentUserId={currentUserId}
      />
      <GroupDetailsModal
        show={showGroupDetailsModal}
        conversation={groupDetailsConversation}
        currentUserId={currentUserId}
        onClose={() => {
          setShowGroupDetailsModal(false);
          setGroupDetailsConversation(null);
        }}
        onConversationUpdated={handleGroupConversationUpdated}
        onGroupLeft={handleGroupLeft}
      />
    </div>
  );
};

export default Chat;
