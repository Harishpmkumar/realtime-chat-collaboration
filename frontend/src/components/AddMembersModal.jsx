import { useEffect, useMemo, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faMagnifyingGlass,
  faUserPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import api from "../services/api";
import useAuth from "../hooks/useAuth";

const AddMembersModal = ({
  show,
  conversation,
  existingMembers = [],
  onClose,
  onMembersAdded,
}) => {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const [error, setError] = useState("");

  const currentUserId = user?.id || user?._id;

  useEffect(() => {
    if (!show) {
      return;
    }

    setSelectedUsers([]);
    setSearch("");
    setError("");
  }, [show]);

  useEffect(() => {
    if (!show) {
      return;
    }

    const loadUsers = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/users");

        setUsers(response.data?.users || []);
      } catch (error) {
        console.error("Load users error:", error);

        setError(error.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [show]);

  const existingMemberIds = useMemo(() => {
    return new Set(
      existingMembers.map(
        (member) => member._id?.toString() || member.id?.toString(),
      ),
    );
  }, [existingMembers]);

  const availableUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((userItem) => {
      const userId = userItem._id?.toString() || userItem.id?.toString();

      if (!userId) {
        return false;
      }

      if (userId === currentUserId?.toString()) {
        return false;
      }

      if (existingMemberIds.has(userId)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        userItem.name?.toLowerCase().includes(query) ||
        userItem.email?.toLowerCase().includes(query)
      );
    });
  }, [users, search, currentUserId, existingMemberIds]);

  if (!show || !conversation) {
    return null;
  }

  const toggleUser = (userItem) => {
    const userId = userItem._id || userItem.id;

    setSelectedUsers((previous) => {
      const exists = previous.some(
        (item) => (item._id || item.id)?.toString() === userId?.toString(),
      );

      if (exists) {
        return previous.filter(
          (item) => (item._id || item.id)?.toString() !== userId?.toString(),
        );
      }

      return [...previous, userItem];
    });
  };

  const isSelected = (userId) => {
    return selectedUsers.some(
      (item) => (item._id || item.id)?.toString() === userId?.toString(),
    );
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      setError("Select at least one member.");
      return;
    }

    try {
      setAdding(true);
      setError("");

      const userIds = selectedUsers.map((item) => item._id || item.id);

      const response = await api.post(
        `/conversations/${conversation._id}/members`,
        {
          userIds,
        },
      );

      const updatedConversation = response.data?.conversation;

      if (!updatedConversation) {
        throw new Error("Invalid add members response");
      }

      onMembersAdded(updatedConversation);

      onClose();
    } catch (error) {
      console.error("Add members error:", error);

      setError(error.message || "Failed to add members");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      className="modal d-block add-members-overlay"
      tabIndex="-1"
      role="dialog"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="add-members-dialog">
        <div className="add-members-modal">
          {/* HEADER */}

          <div className="add-members-header">
            <div className="add-members-icon">
              <FontAwesomeIcon icon={faUserPlus} />
            </div>

            <div className="flex-grow-1 min-width-0">
              <h5>Add members</h5>

              <p>
                Add people to <strong>{conversation.name}</strong>
              </p>
            </div>

            <button
              type="button"
              className="add-members-close"
              onClick={onClose}
              disabled={adding}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          {/* BODY */}

          <div className="add-members-body">
            {error && (
              <div className="add-members-error">
                {error}

                <button type="button" onClick={() => setError("")}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            )}

            {/* SEARCH */}

            <div className="add-members-search-wrapper">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="add-members-search-icon"
              />

              <input
                type="text"
                value={search}
                placeholder="Search by name or email..."
                onChange={(event) => setSearch(event.target.value)}
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="add-members-clear"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              )}
            </div>

            {/* SELECTED */}

            {selectedUsers.length > 0 && (
              <div className="selected-members-section">
                <div className="selected-members-title">
                  Selected <span>{selectedUsers.length}</span>
                </div>

                <div className="selected-members-list">
                  {selectedUsers.map((selectedUser) => {
                    const id = selectedUser._id || selectedUser.id;

                    return (
                      <button
                        key={id}
                        type="button"
                        className="selected-member-chip"
                        onClick={() => toggleUser(selectedUser)}
                      >
                        <span>{selectedUser.name}</span>

                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* USERS */}

            <div className="add-members-list">
              {loading ? (
                <div className="add-members-loading">
                  <div className="spinner-border spinner-border-sm text-primary" />

                  <span>Loading users...</span>
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="add-members-empty">
                  <div className="add-members-empty-icon">
                    <FontAwesomeIcon icon={faUserPlus} />
                  </div>

                  <strong>No users found</strong>

                  <span>
                    {search
                      ? "Try a different search."
                      : "Everyone is already in this group."}
                  </span>
                </div>
              ) : (
                availableUsers.map((userItem) => {
                  const userId = userItem._id || userItem.id;

                  const selected = isSelected(userId);

                  const firstLetter =
                    userItem.name?.charAt(0)?.toUpperCase() || "U";

                  return (
                    <button
                      key={userId}
                      type="button"
                      className={`add-member-user ${
                        selected ? "selected" : ""
                      }`}
                      onClick={() => toggleUser(userItem)}
                    >
                      <div className="add-member-avatar">{firstLetter}</div>

                      <div className="add-member-info">
                        <strong>{userItem.name}</strong>

                        <span>{userItem.email}</span>
                      </div>

                      <div
                        className={`add-member-check ${
                          selected ? "checked" : ""
                        }`}
                      >
                        {selected && <FontAwesomeIcon icon={faCheck} />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* FOOTER */}

          <div className="add-members-footer">
            <button
              type="button"
              className="add-members-cancel"
              onClick={onClose}
              disabled={adding}
            >
              Cancel
            </button>

            <button
              type="button"
              className="add-members-submit"
              onClick={handleAddMembers}
              disabled={adding || selectedUsers.length === 0}
            >
              {adding ? (
                <>
                  <span className="spinner-border spinner-border-sm" />
                  Adding...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUserPlus} />
                  Add{" "}
                  {selectedUsers.length > 0
                    ? `${selectedUsers.length} member${
                        selectedUsers.length !== 1 ? "s" : ""
                      }`
                    : "members"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMembersModal;
