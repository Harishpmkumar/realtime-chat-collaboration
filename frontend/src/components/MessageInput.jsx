import { useEffect, useRef, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faPaperclip,
  faFaceSmile,
  faPaperPlane,
  faXmark,
  faFile,
  faImage,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

import api from "../services/api";
import useSocket from "../hooks/useSocket";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const allowedExtensions = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "pdf",
  "txt",
  "csv",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "zip",
];

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

const MessageInput = ({ onSend, conversationId }) => {
  const { socket } = useSocket();

  const [message, setMessage] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);

  const [previewUrl, setPreviewUrl] = useState("");

  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");

  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (socket && conversationId && isTypingRef.current) {
        socket.emit("stop_typing", conversationId);

        isTypingRef.current = false;
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [socket, conversationId, previewUrl]);

  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (socket && conversationId && isTypingRef.current) {
      socket.emit("stop_typing", conversationId);

      isTypingRef.current = false;
    }
  };

  const handleTyping = (value) => {
    setMessage(value);

    if (!socket || !conversationId) {
      return;
    }

    if (value.trim() && !isTypingRef.current) {
      socket.emit("typing", conversationId);

      isTypingRef.current = true;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (!value.trim()) {
      socket.emit("stop_typing", conversationId);

      isTypingRef.current = false;

      return;
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", conversationId);

      isTypingRef.current = false;
    }, 1500);
  };

  const clearSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl("");
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");

    const extension = file.name.split(".").pop()?.toLowerCase() || "";

    if (!allowedExtensions.includes(extension)) {
      setError("Unsupported file type.");

      event.target.value = "";

      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be 10 MB or less.");

      event.target.value = "";

      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const objectUrl = URL.createObjectURL(file);

      setPreviewUrl(objectUrl);
    } else {
      setPreviewUrl("");
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      return null;
    }

    const formData = new FormData();

    formData.append("file", selectedFile);

    const response = await api.postFormData("/messages/upload", formData);

    return {
      attachment: response.data?.attachment,

      messageType: response.data?.messageType,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage && !selectedFile) {
      return;
    }

    if (uploading) {
      return;
    }

    try {
      setUploading(true);
      setError("");

      let attachment = null;

      let messageType = "text";

      if (selectedFile) {
        const uploadResult = await uploadFile();

        attachment = uploadResult?.attachment || null;

        messageType = uploadResult?.messageType || "file";
      }

      onSend({
        content: trimmedMessage,

        messageType,

        attachment,
      });

      setMessage("");

      clearSelectedFile();

      stopTyping();
    } catch (error) {
      console.error("Attachment send error:", error);

      setError(error.message || "Failed to send attachment");
    } finally {
      setUploading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      handleSubmit(event);
    }
  };

  const isImageFile = selectedFile?.type?.startsWith("image/");

  const canSend = Boolean(message.trim()) || Boolean(selectedFile);

  return (
    <div className="border-top bg-white p-3">
      {error && (
        <div className="alert alert-danger py-2 small mb-2">{error}</div>
      )}

      {selectedFile && (
        <div className="mb-3">
          <div
            className="border rounded-3 p-2 d-flex align-items-center gap-3 bg-light"
            style={{
              maxWidth: "500px",
            }}
          >
            {isImageFile && previewUrl ? (
              <img
                src={previewUrl}
                alt={selectedFile.name}
                className="rounded"
                style={{
                  width: "64px",
                  height: "64px",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                className="rounded bg-white border d-flex align-items-center justify-content-center text-primary flex-shrink-0"
                style={{
                  width: "64px",
                  height: "64px",
                }}
              >
                <FontAwesomeIcon
                  icon={isImageFile ? faImage : faFile}
                  size="lg"
                />
              </div>
            )}

            <div className="flex-grow-1 overflow-hidden">
              <div className="fw-semibold small text-truncate">
                {selectedFile.name}
              </div>

              <div className="small text-muted">
                {formatFileSize(selectedFile.size)}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-light rounded-circle"
              onClick={clearSelectedFile}
              disabled={uploading}
              title="Remove attachment"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="d-flex align-items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="d-none"
            accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.zip"
            onChange={handleFileChange}
          />

          <button
            type="button"
            className="btn btn-light rounded-circle flex-shrink-0"
            style={{
              width: "42px",
              height: "42px",
            }}
            title="Attach file"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <FontAwesomeIcon icon={faPaperclip} />
          </button>

          <div className="flex-grow-1 position-relative">
            <textarea
              value={message}
              onChange={(event) => handleTyping(event.target.value)}
              onKeyDown={handleKeyDown}
              className="form-control"
              rows="1"
              placeholder="Type a message..."
              disabled={uploading}
              style={{
                resize: "none",
                paddingRight: "45px",
                maxHeight: "120px",
              }}
            />

            <button
              type="button"
              className="btn btn-link text-muted position-absolute end-0 bottom-0 mb-1 me-1"
              title="Emoji"
              disabled={uploading}
            >
              <FontAwesomeIcon icon={faFaceSmile} />
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center"
            style={{
              width: "42px",
              height: "42px",
            }}
            disabled={!canSend || uploading}
            title="Send message"
          >
            {uploading ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faPaperPlane} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
