import { useState } from "react";

const MessageInput = ({ onSend, disabled }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const content = message.trim();

    if (!content || disabled) {
      return;
    }

    onSend(content);

    setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border-top bg-white">
      <div className="input-group">
        <input
          type="text"
          className="form-control"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={disabled}
        />

        <button
          type="submit"
          className="btn btn-primary px-4"
          disabled={disabled || !message.trim()}
        >
          Send
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
