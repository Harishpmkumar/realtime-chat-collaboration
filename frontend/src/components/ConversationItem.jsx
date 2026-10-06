import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faUsers } from "@fortawesome/free-solid-svg-icons";

const ConversationItem = ({
  conversation,
  currentUserId,
  selected,
  onClick,
}) => {
  const isGroup = conversation.type === "group";

  const otherUser = conversation.participants?.find(
    (participant) => participant._id?.toString() !== currentUserId?.toString(),
  );

  const unreadCount = conversation.unreadCount || 0;

  const lastMessage = conversation.lastMessage;

  const getLastMessagePreview = () => {
    if (!lastMessage) {
      return isGroup
        ? `${conversation.participants?.length || 0} members`
        : "No messages yet";
    }

    if (lastMessage.isDeleted) {
      return "This message was deleted";
    }

    if (lastMessage.content) {
      return lastMessage.content;
    }

    if (lastMessage.messageType === "image") {
      return "📷 Photo";
    }

    if (lastMessage.messageType === "file") {
      return `📎 ${lastMessage.attachment?.originalName || "File"}`;
    }

    return "Message";
  };

  const displayName = isGroup
    ? conversation.name || "Group"
    : otherUser?.name || "Unknown User";

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    const messageDate = new Date(date);
    const now = new Date();

    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return messageDate.toLocaleDateString([], {
      day: "2-digit",
      month: "short",
    });
  };

  const firstLetter = displayName?.charAt(0)?.toUpperCase() || "U";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-100 border-0 text-start d-flex align-items-center conversation-item ${
        selected ? "conversation-item-selected" : ""
      }`}
    >
      <div
        className="position-relative flex-shrink-0 me-3"
        style={{
          width: "48px",
          height: "48px",
        }}
      >
        {isGroup ? (
          <div
            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
            style={{
              width: "48px",
              height: "48px",
            }}
          >
            <FontAwesomeIcon icon={faUsers} />
          </div>
        ) : otherUser?.profileImage ? (
          <img
            src={otherUser.profileImage}
            alt={otherUser.name}
            className="rounded-circle w-100 h-100 object-fit-cover"
          />
        ) : (
          <div
            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-semibold"
            style={{
              width: "48px",
              height: "48px",
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
              fontSize: "14px",
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

      <div className="flex-grow-1 overflow-hidden min-width-0">
        <div className="d-flex justify-content-between align-items-center">
          <h6
            className={`mb-1 text-truncate ${
              unreadCount > 0 ? "fw-bold" : "fw-semibold"
            }`}
          >
            {displayName}
          </h6>

          <small
            className={`ms-2 flex-shrink-0 ${
              unreadCount > 0 ? "text-primary fw-semibold" : "text-muted"
            }`}
          >
            {formatTime(lastMessage?.createdAt)}
          </small>
        </div>

        <div className="d-flex align-items-center">
          <p
            className={`mb-0 text-truncate ${
              unreadCount > 0 ? "text-dark fw-semibold" : "text-muted"
            }`}
          >
            {getLastMessagePreview()}
          </p>

          {unreadCount > 0 && (
            <span className="badge bg-primary rounded-pill ms-2 flex-shrink-0">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default ConversationItem;
