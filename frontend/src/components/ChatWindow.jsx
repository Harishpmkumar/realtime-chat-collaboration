import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCircle,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

import useAuth from "../hooks/useAuth";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";

const ChatWindow = ({
  conversation,
  messages,
  onSendMessage,
  onBack,
  typingUser,
  onGroupDetails,
}) => {
  const { user } = useAuth();

  if (!conversation) {
    return (
      <div className="h-100 d-flex align-items-center justify-content-center bg-white">
        <div className="text-center text-muted px-4">
          <div className="chat-empty-icon mb-3">
            <FontAwesomeIcon icon={faUsers} size="2x" />
          </div>

          <h5 className="fw-semibold">Select a conversation</h5>

          <p className="mb-0">
            Choose someone from the left to start chatting.
          </p>
        </div>
      </div>
    );
  }

  const currentUserId = user?.id || user?._id;

  const isGroup = conversation.type === "group";

  const otherUser = !isGroup
    ? conversation.participants?.find(
        (participant) =>
          participant._id?.toString() !== currentUserId?.toString(),
      )
    : null;

  const groupMembers = conversation.participants || [];

  const onlineMembers = groupMembers.filter((member) => member.isOnline).length;

  const displayName = isGroup
    ? conversation.name || "Group"
    : otherUser?.name || "Unknown User";

  const firstLetter = displayName?.charAt(0)?.toUpperCase() || "U";

  const formatLastSeen = (date) => {
    if (!date) {
      return "Offline";
    }

    const lastSeenDate = new Date(date);
    const now = new Date();

    const diffMs = now.getTime() - lastSeenDate.getTime();

    const diffSeconds = Math.floor(diffMs / 1000);

    const diffMinutes = Math.floor(diffSeconds / 60);

    const diffHours = Math.floor(diffMinutes / 60);

    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return "Last seen just now";
    }

    if (diffMinutes < 60) {
      return `Last seen ${diffMinutes} min ago`;
    }

    if (lastSeenDate.toDateString() === now.toDateString()) {
      return `Last seen today at ${lastSeenDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    const yesterday = new Date(now);

    yesterday.setDate(now.getDate() - 1);

    if (lastSeenDate.toDateString() === yesterday.toDateString()) {
      return `Last seen yesterday at ${lastSeenDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    if (diffDays < 7) {
      return `Last seen ${lastSeenDate.toLocaleDateString([], {
        weekday: "short",
      })} at ${lastSeenDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    return `Last seen ${lastSeenDate.toLocaleDateString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`;
  };

  const statusText = isGroup
    ? `${groupMembers.length} member${
        groupMembers.length !== 1 ? "s" : ""
      } • ${onlineMembers} online`
    : otherUser?.isOnline
      ? "Online"
      : formatLastSeen(otherUser?.lastSeen);

  return (
    <div className="d-flex flex-column h-100 bg-white">
      {/* HEADER */}

      <div className="border-bottom px-3 py-3 d-flex align-items-center">
        <button
          type="button"
          className="btn btn-light d-md-none me-3"
          onClick={onBack}
          title="Back to conversations"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>

        {/* CLICKABLE GROUP HEADER */}

        <button
          type="button"
          className={`border-0 bg-transparent p-0 d-flex align-items-center flex-grow-1 text-start ${
            isGroup ? "chat-group-header-button" : ""
          }`}
          onClick={() => {
            if (isGroup && onGroupDetails) {
              onGroupDetails(conversation);
            }
          }}
          disabled={!isGroup}
          title={isGroup ? "View group details" : undefined}
        >
          {/* AVATAR */}

          <div className="position-relative me-3 flex-shrink-0">
            {isGroup ? (
              conversation.groupImage ? (
                <img
                  src={conversation.groupImage}
                  alt={displayName}
                  className="rounded-circle"
                  style={{
                    width: "44px",
                    height: "44px",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                  style={{
                    width: "44px",
                    height: "44px",
                  }}
                >
                  <FontAwesomeIcon icon={faUsers} />
                </div>
              )
            ) : otherUser?.profileImage ? (
              <img
                src={otherUser.profileImage}
                alt={otherUser.name}
                className="rounded-circle"
                style={{
                  width: "44px",
                  height: "44px",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-semibold"
                style={{
                  width: "44px",
                  height: "44px",
                }}
              >
                {firstLetter}
              </div>
            )}

            {!isGroup && otherUser?.isOnline && (
              <span
                className="position-absolute text-success"
                style={{
                  right: "-2px",
                  bottom: "-2px",
                  fontSize: "13px",
                  lineHeight: 1,
                }}
                title="Online"
              >
                <FontAwesomeIcon
                  icon={faCircle}
                  className="border border-white rounded-circle"
                />
              </span>
            )}
          </div>

          {/* NAME + STATUS */}

          <div className="flex-grow-1 min-width-0">
            <h6 className="mb-1 fw-semibold text-truncate">{displayName}</h6>

            <small
              className={
                isGroup
                  ? "text-muted"
                  : otherUser?.isOnline
                    ? "text-success"
                    : "text-muted"
              }
            >
              {!isGroup && (
                <FontAwesomeIcon
                  icon={otherUser?.isOnline ? faCircle : faUser}
                  className="me-1"
                  style={{
                    fontSize: "8px",
                  }}
                />
              )}

              {statusText}
            </small>
          </div>
        </button>

        {/* GROUP MEMBER COUNT */}

        {isGroup && (
          <button
            type="button"
            className="btn btn-light d-flex align-items-center text-muted small ms-2"
            onClick={() => {
              if (onGroupDetails) {
                onGroupDetails(conversation);
              }
            }}
            title="Group details"
          >
            <FontAwesomeIcon icon={faUsers} className="me-2" />

            <span className="d-none d-sm-inline">{groupMembers.length}</span>
          </button>
        )}
      </div>

      {/* GROUP DESCRIPTION */}

      {isGroup && conversation.description && (
        <div className="px-3 py-2 border-bottom bg-light">
          <small className="text-muted">{conversation.description}</small>
        </div>
      )}

      {/* TYPING */}

      {typingUser && <TypingIndicator userName={typingUser} />}

      {/* MESSAGES */}

      <MessageList messages={messages} conversation={conversation} />

      {/* INPUT */}

      <MessageInput onSend={onSendMessage} conversationId={conversation._id} />
    </div>
  );
};

export default ChatWindow;
