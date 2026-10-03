import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ConversationList from "../components/ConversationList";
import ChatWindow from "../components/ChatWindow";
import useAuth from "../hooks/useAuth";
import api from "../services/api";

const Chat = () => {
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");

  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoadingConversations(true);
        setError("");

        const data = await api.get("/conversations");

        setConversations(data.conversations || []);
      } catch (error) {
        console.error(error);
        setError(error.message);
      } finally {
        setLoadingConversations(false);
      }
    };

    if (user) {
      loadConversations();
    }
  }, [user]);

  // Load messages when conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversation) {
        setMessages([]);
        return;
      }

      try {
        setLoadingMessages(true);
        setError("");

        const data = await api.get(
          `/conversations/${selectedConversation._id}/messages`,
        );

        setMessages(data.messages || []);
      } catch (error) {
        console.error(error);
        setError(error.message);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedConversation]);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setMobileChatOpen(true);
  };

  const handleSendMessage = (content) => {
    console.log("Message:", content);

    // Socket.IO will be connected here next.
  };

  const handleBack = () => {
    setMobileChatOpen(false);
  };

  return (
    <div className="chat-page bg-light">
      <Navbar />

      <div className="container-fluid px-0">
        {error && (
          <div className="alert alert-danger rounded-0 mb-0">{error}</div>
        )}

        <div className="row g-0">
          <div
            className={`col-md-4 col-lg-3 conversation-panel ${
              mobileChatOpen ? "d-none d-md-block" : ""
            }`}
          >
            {loadingConversations ? (
              <div className="p-4 text-center">
                <div className="spinner-border" role="status"></div>

                <p className="text-muted mt-2 mb-0">Loading conversations...</p>
              </div>
            ) : (
              <ConversationList
                conversations={conversations}
                selectedConversation={selectedConversation}
                onSelectConversation={handleSelectConversation}
                currentUserId={user?._id}
              />
            )}
          </div>

          <div
            className={`col-md-8 col-lg-9 chat-window ${
              !mobileChatOpen ? "d-none d-md-block" : ""
            }`}
          >
            {loadingMessages ? (
              <div className="h-100 d-flex align-items-center justify-content-center">
                <div className="text-center">
                  <div className="spinner-border" role="status"></div>

                  <p className="text-muted mt-2">Loading messages...</p>
                </div>
              </div>
            ) : (
              <ChatWindow
                conversation={selectedConversation}
                messages={messages}
                onSendMessage={handleSendMessage}
                onBack={handleBack}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
