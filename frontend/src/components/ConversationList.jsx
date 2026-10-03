import { useState } from "react";
import ConversationItem from "./ConversationItem";

const ConversationList = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  currentUserId,
}) => {
  const [search, setSearch] = useState("");

  const filteredConversations = conversations.filter((conversation) => {
    const otherUser = conversation.participants?.find(
      (participant) => participant._id !== currentUserId,
    );

    return otherUser?.name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="conversation-panel h-100 d-flex flex-column bg-white">
      <div className="p-3 border-bottom">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-0">Messages</h5>

            <small className="text-muted">Your conversations</small>
          </div>

          <button className="btn btn-primary btn-sm rounded-circle">+</button>
        </div>

        <div className="input-group">
          <span className="input-group-text bg-light border-end-0">🔍</span>

          <input
            type="text"
            className="form-control bg-light border-start-0"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="list-group list-group-flush overflow-auto flex-grow-1">
        {filteredConversations.length === 0 ? (
          <div className="text-center text-muted p-4">
            <div className="fs-1 mb-2">💬</div>

            <p className="mb-1">No conversations</p>

            <small>Start a new conversation</small>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation._id}
              conversation={conversation}
              selected={selectedConversation?._id === conversation._id}
              onClick={() => onSelectConversation(conversation)}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;
