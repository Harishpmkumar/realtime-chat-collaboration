import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faCircle,
  faCircleNotch,
  faComments,
  faMagnifyingGlass,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import api from "../services/api";

const NewConversationModal = ({
  show,
  onClose,
  onConversationCreated,
  currentUserId,
}) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creatingConversationId, setCreatingConversationId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!show) {
      return;
    }

    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        setError("");

        const response = await api.get("/users");

        const loadedUsers =
          response.data?.users ||
          response.data?.data?.users ||
          response.data?.data ||
          [];

        setUsers(Array.isArray(loadedUsers) ? loadedUsers : []);
      } catch (error) {
        console.error("Load users error:", error);

        setError(error.message || "Failed to load users");
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, [show]);

  useEffect(() => {
    if (!show) {
      setSearch("");
      setError("");
      setCreatingConversationId(null);
    }
  }, [show]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users
      .filter((user) => {
        const userId = user._id?.toString() || user.id?.toString();

        return userId && userId !== currentUserId?.toString();
      })
      .filter((user) => {
        if (!normalizedSearch) {
          return true;
        }

        const name = user.name?.toLowerCase() || "";

        const email = user.email?.toLowerCase() || "";

        return (
          name.includes(normalizedSearch) || email.includes(normalizedSearch)
        );
      });
  }, [users, search, currentUserId]);

  const handleStartConversation = async (selectedUser) => {
    const participantId = selectedUser._id || selectedUser.id;

    if (!participantId) {
      return;
    }

    try {
      setCreatingConversationId(participantId.toString());

      setError("");

      const response = await api.post("/conversations", {
        participantId,
      });

      const conversation =
        response.data?.conversation || response.data?.data?.conversation;

      if (!conversation) {
        throw new Error("Invalid conversation response from server");
      }

      onConversationCreated(conversation);

      onClose();
    } catch (error) {
      console.error("Create conversation error:", error);

      setError(error.message || "Failed to create conversation");
    } finally {
      setCreatingConversationId(null);
    }
  };

  const handleClose = () => {
    if (creatingConversationId) {
      return;
    }

    onClose();
  };

  if (!show) {
    return null;
  }

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
          <div
            className="modal-content border-0 shadow-lg overflow-hidden"
            style={{
              borderRadius: "20px",
            }}
          >
            {/* Header */}
            <div
              className="px-4 py-4"
              style={{
                background: "linear-gradient(135deg, #635bff 0%, #4f46e5 100%)",
              }}
            >
              <div className="d-flex align-items-center">
                <div
                  className="bg-white bg-opacity-25 text-white rounded-4 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: "54px",
                    height: "54px",
                  }}
                >
                  <FontAwesomeIcon icon={faComments} size="lg" />
                </div>

                <div className="ms-3 flex-grow-1">
                  <h5 className="text-white fw-bold mb-1">
                    Start a new conversation
                  </h5>

                  <p className="text-white-50 mb-0 small">
                    Find someone and start chatting instantly.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-light rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                  style={{
                    width: "38px",
                    height: "38px",
                  }}
                  onClick={handleClose}
                  disabled={Boolean(creatingConversationId)}
                  aria-label="Close"
                  title="Close"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="px-4 pt-4 pb-3 bg-white">
              <label className="form-label small fw-semibold text-dark mb-2">
                Find a person
              </label>

              <div className="position-relative">
                <div
                  className="position-absolute top-50 translate-middle-y d-flex align-items-center justify-content-center text-muted"
                  style={{
                    left: "15px",
                    width: "20px",
                    height: "20px",
                    pointerEvents: "none",
                    zIndex: 2,
                  }}
                >
                  <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    style={{
                      fontSize: "14px",
                    }}
                  />
                </div>

                <input
                  type="text"
                  className="form-control ps-5 pe-5 new-conversation-search"
                  placeholder="Search by name or email"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  autoFocus
                />

                {search && (
                  <button
                    type="button"
                    className="position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent text-muted d-flex align-items-center justify-content-center me-2 new-conversation-clear-btn"
                    onClick={() => setSearch("")}
                    title="Clear search"
                    style={{
                      width: "30px",
                      height: "30px",
                      zIndex: 2,
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faXmark}
                      style={{
                        fontSize: "13px",
                      }}
                    />
                  </button>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="px-4">
                <div className="alert alert-danger d-flex align-items-center py-2 px-3 small rounded-3">
                  {error}
                </div>
              </div>
            )}

            {/* User List */}
            <div
              className="px-3 pb-3"
              style={{
                maxHeight: "430px",
                overflowY: "auto",
              }}
            >
              {loadingUsers ? (
                <div className="py-5 text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading users...</span>
                  </div>

                  <p className="text-muted mt-3 mb-0">Finding users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-5 text-center">
                  <div
                    className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto mb-3"
                    style={{
                      width: "72px",
                      height: "72px",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faUser}
                      size="2x"
                      className="text-secondary"
                    />
                  </div>

                  <h6 className="fw-bold mb-2">No users found</h6>

                  <p className="text-muted small mb-0">
                    Try another name or email address.
                  </p>
                </div>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-center px-2 mb-2">
                    <small className="text-muted">
                      {filteredUsers.length} user
                      {filteredUsers.length !== 1 ? "s" : ""} available
                    </small>

                    {search && (
                      <small className="text-primary fw-semibold text-truncate ms-3">
                        Searching for "{search}"
                      </small>
                    )}
                  </div>

                  <div className="d-flex flex-column gap-2">
                    {filteredUsers.map((user) => {
                      const userId = user._id || user.id;

                      const isCreating =
                        creatingConversationId === userId?.toString();

                      const displayName = user.name || "Unknown User";

                      const firstLetter =
                        displayName.charAt(0).toUpperCase() || "U";

                      return (
                        <div
                          key={userId}
                          className="p-3 border rounded-4 d-flex align-items-center user-conversation-card"
                        >
                          {/* Avatar */}
                          <div
                            className="position-relative flex-shrink-0"
                            style={{
                              width: "52px",
                              height: "52px",
                            }}
                          >
                            {user.profileImage ? (
                              <img
                                src={user.profileImage}
                                alt={displayName}
                                className="rounded-circle w-100 h-100"
                                style={{
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <div
                                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                                style={{
                                  width: "52px",
                                  height: "52px",
                                }}
                              >
                                {firstLetter}
                              </div>
                            )}

                            {user.isOnline && (
                              <span
                                className="position-absolute bg-success border border-white rounded-circle"
                                style={{
                                  width: "13px",
                                  height: "13px",
                                  right: "0",
                                  bottom: "0",
                                }}
                                title="Online"
                              ></span>
                            )}
                          </div>

                          {/* User Details */}
                          <div className="ms-3 flex-grow-1 min-width-0">
                            <div className="d-flex align-items-center">
                              <h6 className="fw-semibold mb-1 text-truncate">
                                {displayName}
                              </h6>

                              {user.isOnline && (
                                <span className="badge bg-success-subtle text-success ms-2 d-none d-sm-inline-block">
                                  <FontAwesomeIcon
                                    icon={faCircle}
                                    style={{
                                      fontSize: "6px",
                                    }}
                                    className="me-1"
                                  />
                                  Online
                                </span>
                              )}
                            </div>

                            <p className="text-muted small mb-0 text-truncate">
                              {user.email}
                            </p>

                            {!user.isOnline && (
                              <small className="text-muted">Offline</small>
                            )}
                          </div>

                          {/* Chat Button */}
                          <button
                            type="button"
                            className="btn btn-primary d-flex align-items-center justify-content-center ms-3 flex-shrink-0 new-conversation-chat-btn"
                            onClick={() => handleStartConversation(user)}
                            disabled={Boolean(creatingConversationId)}
                            title={`Start chat with ${displayName}`}
                            aria-label={`Start chat with ${displayName}`}
                          >
                            {isCreating ? (
                              <FontAwesomeIcon icon={faCircleNotch} spin />
                            ) : (
                              <FontAwesomeIcon
                                icon={faArrowRight}
                                style={{
                                  fontSize: "14px",
                                }}
                              />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-top bg-light d-flex justify-content-between align-items-center">
              <small className="text-muted d-none d-sm-block">
                Select a user to open your conversation.
              </small>

              <button
                type="button"
                className="btn btn-outline-secondary rounded-pill px-4 ms-auto"
                onClick={handleClose}
                disabled={Boolean(creatingConversationId)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal-backdrop fade show"
        style={{
          backgroundColor: "rgba(15, 23, 42, 0.65)",
        }}
      ></div>
    </>
  );
};

export default NewConversationModal;
