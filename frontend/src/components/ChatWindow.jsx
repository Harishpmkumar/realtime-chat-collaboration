import useAuth from "../hooks/useAuth";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

const ChatWindow = ({ conversation, messages, onSendMessage, onBack }) => {
  const { user } = useAuth();

  if (!conversation) {
    return (
      <div className="h-100 d-flex align-items-center justify-content-center bg-white">
        <div className="text-center text-muted">
          <div className="fs-1 mb-3">💬</div>

          <h5>Select a conversation</h5>

          <p className="mb-0">
            Choose someone from the left to start chatting.
          </p>
        </div>
      </div>
    );
  }

  const otherUser = conversation.participants?.find(
    (participant) => participant._id !== user?._id,
  );

  return (
    <div className="d-flex flex-column h-100 bg-white">
      {/* Header */}
      <div className="border-bottom px-3 py-2 d-flex align-items-center">
        <button
          type="button"
          className="btn btn-light d-md-none me-2"
          onClick={onBack}
        >
          ←
        </button>

        <div
          className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
          style={{
            width: "42px",
            height: "42px",
          }}
        >
          {otherUser?.name?.charAt(0).toUpperCase() || "U"}
        </div>

        <div>
          <h6 className="mb-0">{otherUser?.name || "Unknown User"}</h6>

          <small
            className={otherUser?.isOnline ? "text-success" : "text-muted"}
          >
            {otherUser?.isOnline ? "Online" : "Offline"}
          </small>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Input */}
      <MessageInput onSend={onSendMessage} />
    </div>
  );
};

export default ChatWindow;
