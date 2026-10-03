const ConversationItem = ({
  conversation,
  selected,
  onClick,
  currentUserId,
}) => {
  const otherUser = conversation.participants?.find(
    (participant) => participant._id !== currentUserId,
  );

  if (!otherUser) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`list-group-item list-group-item-action border-0 ${
        selected ? "bg-primary bg-opacity-10" : ""
      }`}
    >
      <div className="d-flex align-items-center gap-3">
        <div
          className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
          style={{
            width: "46px",
            height: "46px",
          }}
        >
          {otherUser.name?.charAt(0).toUpperCase()}
        </div>

        <div className="flex-grow-1 text-start overflow-hidden">
          <div className="d-flex justify-content-between">
            <span className="fw-semibold text-truncate">{otherUser.name}</span>

            {otherUser.isOnline && (
              <span
                className="badge bg-success rounded-pill"
                style={{
                  fontSize: "9px",
                }}
              >
                ONLINE
              </span>
            )}
          </div>

          <div className="text-muted small text-truncate">
            {otherUser.about || "Start a conversation"}
          </div>
        </div>
      </div>
    </button>
  );
};

export default ConversationItem;
