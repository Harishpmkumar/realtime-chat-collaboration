import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCircle,
  faCircleNotch,
  faMagnifyingGlass,
  faUserGroup,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import api from "../services/api";

const CreateGroupModal = ({ show, onClose, onGroupCreated, currentUserId }) => {
  const [users, setUsers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creating, setCreating] = useState(false);
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
      setGroupName("");
      setDescription("");
      setSearch("");
      setSelectedUsers([]);
      setError("");
      setCreating(false);
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

  const isSelected = (userId) => {
    return selectedUsers.some(
      (user) => (user._id || user.id).toString() === userId.toString(),
    );
  };

  const toggleUser = (user) => {
    const userId = user._id || user.id;

    if (!userId) {
      return;
    }

    setSelectedUsers((previousUsers) => {
      const exists = previousUsers.some(
        (selectedUser) =>
          (selectedUser._id || selectedUser.id).toString() ===
          userId.toString(),
      );

      if (exists) {
        return previousUsers.filter(
          (selectedUser) =>
            (selectedUser._id || selectedUser.id).toString() !==
            userId.toString(),
        );
      }

      return [...previousUsers, user];
    });
  };

  const removeSelectedUser = (userId) => {
    setSelectedUsers((previousUsers) =>
      previousUsers.filter(
        (user) => (user._id || user.id).toString() !== userId.toString(),
      ),
    );
  };

  const handleCreateGroup = async () => {
    const trimmedName = groupName.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setError("Group name is required.");
      return;
    }

    if (selectedUsers.length === 0) {
      setError("Select at least one member.");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const participantIds = selectedUsers.map((user) => user._id || user.id);

      const response = await api.post("/conversations/group", {
        name: trimmedName,
        description: trimmedDescription,
        participantIds,
      });

      const conversation =
        response.data?.conversation || response.data?.data?.conversation;

      if (!conversation) {
        throw new Error("Invalid group response from server");
      }

      onGroupCreated(conversation);
      onClose();
    } catch (error) {
      console.error("Create group error:", error);

      setError(error.message || "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (creating) {
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
                  <FontAwesomeIcon icon={faUserGroup} size="lg" />
                </div>

                <div className="ms-3 flex-grow-1">
                  <h5 className="text-white fw-bold mb-1">Create a group</h5>

                  <p className="text-white-50 mb-0 small">
                    Create a group and start collaborating.
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
                  disabled={creating}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            </div>

            <div className="modal-body p-0">
              {/* Group information */}
              <div className="px-4 pt-4">
                <div className="mb-3">
                  <label className="form-label small fw-semibold">
                    Group name
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. MERN Development Team"
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">
                    Description
                    <span className="text-muted fw-normal ms-1">
                      (optional)
                    </span>
                  </label>

                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="What is this group about?"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    maxLength={500}
                    style={{
                      resize: "none",
                    }}
                  />
                </div>
              </div>

              {/* Selected members */}
              {selectedUsers.length > 0 && (
                <div className="px-4 pb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="fw-semibold">Selected members</small>

                    <span className="badge bg-primary rounded-pill">
                      {selectedUsers.length}
                    </span>
                  </div>

                  <div className="d-flex flex-wrap gap-2">
                    {selectedUsers.map((user) => {
                      const userId = user._id || user.id;

                      return (
                        <div
                          key={userId}
                          className="d-flex align-items-center bg-primary-subtle text-primary rounded-pill px-2 py-1"
                        >
                          <span
                            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                            style={{
                              width: "25px",
                              height: "25px",
                              fontSize: "11px",
                              fontWeight: "600",
                            }}
                          >
                            {user.name?.charAt(0).toUpperCase()}
                          </span>

                          <span
                            className="small fw-semibold text-truncate"
                            style={{
                              maxWidth: "130px",
                            }}
                          >
                            {user.name}
                          </span>

                          <button
                            type="button"
                            className="btn btn-sm p-0 ms-2 text-primary"
                            onClick={() => removeSelectedUser(userId)}
                          >
                            <FontAwesomeIcon
                              icon={faXmark}
                              style={{
                                fontSize: "11px",
                              }}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="px-4 pb-3">
                <label className="form-label small fw-semibold">
                  Add members
                </label>

                <div className="position-relative">
                  <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    className="position-absolute top-50 translate-middle-y text-muted"
                    style={{
                      left: "15px",
                    }}
                  />

                  <input
                    type="text"
                    className="form-control ps-5"
                    placeholder="Search users by name or email..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </div>

              {/* User list */}
              <div
                className="px-3 pb-3"
                style={{
                  maxHeight: "280px",
                  overflowY: "auto",
                }}
              >
                {loadingUsers ? (
                  <div className="py-4 text-center">
                    <div className="spinner-border text-primary">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-4 text-center text-muted">
                    <FontAwesomeIcon
                      icon={faUserGroup}
                      size="2x"
                      className="mb-2"
                    />

                    <p className="small mb-0">No users found.</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {filteredUsers.map((user) => {
                      const userId = user._id || user.id;

                      const selected = isSelected(userId);

                      const displayName = user.name || "Unknown User";

                      const firstLetter = displayName.charAt(0).toUpperCase();

                      return (
                        <button
                          key={userId}
                          type="button"
                          className={`w-100 border rounded-4 p-3 text-start d-flex align-items-center group-user-option ${
                            selected
                              ? "border-primary bg-primary-subtle"
                              : "bg-white"
                          }`}
                          onClick={() => toggleUser(user)}
                        >
                          <div
                            className="position-relative flex-shrink-0"
                            style={{
                              width: "46px",
                              height: "46px",
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
                                  width: "46px",
                                  height: "46px",
                                }}
                              >
                                {firstLetter}
                              </div>
                            )}

                            {user.isOnline && (
                              <span
                                className="position-absolute bg-success border border-white rounded-circle"
                                style={{
                                  width: "11px",
                                  height: "11px",
                                  right: "0",
                                  bottom: "0",
                                }}
                              />
                            )}
                          </div>

                          <div className="ms-3 flex-grow-1 min-width-0">
                            <div className="d-flex align-items-center">
                              <h6 className="mb-1 fw-semibold text-truncate">
                                {displayName}
                              </h6>

                              {user.isOnline && (
                                <small className="text-success ms-2 d-none d-sm-inline">
                                  <FontAwesomeIcon
                                    icon={faCircle}
                                    style={{
                                      fontSize: "6px",
                                    }}
                                    className="me-1"
                                  />
                                  Online
                                </small>
                              )}
                            </div>

                            <small className="text-muted text-truncate d-block">
                              {user.email}
                            </small>
                          </div>

                          <div
                            className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${
                              selected
                                ? "bg-primary text-white"
                                : "border text-muted"
                            }`}
                            style={{
                              width: "30px",
                              height: "30px",
                            }}
                          >
                            {selected && (
                              <FontAwesomeIcon
                                icon={faCheck}
                                style={{
                                  fontSize: "12px",
                                }}
                              />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="px-4 pb-3">
                  <div className="alert alert-danger py-2 mb-0 small rounded-3">
                    {error}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-top bg-light d-flex align-items-center justify-content-between">
              <div>
                <small className="text-muted">
                  {selectedUsers.length === 0
                    ? "Select members to continue"
                    : `${selectedUsers.length} member${
                        selectedUsers.length !== 1 ? "s" : ""
                      } selected`}
                </small>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-4"
                  onClick={handleClose}
                  disabled={creating}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-primary rounded-pill px-4"
                  onClick={handleCreateGroup}
                  disabled={
                    creating || !groupName.trim() || selectedUsers.length === 0
                  }
                >
                  {creating ? (
                    <>
                      <FontAwesomeIcon
                        icon={faCircleNotch}
                        spin
                        className="me-2"
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faUserGroup} className="me-2" />
                      Create Group
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default CreateGroupModal;
