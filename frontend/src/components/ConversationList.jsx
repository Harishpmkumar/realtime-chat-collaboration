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
    <div className="bg-white h-100 d-flex flex-column">
      <div className="px-3 py-3 border-bottom">
        <div className="d-flex align-items-center">
          <div
            className="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center me-3 flex-shrink-0"
            style={{
              width: "42px",
              height: "42px",
            }}
          >
            <FontAwesomeIcon icon={faComments} />
          </div>

          <div className="flex-grow-1 min-width-0">
            <h5 className="mb-1 fw-bold">Chats</h5>

            <small className="text-muted">
              {conversations.length} conversation
              {conversations.length !== 1 ? "s" : ""}
            </small>
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-light border rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
              style={{
                width: "40px",
                height: "40px",
              }}
              onClick={onNewGroup}
              title="Create group"
            >
              <FontAwesomeIcon icon={faUserGroup} className="text-primary" />
            </button>

            <button
              type="button"
              className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm flex-shrink-0"
              style={{
                width: "42px",
                height: "42px",
              }}
              onClick={onNewConversation}
              title="New conversation"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow-1 overflow-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-muted">
            <div
              className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto mb-3"
              style={{
                width: "70px",
                height: "70px",
              }}
            >
              <FontAwesomeIcon
                icon={faComments}
                size="2x"
                className="text-secondary"
              />
            </div>

            <h6 className="fw-semibold">No conversations</h6>

            <p className="small mb-3">
              Start a new conversation or create a group.
            </p>

            <div className="d-flex justify-content-center gap-2">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onNewConversation}
              >
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                New Chat
              </button>

              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
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
