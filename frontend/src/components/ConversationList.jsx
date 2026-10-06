import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faComments,
  faPlus,
  faUserGroup,
} from "@fortawesome/free-solid-svg-icons";

import ConversationItem from "./ConversationItem";

const ConversationList = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  currentUserId,
  onNewConversation,
  onNewGroup,
}) => {
  return (
    <div className="conversation-list-shell">
      {/* HEADER */}

      <div className="conversation-list-header">
        <div className="d-flex align-items-center">
          <div className="conversation-list-icon">
            <FontAwesomeIcon icon={faComments} />
          </div>

          <div className="flex-grow-1 min-width-0">
            <h5 className="conversation-list-title">Messages</h5>

            <div className="conversation-list-count">
              {conversations.length} conversation
              {conversations.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="conversation-header-action"
              onClick={onNewGroup}
              title="Create group"
            >
              <FontAwesomeIcon icon={faUserGroup} />
            </button>

            <button
              type="button"
              className="conversation-header-action primary"
              onClick={onNewConversation}
              title="New conversation"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
        </div>
      </div>

      {/* LIST */}

      <div className="conversation-list-scroll">
        {conversations.length === 0 ? (
          <div className="conversation-empty-state">
            <div className="conversation-empty-icon">
              <FontAwesomeIcon icon={faComments} />
            </div>

            <h6>No conversations yet</h6>

            <p>Start chatting with someone or create a group.</p>

            <div className="d-flex justify-content-center gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-primary btn-sm rounded-3"
                onClick={onNewConversation}
              >
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                New chat
              </button>

              <button
                type="button"
                className="btn btn-outline-primary btn-sm rounded-3"
                onClick={onNewGroup}
              >
                <FontAwesomeIcon icon={faUserGroup} className="me-2" />
                Group
              </button>
            </div>
          </div>
        ) : (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation._id}
              conversation={conversation}
              currentUserId={currentUserId}
              selected={selectedConversation?._id === conversation._id}
              onClick={() => onSelectConversation(conversation)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;
