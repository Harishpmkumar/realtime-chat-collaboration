import { useEffect, useRef } from "react";

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
} from "@fortawesome/free-solid-svg-icons";

import useAuth from "../hooks/useAuth";

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

  const messagesEndRef = useRef(null);

  // =========================================================
  // AUTO SCROLL TO LATEST MESSAGE
  // =========================================================

  useEffect(() => {
    if (!messages || messages.length === 0) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  // =========================================================
  // EMPTY STATE
  // =========================================================

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

  // =========================================================
  // MESSAGE LIST
  // =========================================================

  return (
    <div
      className="flex-grow-1 overflow-auto bg-light p-3"
      style={{
        minHeight: 0,
      }}
    >
      <div className="d-flex flex-column gap-2">
        {messages.map((message) => {
          const senderId = message.sender?._id || message.sender;

          const currentUserId = user?.id || user?._id;

          const isOwnMessage =
            senderId?.toString() === currentUserId?.toString();

          const attachment = message.attachment;

          const isImage = message.messageType === "image" && attachment?.url;

          const isFile = message.messageType === "file" && attachment?.url;

          return (
            <div
              key={message._id}
              className={`d-flex ${
                isOwnMessage ? "justify-content-end" : "justify-content-start"
              }`}
            >
              <div
                className={`px-3 py-2 rounded-4 ${
                  isOwnMessage ? "bg-primary text-white" : "bg-white border"
                }`}
                style={{
                  maxWidth: "75%",
                  minWidth: "80px",
                }}
              >
                {/* IMAGE ATTACHMENT */}

                {isImage && (
                  <div className="mb-2">
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      title="Open image"
                    >
                      <img
                        src={attachment.url}
                        alt={attachment.originalName || "Attachment"}
                        className="img-fluid rounded-3"
                        style={{
                          maxWidth: "320px",
                          maxHeight: "320px",
                          objectFit: "cover",
                          cursor: "pointer",
                        }}
                      />
                    </a>
                  </div>
                )}

                {/* FILE ATTACHMENT */}

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
                        size="lg"
                      />
                    </div>

                    <div className="flex-grow-1 overflow-hidden">
                      <div className="fw-semibold small text-truncate">
                        {attachment.originalName || "Attachment"}
                      </div>

                      <div
                        className={`small ${
                          isOwnMessage ? "text-white-50" : "text-muted"
                        }`}
                      >
                        {formatFileSize(attachment.size)}
                      </div>
                    </div>

                    <FontAwesomeIcon
                      icon={faDownload}
                      className="flex-shrink-0"
                    />
                  </a>
                )}

                {/* TEXT */}

                {message.content && (
                  <div
                    className="small"
                    style={{
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {message.content}
                  </div>
                )}

                {/* TIME + READ STATUS */}

                <div
                  className={`d-flex justify-content-end align-items-center gap-1 small mt-1 ${
                    isOwnMessage ? "text-white-50" : "text-muted"
                  }`}
                >
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
                      title={message.isRead ? "Read" : "Sent"}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* AUTO SCROLL TARGET */}

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
