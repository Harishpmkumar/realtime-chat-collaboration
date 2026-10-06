import { useEffect, useRef, useState } from "react";

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
  faCheck as faSave,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

import EmojiPicker from "emoji-picker-react";

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

const MessageList = ({ messages }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const messagesEndRef = useRef(null);

  const [actionMessageId, setActionMessageId] = useState(null);

  const [reactionMessageId, setReactionMessageId] = useState(null);

  const [fullReactionPickerMessageId, setFullReactionPickerMessageId] =
    useState(null);

  const [editingMessageId, setEditingMessageId] = useState(null);

  const [editValue, setEditValue] = useState("");

  const currentUserId = user?.id || user?._id;

  useEffect(() => {
    if (!messages?.length) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  const handleReaction = (messageId, emoji) => {
    if (!socket) {
      return;
    }

    socket.emit("react_message", {
      messageId,
      emoji,
    });

    setReactionMessageId(null);
    setFullReactionPickerMessageId(null);
    setActionMessageId(null);
  };

  const handleFullEmojiReaction = (messageId, emojiData) => {
    handleReaction(messageId, emojiData.emoji);
  };

  const startEditing = (message) => {
    setEditingMessageId(message._id);

    setEditValue(message.content || "");

    setActionMessageId(null);
    setReactionMessageId(null);
    setFullReactionPickerMessageId(null);
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

  const handleDelete = (messageId) => {
    if (!socket) {
      return;
    }

    const confirmed = window.confirm("Delete this message?");

    if (!confirmed) {
      return;
    }

    socket.emit("delete_message", messageId);

    setActionMessageId(null);
    setReactionMessageId(null);
    setFullReactionPickerMessageId(null);
  };

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-grow-1 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center text-muted px-4">
          <div
            className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center mx-auto mb-3"
            style={{
              width: "70px",
              height: "70px",
            }}
          >
            <FontAwesomeIcon
              icon={faComments}
              size="2x"
              className="text-primary"
            />
          </div>

          <h6 className="fw-semibold">No messages yet</h6>

          <p className="mb-0">Send a message to start the conversation.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-grow-1 overflow-auto bg-light p-3"
      style={{
        minHeight: 0,
      }}
    >
      <div className="d-flex flex-column gap-3">
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

          const showFullReactionPicker =
            fullReactionPickerMessageId === message._id;

          return (
            <div
              key={message._id}
              className={`d-flex ${
                isOwnMessage ? "justify-content-end" : "justify-content-start"
              }`}
            >
              <div
                className="position-relative"
                style={{
                  maxWidth: "78%",
                }}
              >
                <div
                  className={`px-3 py-2 rounded-4 shadow-sm ${
                    isOwnMessage ? "bg-primary text-white" : "bg-white border"
                  }`}
                  style={{
                    minWidth: "90px",
                  }}
                >
                  {message.isDeleted ? (
                    <div
                      className={`small fst-italic ${
                        isOwnMessage ? "text-white-50" : "text-muted"
                      }`}
                    >
                      This message was deleted
                    </div>
                  ) : (
                    <>
                      {isImage && (
                        <div className="mb-2">
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <img
                              src={attachment.url}
                              alt={attachment.originalName || "Attachment"}
                              className="img-fluid rounded-3"
                              style={{
                                maxWidth: "320px",
                                maxHeight: "320px",
                                objectFit: "cover",
                              }}
                            />
                          </a>
                        </div>
                      )}

                      {isFile && (
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`text-decoration-none d-flex align-items-center gap-3 p-2 rounded-3 mb-2 ${
                            isOwnMessage
                              ? "bg-white bg-opacity-10 text-white"
                              : "bg-light text-dark"
                          }`}
                          style={{
                            minWidth: "220px",
                          }}
                        >
                          <div
                            className={`rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 ${
                              isOwnMessage
                                ? "bg-white bg-opacity-25"
                                : "bg-white border"
                            }`}
                            style={{
                              width: "46px",
                              height: "46px",
                            }}
                          >
                            <FontAwesomeIcon
                              icon={getFileIcon(attachment.mimeType)}
                            />
                          </div>

                          <div className="flex-grow-1 overflow-hidden">
                            <div className="fw-semibold small text-truncate">
                              {attachment.originalName}
                            </div>

                            <small
                              className={
                                isOwnMessage ? "text-white-50" : "text-muted"
                              }
                            >
                              {formatFileSize(attachment.size)}
                            </small>
                          </div>

                          <FontAwesomeIcon icon={faDownload} />
                        </a>
                      )}

                      {isEditing ? (
                        <div>
                          <textarea
                            className="form-control form-control-sm"
                            value={editValue}
                            autoFocus
                            rows="2"
                            maxLength={5000}
                            onChange={(event) =>
                              setEditValue(event.target.value)
                            }
                          />

                          <div className="d-flex justify-content-end gap-2 mt-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: "32px",
                                height: "32px",
                              }}
                              title="Cancel edit"
                              onClick={cancelEditing}
                            >
                              <FontAwesomeIcon icon={faXmark} />
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-success rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: "32px",
                                height: "32px",
                              }}
                              title="Save changes"
                              disabled={!editValue.trim()}
                              onClick={() => saveEdit(message._id)}
                            >
                              <FontAwesomeIcon icon={faSave} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        message.content && (
                          <div
                            className="small"
                            style={{
                              whiteSpace: "pre-wrap",

                              overflowWrap: "anywhere",
                            }}
                          >
                            {message.content}
                          </div>
                        )
                      )}
                    </>
                  )}

                  <div
                    className={`d-flex justify-content-end align-items-center gap-1 small mt-1 ${
                      isOwnMessage ? "text-white-50" : "text-muted"
                    }`}
                  >
                    {message.isEdited && !message.isDeleted && (
                      <span
                        style={{
                          fontSize: "10px",
                        }}
                      >
                        edited
                      </span>
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
                        className={message.isRead ? "text-info" : ""}
                      />
                    )}
                  </div>
                </div>

                {!message.isDeleted && message.reactions?.length > 0 && (
                  <div
                    className={`d-flex flex-wrap gap-1 mt-1 ${
                      isOwnMessage
                        ? "justify-content-end"
                        : "justify-content-start"
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
                          className={`btn btn-sm rounded-pill py-0 px-2 ${
                            reactedByMe ? "btn-primary" : "btn-light border"
                          }`}
                          onClick={() =>
                            handleReaction(message._id, reaction.emoji)
                          }
                        >
                          <span>{reaction.emoji}</span>

                          <span className="ms-1 small">
                            {reaction.users?.length}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {!message.isDeleted && !isEditing && (
                  <div
                    className={`d-flex align-items-center gap-1 mt-1 ${
                      isOwnMessage
                        ? "justify-content-end"
                        : "justify-content-start"
                    }`}
                  >
                    <button
                      type="button"
                      className="btn btn-sm btn-light border rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: "28px",
                        height: "28px",
                      }}
                      title="Message actions"
                      onClick={() => {
                        setActionMessageId(showActions ? null : message._id);

                        setReactionMessageId(null);

                        setFullReactionPickerMessageId(null);
                      }}
                    >
                      <FontAwesomeIcon
                        icon={showActions ? faXmark : faEllipsisVertical}
                        size="xs"
                      />
                    </button>

                    {showActions && (
                      <>
                        <button
                          type="button"
                          className="btn btn-sm btn-light border rounded-circle"
                          title="React"
                          onClick={() => {
                            setReactionMessageId(
                              showReactions ? null : message._id,
                            );

                            setFullReactionPickerMessageId(null);
                          }}
                        >
                          <FontAwesomeIcon icon={faFaceSmile} />
                        </button>

                        {isOwnMessage && (
                          <>
                            <button
                              type="button"
                              className="btn btn-sm btn-light border rounded-circle"
                              title="Edit"
                              onClick={() => startEditing(message)}
                            >
                              <FontAwesomeIcon icon={faPen} />
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-light border text-danger rounded-circle"
                              title="Delete"
                              onClick={() => handleDelete(message._id)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}

                {showReactions && !message.isDeleted && (
                  <div
                    className={`position-absolute bg-white border rounded-pill shadow-sm p-1 d-flex align-items-center gap-1 ${
                      isOwnMessage ? "end-0" : "start-0"
                    }`}
                    style={{
                      bottom: "-43px",
                      zIndex: 30,
                    }}
                  >
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="btn btn-sm border-0 px-1"
                        style={{
                          fontSize: "19px",
                        }}
                        onClick={() => handleReaction(message._id, emoji)}
                      >
                        {emoji}
                      </button>
                    ))}

                    <div
                      style={{
                        width: "1px",
                        height: "22px",
                        background: "#dee2e6",
                      }}
                    />

                    <button
                      type="button"
                      className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: "30px",
                        height: "30px",
                      }}
                      title="More reactions"
                      onClick={() =>
                        setFullReactionPickerMessageId(
                          showFullReactionPicker ? null : message._id,
                        )
                      }
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>
                )}

                {showFullReactionPicker && !message.isDeleted && (
                  <div
                    className={`position-absolute shadow rounded-3 ${
                      isOwnMessage ? "end-0" : "start-0"
                    }`}
                    style={{
                      bottom: "-470px",
                      zIndex: 50,
                    }}
                  >
                    <EmojiPicker
                      onEmojiClick={(emojiData) =>
                        handleFullEmojiReaction(message._id, emojiData)
                      }
                      width={330}
                      height={400}
                      searchPlaceHolder="Search reaction..."
                      previewConfig={{
                        showPreview: false,
                      }}
                      lazyLoadEmojis
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div
          ref={messagesEndRef}
          style={{
            height: "1px",
          }}
        />
      </div>
    </div>
  );
};

export default MessageList;
