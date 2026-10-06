import { useEffect, useMemo, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCrown,
  faEllipsisVertical,
  faPen,
  faRightFromBracket,
  faTrash,
  faUserGroup,
  faUserPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import api from "../services/api";
import AddMembersModal from "./AddMembersModal";

const GroupDetailsModal = ({
  show,
  conversation,
  currentUserId,
  onClose,
  onConversationUpdated,
  onGroupLeft,
}) => {
  const [members, setMembers] = useState([]);
  const [admins, setAdmins] = useState([]);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editing, setEditing] = useState(false);

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");

  const [openMemberMenu, setOpenMemberMenu] = useState(null);

  const [confirmAction, setConfirmAction] = useState(null);

  // Add Members Modal
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);

  const currentUserIsAdmin = useMemo(() => {
    return admins.some(
      (admin) => (admin._id || admin).toString() === currentUserId?.toString(),
    );
  }, [admins, currentUserId]);

  useEffect(() => {
    if (!show || !conversation) {
      return;
    }

    setGroupName(conversation.name || "");
    setDescription(conversation.description || "");

    setMembers(conversation.participants || []);
    setAdmins(conversation.admins || []);

    setError("");
    setSuccess("");
    setEditing(false);
    setOpenMemberMenu(null);
    setConfirmAction(null);
    setShowAddMembersModal(false);
  }, [show, conversation]);

  useEffect(() => {
    if (!show || !conversation?._id) {
      return;
    }

    const loadMembers = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/conversations/${conversation._id}/members`,
        );

        setMembers(response.data?.members || []);
      } catch (error) {
        console.error("Load group members error:", error);

        setError(error.message || "Failed to load group members");
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [show, conversation?._id]);

  if (!show || !conversation) {
    return null;
  }

  if (conversation.type !== "group") {
    return null;
  }

  const isAdmin = (userId) => {
    return admins.some(
      (admin) => (admin._id || admin).toString() === userId?.toString(),
    );
  };

  const handleUpdateGroup = async () => {
    if (!groupName.trim()) {
      setError("Group name is required.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");
      setOpenMemberMenu(null);

      const response = await api.patch(`/conversations/${conversation._id}`, {
        name: groupName.trim(),
        description: description.trim(),
      });

      const updatedConversation = response.data?.conversation;

      if (!updatedConversation) {
        throw new Error("Invalid group update response");
      }

      setMembers(updatedConversation.participants || []);

      setAdmins(updatedConversation.admins || []);

      onConversationUpdated(updatedConversation);

      setEditing(false);

      setSuccess("Group details updated successfully.");
    } catch (error) {
      console.error("Update group error:", error);

      setError(error.message || "Failed to update group");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMakeAdmin = async (userId) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");
      setOpenMemberMenu(null);

      const response = await api.post(
        `/conversations/${conversation._id}/admins/${userId}`,
      );

      const updatedConversation = response.data?.conversation;

      if (!updatedConversation) {
        throw new Error("Invalid admin update response");
      }

      setMembers(updatedConversation.participants || []);

      setAdmins(updatedConversation.admins || []);

      onConversationUpdated(updatedConversation);

      setSuccess("Member promoted to admin.");
    } catch (error) {
      console.error("Make admin error:", error);

      setError(error.message || "Failed to promote member");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveAdmin = async (userId) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");
      setOpenMemberMenu(null);

      const response = await api.delete(
        `/conversations/${conversation._id}/admins/${userId}`,
      );

      const updatedConversation = response.data?.conversation;

      if (!updatedConversation) {
        throw new Error("Invalid admin update response");
      }

      setMembers(updatedConversation.participants || []);

      setAdmins(updatedConversation.admins || []);

      onConversationUpdated(updatedConversation);

      setSuccess("Admin privileges removed.");
    } catch (error) {
      console.error("Remove admin error:", error);

      setError(error.message || "Failed to remove admin privileges");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = (userId) => {
    const member = members.find(
      (item) => (item._id || item.id)?.toString() === userId?.toString(),
    );

    setOpenMemberMenu(null);

    setConfirmAction({
      type: "remove-member",
      userId,
      title: "Remove member?",
      message: `Are you sure you want to remove ${
        member?.name || "this member"
      } from the group?`,
      confirmText: "Remove member",
      danger: true,
    });
  };

  const handleLeaveGroup = () => {
    setOpenMemberMenu(null);

    setConfirmAction({
      type: "leave-group",
      title: "Leave group?",
      message: `Are you sure you want to leave "${conversation.name}"?`,
      confirmText: "Leave group",
      danger: true,
    });
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) {
      return;
    }

    const action = confirmAction;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");
      setConfirmAction(null);

      if (action.type === "remove-member") {
        const response = await api.delete(
          `/conversations/${conversation._id}/members/${action.userId}`,
        );

        const updatedConversation = response.data?.conversation;

        if (!updatedConversation) {
          throw new Error("Invalid member removal response");
        }

        setMembers(updatedConversation.participants || []);

        setAdmins(updatedConversation.admins || []);

        onConversationUpdated(updatedConversation);

        setSuccess("Member removed from the group.");
      }

      if (action.type === "leave-group") {
        await api.post(`/conversations/${conversation._id}/leave`);

        onGroupLeft(conversation._id);

        onClose();
      }
    } catch (error) {
      console.error("Confirmed group action error:", error);

      setError(error.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleMemberMenu = (memberId) => {
    if (actionLoading) {
      return;
    }

    setOpenMemberMenu((previous) =>
      previous?.toString() === memberId?.toString() ? null : memberId,
    );
  };

  const handleMembersAdded = (updatedConversation) => {
    setMembers(updatedConversation.participants || []);

    setAdmins(updatedConversation.admins || []);

    onConversationUpdated(updatedConversation);

    setSuccess("Members added successfully.");
  };

  return (
    <>
      {/* GROUP DETAILS MODAL */}

      <div
        className="modal d-block group-details-overlay"
        tabIndex="-1"
        role="dialog"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setOpenMemberMenu(null);
            onClose();
          }
        }}
      >
        <div className="group-details-dialog" role="document">
          <div className="group-details-modal">
            {/* HEADER */}

            <div className="group-details-top">
              <div className="group-details-cover">
                <div className="group-details-avatar">
                  <FontAwesomeIcon icon={faUserGroup} />
                </div>

                <div className="group-details-title">
                  <h5>{conversation.name || "Group"}</h5>

                  <div>
                    <span>
                      {members.length} member
                      {members.length !== 1 ? "s" : ""}
                    </span>

                    <span className="mx-2">•</span>

                    <span>Group chat</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="group-close-button"
                  onClick={onClose}
                  disabled={actionLoading}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            </div>

            {/* BODY */}

            <div className="group-details-body">
              {/* ALERTS */}

              {error && (
                <div className="group-alert group-alert-danger">
                  <div>
                    <strong>Something went wrong</strong>

                    <div>{error}</div>
                  </div>

                  <button type="button" onClick={() => setError("")}>
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
              )}

              {success && (
                <div className="group-alert group-alert-success">
                  <div>{success}</div>

                  <button type="button" onClick={() => setSuccess("")}>
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
              )}

              {/* GROUP INFORMATION */}

              <section className="group-section">
                <div className="group-section-header">
                  <div>
                    <h6>Group information</h6>

                    <p>Basic information about this conversation</p>
                  </div>

                  {currentUserIsAdmin && !editing && (
                    <button
                      type="button"
                      className="group-outline-button"
                      onClick={() => setEditing(true)}
                      disabled={actionLoading}
                    >
                      <FontAwesomeIcon icon={faPen} />
                      Edit
                    </button>
                  )}
                </div>

                {editing ? (
                  <div className="group-edit-form">
                    <div>
                      <label>Group name</label>

                      <input
                        type="text"
                        value={groupName}
                        maxLength={100}
                        onChange={(event) => setGroupName(event.target.value)}
                      />

                      <small>{groupName.length}/100</small>
                    </div>

                    <div>
                      <label>Description</label>

                      <textarea
                        rows="3"
                        value={description}
                        maxLength={500}
                        onChange={(event) => setDescription(event.target.value)}
                      />

                      <small>{description.length}/500</small>
                    </div>

                    <div className="group-form-actions">
                      <button
                        type="button"
                        className="group-primary-button"
                        disabled={actionLoading}
                        onClick={handleUpdateGroup}
                      >
                        {actionLoading ? "Saving..." : "Save changes"}
                      </button>

                      <button
                        type="button"
                        className="group-secondary-button"
                        disabled={actionLoading}
                        onClick={() => {
                          setEditing(false);

                          setGroupName(conversation.name || "");

                          setDescription(conversation.description || "");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="group-info-grid">
                    <div className="group-info-item">
                      <span>Group name</span>

                      <strong>{conversation.name}</strong>
                    </div>

                    <div className="group-info-item">
                      <span>Description</span>

                      <strong className="description-value">
                        {conversation.description || "No description added."}
                      </strong>
                    </div>
                  </div>
                )}
              </section>

              {/* MEMBERS */}

              <section className="group-section members-section">
                <div className="group-section-header">
                  <div>
                    <h6>Members</h6>

                    <p>Manage people in this group</p>
                  </div>

                  {currentUserIsAdmin && (
                    <button
                      type="button"
                      className="group-primary-small-button"
                      disabled={actionLoading}
                      onClick={() => {
                        setOpenMemberMenu(null);

                        setShowAddMembersModal(true);
                      }}
                    >
                      <FontAwesomeIcon icon={faUserPlus} />
                      Add
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="group-loading">
                    <div className="spinner-border spinner-border-sm text-primary" />

                    <span>Loading members...</span>
                  </div>
                ) : members.length === 0 ? (
                  <div className="group-empty-members">
                    <FontAwesomeIcon icon={faUserGroup} size="2x" />

                    <div>No members found.</div>
                  </div>
                ) : (
                  <div className="group-members-list">
                    {members.map((member) => {
                      const memberId = member._id || member.id;

                      const memberIsAdmin = isAdmin(memberId);

                      const isCurrentUser =
                        memberId?.toString() === currentUserId?.toString();

                      const menuOpen =
                        openMemberMenu?.toString() === memberId?.toString();

                      return (
                        <div key={memberId} className="group-member-row">
                          <div className="group-member-avatar">
                            {member.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>

                          <div className="group-member-info">
                            <div className="group-member-name">
                              <strong>{member.name}</strong>

                              {isCurrentUser && (
                                <span className="member-you-badge">You</span>
                              )}

                              {memberIsAdmin && (
                                <span className="member-admin-badge">
                                  <FontAwesomeIcon icon={faCrown} />
                                  Admin
                                </span>
                              )}
                            </div>

                            <span>{member.email}</span>
                          </div>

                          {currentUserIsAdmin && !isCurrentUser && (
                            <div className="group-member-actions">
                              <button
                                type="button"
                                className="member-more-button"
                                onClick={() => toggleMemberMenu(memberId)}
                                disabled={actionLoading}
                              >
                                <FontAwesomeIcon icon={faEllipsisVertical} />
                              </button>

                              {menuOpen && (
                                <div className="group-member-action-menu">
                                  {memberIsAdmin ? (
                                    <button
                                      type="button"
                                      className="group-action-item"
                                      onClick={() =>
                                        handleRemoveAdmin(memberId)
                                      }
                                      disabled={actionLoading}
                                    >
                                      <FontAwesomeIcon
                                        icon={faCrown}
                                        className="text-warning"
                                      />
                                      Remove admin
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="group-action-item"
                                      onClick={() => handleMakeAdmin(memberId)}
                                      disabled={actionLoading}
                                    >
                                      <FontAwesomeIcon
                                        icon={faCrown}
                                        className="text-warning"
                                      />
                                      Make admin
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    className="group-action-item group-action-danger"
                                    onClick={() => handleRemoveMember(memberId)}
                                    disabled={actionLoading}
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                    Remove member
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* FOOTER */}

            <div className="group-details-footer">
              <button
                type="button"
                className="group-leave-button"
                disabled={actionLoading}
                onClick={handleLeaveGroup}
              >
                <FontAwesomeIcon icon={faRightFromBracket} />
                Leave group
              </button>

              <button
                type="button"
                className="group-close-footer-button"
                onClick={onClose}
                disabled={actionLoading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CUSTOM CONFIRMATION MODAL */}

      {confirmAction && (
        <div
          className="custom-confirm-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmAction(null);
            }
          }}
        >
          <div className="custom-confirm-modal">
            <div
              className={`custom-confirm-icon ${
                confirmAction.danger ? "danger" : ""
              }`}
            >
              <FontAwesomeIcon
                icon={
                  confirmAction.type === "leave-group"
                    ? faRightFromBracket
                    : faTrash
                }
              />
            </div>

            <h5>{confirmAction.title}</h5>

            <p>{confirmAction.message}</p>

            <div className="custom-confirm-actions">
              <button
                type="button"
                className="confirm-cancel-button"
                onClick={() => setConfirmAction(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirm-danger-button"
                onClick={executeConfirmedAction}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    />
                    Processing...
                  </>
                ) : (
                  confirmAction.confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MEMBERS MODAL */}

      <AddMembersModal
        show={showAddMembersModal}
        conversation={conversation}
        existingMembers={members}
        onClose={() => setShowAddMembersModal(false)}
        onMembersAdded={handleMembersAdded}
      />
    </>
  );
};

export default GroupDetailsModal;
