import useAuth from "../hooks/useAuth";

const MessageList = ({ messages }) => {
  const { user } = useAuth();

  return (
    <div className="message-list p-3 p-md-4">
      {messages.length === 0 ? (
        <div className="h-100 d-flex align-items-center justify-content-center text-muted">
          <div className="text-center">
            <div className="fs-1 mb-3">👋</div>

            <h6>Start the conversation</h6>

            <small>Send a message to get started.</small>
          </div>
        </div>
      ) : (
        messages.map((message) => {
          const isMine = message.sender?._id === user?._id;

          return (
            <div
              key={message._id}
              className={`d-flex mb-3 ${
                isMine ? "justify-content-end" : "justify-content-start"
              }`}
            >
              <div
                className={`message-bubble rounded-4 px-3 py-2 ${
                  isMine ? "bg-primary text-white" : "bg-light text-dark"
                }`}
              >
                {!isMine && (
                  <div className="small fw-semibold text-primary mb-1">
                    {message.sender?.name}
                  </div>
                )}

                <div>{message.content}</div>

                <div
                  className={`small mt-1 ${
                    isMine ? "text-white-50" : "text-muted"
                  }`}
                  style={{
                    fontSize: "10px",
                  }}
                >
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default MessageList;
