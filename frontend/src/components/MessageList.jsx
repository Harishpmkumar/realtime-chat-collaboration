import { useEffect, useRef, useState } from "react";

import { createPortal } from "react-dom";

import EmojiPicker from "emoji-picker-react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faComments,
  faCheck,
  faCheckDouble,
  faFile,
  faFilePdf,
  faFileWord,
  faFileExcel,
  faFileZipper,
  faDownload,
  faEllipsisVertical,
  faFaceSmile,
  faPen,
  faTrash,
  faXmark,
  faPlus,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

import useAuth from "../hooks/useAuth";
import useSocket from "../hooks/useSocket";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) {
    return "";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (mimeType = "") => {
  if (mimeType === "application/pdf") {
    return faFilePdf;
  }

  if (mimeType.includes("word") || mimeType.includes("document")) {
    return faFileWord;
  }

  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {
    return faFileExcel;
  }

  if (mimeType.includes("zip")) {
    return faFileZipper;
  }

  return faFile;
};

const MessageList = ({ messages, conversation }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const messagesEndRef = useRef(null);

  const previousLastMessageIdRef = useRef(null);

  const [actionMessageId, setActionMessageId] = useState(null);

  const [reactionMessageId, setReactionMessageId] = useState(null);

  const [fullReactionPicker, setFullReactionPicker] = useState(null);

  const [editingMessageId, setEditingMessageId] = useState(null);

  const [editValue, setEditValue] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);

  const currentUserId = user?.id || user?._id;

  const isGroup = conversation?.type === "group";

  const lastMessageId = messages?.length
    ? messages[messages.length - 1]?._id
    : null;

  useEffect(() => {
    if (!lastMessageId) {
      return;
    }

    if (previousLastMessageIdRef.current === lastMessageId) {
      return;
    }

    previousLastMessageIdRef.current = lastMessageId;

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [lastMessageId]);

  useEffect(() => {
    if (!fullReactionPicker) {
      return;
    }

    const closePicker = () => {
      setFullReactionPicker(null);
    };

    window.addEventListener("resize", closePicker);

    return () => {
      window.removeEventListener("resize", closePicker);
    };
  }, [fullReactionPicker]);

  const handleReaction = (messageId, emoji) => {
    if (!socket) {
      return;
    }

    socket.emit("react_message", {
      messageId,
      emoji,
    });

    setReactionMessageId(null);
    setFullReactionPicker(null);
    setActionMessageId(null);
  };

  const openFullReactionPicker = (event, messageId) => {
    const rect = event.currentTarget.getBoundingClientRect();

    const width = Math.min(330, window.innerWidth - 24);

    const height = Math.min(400, window.innerHeight - 40);

    let left = rect.left;

    if (left + width > window.innerWidth - 12) {
      left = window.innerWidth - width - 12;
    }

    left = Math.max(12, left);

    let top = rect.top - height - 10;

    if (top < 12) {
      top = rect.bottom + 10;
    }

    if (top + height > window.innerHeight - 12) {
      top = Math.max(12, window.innerHeight - height - 12);
    }

    setFullReactionPicker({
      messageId,
      left,
      top,
      width,
      height,
    });

    setReactionMessageId(null);
  };

  const startEditing = (message) => {
    setEditingMessageId(message._id);

    setEditValue(message.content || "");

    setActionMessageId(null);
    setReactionMessageId(null);
    setFullReactionPicker(null);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditValue("");
  };

  const saveEdit = (messageId) => {
    const value = editValue.trim();

    if (!value || !socket) {
      return;
    }

    socket.emit("edit_message", {
      messageId,
      content: value,
    });

    cancelEditing();
  };

  const requestDelete = (message) => {
    setDeleteTarget(message);

    setActionMessageId(null);
    setReactionMessageId(null);
    setFullReactionPicker(null);
  };

  const confirmDelete = () => {
    if (!socket || !deleteTarget) {
      return;
    }

    socket.emit("delete_message", deleteTarget._id);

    setDeleteTarget(null);
  };

  if (!messages || messages.length === 0) {
    return (
      <div className="message-list-empty">
        <div className="message-empty-icon">
          <FontAwesomeIcon icon={faComments} />
        </div>

        <h5>Start the conversation</h5>

        <p>Send a message, emoji, image or file to begin chatting.</p>
      </div>
    );
  }

  return (
    <>
      <div
        className="message-list-final"
        onScroll={() => {
          if (fullReactionPicker) {
            setFullReactionPicker(null);
          }
        }}
      >
        <div className="message-list-inner">
          {messages.map((message) => {
            const senderId = message.sender?._id || message.sender;

            const isOwnMessage =
              senderId?.toString() === currentUserId?.toString();

            const attachment = message.attachment;

            const isImage =
              !message.isDeleted &&
              message.messageType === "image" &&
              attachment?.url;

            const isFile =
              !message.isDeleted &&
              message.messageType === "file" &&
              attachment?.url;

            const isEditing = editingMessageId === message._id;

            const showActions = actionMessageId === message._id;

            const showReactions = reactionMessageId === message._id;

            const senderName = message.sender?.name || "User";

            return (
              <div
                key={message._id}
                className={`message-row ${
                  isOwnMessage ? "message-row-own" : "message-row-received"
                }`}
              >
                <div className="message-stack">
                  {isGroup && !isOwnMessage && !message.isDeleted && (
                    <div className="message-sender-name">{senderName}</div>
                  )}

                  <div
                    className={`message-bubble ${
                      isOwnMessage
                        ? "message-bubble-own"
                        : "message-bubble-received"
                    } ${message.isDeleted ? "message-bubble-deleted" : ""}`}
                  >
                    {message.isDeleted ? (
                      <div className="message-deleted-text">
                        <FontAwesomeIcon icon={faTrash} className="me-2" />
                        This message was deleted
                      </div>
                    ) : (
                      <>
                        {isImage && (
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="message-image-link"
                          >
                            <img
                              src={attachment.url}
                              alt={attachment.originalName || "Attachment"}
                              className="message-image"
                            />
                          </a>
                        )}

                        {isFile && (
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className={`message-file-card ${
                              isOwnMessage ? "message-file-card-own" : ""
                            }`}
                          >
                            <div className="message-file-icon">
                              <FontAwesomeIcon
                                icon={getFileIcon(attachment.mimeType)}
                              />
                            </div>

                            <div className="message-file-info">
                              <strong>{attachment.originalName}</strong>

                              <span>{formatFileSize(attachment.size)}</span>
                            </div>

                            <div className="message-file-download">
                              <FontAwesomeIcon icon={faDownload} />
                            </div>
                          </a>
                        )}

                        {isEditing ? (
                          <div className="message-edit-wrapper">
                            <textarea
                              value={editValue}
                              autoFocus
                              rows="2"
                              maxLength={5000}
                              onChange={(event) =>
                                setEditValue(event.target.value)
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Escape") {
                                  cancelEditing();
                                }

                                if (event.key === "Enter" && !event.shiftKey) {
                                  event.preventDefault();

                                  saveEdit(message._id);
                                }
                              }}
                            />

                            <div className="message-edit-actions">
                              <button
                                type="button"
                                className="message-edit-cancel"
                                title="Cancel"
                                onClick={cancelEditing}
                              >
                                <FontAwesomeIcon icon={faXmark} />
                              </button>

                              <button
                                type="button"
                                className="message-edit-save"
                                title="Save"
                                disabled={!editValue.trim()}
                                onClick={() => saveEdit(message._id)}
                              >
                                <FontAwesomeIcon icon={faCheck} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          message.content && (
                            <div className="message-content">
                              {message.content}
                            </div>
                          )
                        )}
                      </>
                    )}

                    <div className="message-meta">
                      {message.isEdited && !message.isDeleted && (
                        <span className="message-edited-label">edited</span>
                      )}

                      <span>
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {isOwnMessage && (
                        <FontAwesomeIcon
                          icon={message.isRead ? faCheckDouble : faCheck}
                          className={message.isRead ? "message-read-icon" : ""}
                        />
                      )}
                    </div>
                  </div>

                  {!message.isDeleted && message.reactions?.length > 0 && (
                    <div
                      className={`message-reaction-chips ${
                        isOwnMessage ? "message-reaction-chips-own" : ""
                      }`}
                    >
                      {message.reactions.map((reaction) => {
                        const reactedByMe = reaction.users?.some(
                          (reactionUserId) =>
                            reactionUserId?.toString() ===
                            currentUserId?.toString(),
                        );

                        return (
                          <button
                            key={reaction.emoji}
                            type="button"
                            className={`message-reaction-chip ${
                              reactedByMe ? "active" : ""
                            }`}
                            onClick={() =>
                              handleReaction(message._id, reaction.emoji)
                            }
                          >
                            <span>{reaction.emoji}</span>

                            <strong>{reaction.users?.length}</strong>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {!message.isDeleted && !isEditing && (
                    <div
                      className={`message-action-area ${
                        isOwnMessage ? "message-action-area-own" : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="message-action-trigger"
                        title="Message actions"
                        onClick={() => {
                          setActionMessageId(showActions ? null : message._id);

                          setReactionMessageId(null);

                          setFullReactionPicker(null);
                        }}
                      >
                        <FontAwesomeIcon
                          icon={showActions ? faXmark : faEllipsisVertical}
                        />
                      </button>

                      {showActions && (
                        <div className="message-action-menu">
                          <button
                            type="button"
                            title="React"
                            onClick={() => {
                              setReactionMessageId(
                                showReactions ? null : message._id,
                              );
                            }}
                          >
                            <FontAwesomeIcon icon={faFaceSmile} />
                          </button>

                          {isOwnMessage && (
                            <>
                              <button
                                type="button"
                                title="Edit message"
                                onClick={() => startEditing(message)}
                              >
                                <FontAwesomeIcon icon={faPen} />
                              </button>

                              <button
                                type="button"
                                className="danger"
                                title="Delete message"
                                onClick={() => requestDelete(message)}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {showReactions && !message.isDeleted && (
                    <div
                      className={`message-quick-reactions ${
                        isOwnMessage ? "message-quick-reactions-own" : ""
                      }`}
                    >
                      {QUICK_REACTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleReaction(message._id, emoji)}
                        >
                          {emoji}
                        </button>
                      ))}

                      <span className="message-reaction-divider" />

                      <button
                        type="button"
                        className="message-more-reactions"
                        title="More reactions"
                        onClick={(event) =>
                          openFullReactionPicker(event, message._id)
                        }
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} className="message-list-end" />
        </div>
      </div>

      {fullReactionPicker &&
        createPortal(
          <div
            className="message-full-emoji-picker"
            style={{
              left: fullReactionPicker.left,
              top: fullReactionPicker.top,
              width: fullReactionPicker.width,
            }}
          >
            <EmojiPicker
              onEmojiClick={(emojiData) =>
                handleReaction(fullReactionPicker.messageId, emojiData.emoji)
              }
              width={fullReactionPicker.width}
              height={fullReactionPicker.height}
              searchPlaceHolder="Search reaction..."
              previewConfig={{
                showPreview: false,
              }}
              lazyLoadEmojis
            />
          </div>,
          document.body,
        )}

      {deleteTarget &&
        createPortal(
          <div
            className="message-delete-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setDeleteTarget(null);
              }
            }}
          >
            <div className="message-delete-modal">
              <div className="message-delete-icon">
                <FontAwesomeIcon icon={faTriangleExclamation} />
              </div>

              <h5>Delete message?</h5>

              <p>
                This message will be removed for everyone in this conversation.
              </p>

              <div className="message-delete-actions">
                <button
                  type="button"
                  className="message-delete-cancel"
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="message-delete-confirm"
                  onClick={confirmDelete}
                >
                  <FontAwesomeIcon icon={faTrash} className="me-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default MessageList;
