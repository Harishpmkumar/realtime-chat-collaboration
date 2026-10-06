import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faArrowLeft,
  faAt,
  faCamera,
  faCheck,
  faCircle,
  faCommentDots,
  faEnvelope,
  faIdBadge,
  faPen,
  faTrash,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import Navbar from "../components/Navbar";

import useAuth from "../hooks/useAuth";
import useSocket from "../hooks/useSocket";

import api from "../services/api";

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const Profile = () => {
  const { user } = useAuth();

  const { socket } = useSocket();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    about: "",
    profileImage: "",
    lastSeen: null,
  });

  const [formData, setFormData] = useState({
    name: "",
    about: "",
  });

  const [editing, setEditing] = useState(false);

  const [saving, setSaving] = useState(false);

  const [uploadingImage, setUploadingImage] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);

  const [imagePreview, setImagePreview] = useState("");

  const [removeProfileImage, setRemoveProfileImage] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /*
   * Use the live socket connection for the currently
   * logged-in user's presence.
   *
   * user.isOnline can be stale because AuthContext may
   * contain the value returned when the user logged in.
   */
  const isOnline = Boolean(socket?.connected);

  // =====================================================
  // LOAD PROFILE FROM AUTH USER
  // =====================================================

  useEffect(() => {
    if (!user) {
      return;
    }

    const currentProfile = {
      name: user.name || "",

      email: user.email || "",

      about: user.about || "",

      profileImage: user.profileImage || "",

      lastSeen: user.lastSeen || null,
    };

    setProfile(currentProfile);

    setFormData({
      name: currentProfile.name,

      about: currentProfile.about,
    });
  }, [user]);

  // =====================================================
  // CLEAN OBJECT URL
  // =====================================================

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const firstLetter =
    (editing ? formData.name : profile.name)?.charAt(0)?.toUpperCase() || "U";

  const displayName = editing ? formData.name : profile.name;

  const displayImage = removeProfileImage
    ? ""
    : imagePreview || profile.profileImage;

  // =====================================================
  // LAST SEEN
  // =====================================================

  const formatLastSeen = (date) => {
    if (!date) {
      return "Not available";
    }

    return new Date(date).toLocaleString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =====================================================
  // FORM INPUTS
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // =====================================================
  // START EDIT
  // =====================================================

  const startEditing = () => {
    setFormData({
      name: profile.name,

      about: profile.about,
    });

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(null);

    setImagePreview("");

    setRemoveProfileImage(false);

    setError("");
    setSuccess("");

    setEditing(true);
  };

  // =====================================================
  // CANCEL EDIT
  // =====================================================

  const cancelEditing = () => {
    setFormData({
      name: profile.name,

      about: profile.about,
    });

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(null);

    setImagePreview("");

    setRemoveProfileImage(false);

    setError("");

    setEditing(false);
  };

  // =====================================================
  // SELECT PROFILE IMAGE
  // =====================================================

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setSuccess("");

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, WEBP and GIF images are allowed.");

      event.target.value = "";

      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      setError("Profile image must be 5 MB or less.");

      event.target.value = "";

      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    const preview = URL.createObjectURL(file);

    setSelectedImage(file);

    setImagePreview(preview);

    setRemoveProfileImage(false);

    event.target.value = "";
  };

  // =====================================================
  // REMOVE PROFILE IMAGE
  // =====================================================

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(null);

    setImagePreview("");

    setRemoveProfileImage(true);

    setError("");
    setSuccess("");
  };

  // =====================================================
  // UPLOAD PROFILE IMAGE
  // =====================================================

  const uploadSelectedImage = async () => {
    if (removeProfileImage) {
      return "";
    }

    if (!selectedImage) {
      return profile.profileImage || "";
    }

    const uploadData = new FormData();

    uploadData.append("image", selectedImage);

    setUploadingImage(true);

    try {
      const response = await api.postFormData(
        "/users/profile/image",
        uploadData,
      );

      const uploadedUrl = response.data?.profileImage;

      if (!uploadedUrl) {
        throw new Error("Invalid profile image upload response");
      }

      return uploadedUrl;
    } finally {
      setUploadingImage(false);
    }
  };

  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = formData.name.trim();

    const trimmedAbout = formData.about.trim();

    if (!trimmedName) {
      setError("Name is required.");

      return;
    }

    if (trimmedName.length < 2) {
      setError("Name must be at least 2 characters.");

      return;
    }

    if (trimmedName.length > 100) {
      setError("Name cannot exceed 100 characters.");

      return;
    }

    if (trimmedAbout.length > 150) {
      setError("About cannot exceed 150 characters.");

      return;
    }

    try {
      setSaving(true);

      setError("");
      setSuccess("");

      /*
       * Upload new image first when one has been selected.
       */
      const profileImage = await uploadSelectedImage();

      /*
       * Then persist profile fields.
       */
      const response = await api.put("/users/profile", {
        name: trimmedName,

        about: trimmedAbout,

        profileImage,
      });

      const updatedUser = response.data?.user;

      if (!updatedUser) {
        throw new Error("Invalid profile response");
      }

      setProfile({
        name: updatedUser.name || "",

        email: updatedUser.email || "",

        about: updatedUser.about || "",

        profileImage: updatedUser.profileImage || "",

        lastSeen: updatedUser.lastSeen || null,
      });

      setFormData({
        name: updatedUser.name || "",

        about: updatedUser.about || "",
      });

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }

      setSelectedImage(null);

      setImagePreview("");

      setRemoveProfileImage(false);

      setEditing(false);

      setSuccess("Profile updated successfully.");

      /*
       * AuthContext currently contains the user loaded
       * when authentication was initialized.
       *
       * Reload once so Navbar, Chat and Profile all
       * immediately use the updated user information.
       */
      window.setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (error) {
      console.error("Update profile error:", error);

      setError(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const savingProfile = saving || uploadingImage;

  return (
    <div className="profile-page">
      <Navbar />

      <main className="profile-page-content">
        <div className="profile-page-container">
          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <div className="profile-page-topbar">
            <Link
              to="/chat"
              className="profile-back-button"
              title="Back to chats"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </Link>

            <div className="flex-grow-1">
              <h4>My Profile</h4>

              <p>Manage your Connectly profile information</p>
            </div>

            {!editing && (
              <button
                type="button"
                className="profile-edit-button"
                onClick={startEditing}
              >
                <FontAwesomeIcon icon={faPen} />

                <span>Edit profile</span>
              </button>
            )}
          </div>

          {/* =================================================
              ALERTS
          ================================================= */}

          {error && (
            <div className="profile-alert profile-alert-danger">
              <span>{error}</span>

              <button type="button" title="Close" onClick={() => setError("")}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          )}

          {success && (
            <div className="profile-alert profile-alert-success">
              <FontAwesomeIcon icon={faCheck} />

              <span>{success}</span>
            </div>
          )}

          <div className="profile-layout">
            {/* =================================================
                PROFILE SUMMARY
            ================================================= */}

            <aside className="profile-summary-card">
              <div className="profile-cover" />

              <div className="profile-summary-content">
                <div className="profile-avatar-large">
                  {displayImage ? (
                    <img src={displayImage} alt={displayName || "Profile"} />
                  ) : (
                    firstLetter
                  )}

                  <span
                    className={`profile-presence-dot ${
                      isOnline ? "online" : "offline"
                    }`}
                  />
                </div>

                <h3>{displayName || "User"}</h3>

                <div className="profile-email">{profile.email}</div>

                <div
                  className={`profile-status-pill ${
                    isOnline ? "online" : "offline"
                  }`}
                >
                  <FontAwesomeIcon icon={faCircle} />

                  {isOnline ? "Online" : "Offline"}
                </div>

                <div className="profile-about-box">
                  <div className="profile-section-label">About</div>

                  <p>
                    {editing
                      ? formData.about || "No bio added yet."
                      : profile.about || "No bio added yet."}
                  </p>
                </div>

                {!editing && (
                  <Link to="/chat" className="profile-message-button">
                    <FontAwesomeIcon icon={faCommentDots} />
                    Go to conversations
                  </Link>
                )}
              </div>
            </aside>

            {/* =================================================
                DETAILS / EDIT FORM
            ================================================= */}

            <section className="profile-details-card">
              <div className="profile-details-header">
                <div className="profile-details-icon">
                  <FontAwesomeIcon icon={editing ? faPen : faIdBadge} />
                </div>

                <div>
                  <h5>{editing ? "Edit profile" : "Account details"}</h5>

                  <p>
                    {editing
                      ? "Update your personal profile information."
                      : "Basic information associated with your account."}
                  </p>
                </div>
              </div>

              {editing ? (
                <form className="profile-edit-form" onSubmit={handleSubmit}>
                  {/* NAME */}

                  <div className="profile-form-group">
                    <label htmlFor="profile-name">Full name</label>

                    <div className="profile-input-wrapper">
                      <FontAwesomeIcon icon={faUser} />

                      <input
                        id="profile-name"
                        type="text"
                        name="name"
                        value={formData.name}
                        minLength={2}
                        maxLength={100}
                        placeholder="Your name"
                        onChange={handleChange}
                        disabled={savingProfile}
                      />
                    </div>

                    <small>
                      {formData.name.length}
                      /100
                    </small>
                  </div>

                  {/* EMAIL */}

                  <div className="profile-form-group">
                    <label>Email address</label>

                    <div className="profile-input-wrapper readonly">
                      <FontAwesomeIcon icon={faEnvelope} />

                      <input type="email" value={profile.email} readOnly />
                    </div>

                    <small className="text-start">
                      Email cannot be changed from this screen.
                    </small>
                  </div>

                  {/* PROFILE PHOTO */}

                  <div className="profile-form-group profile-form-full">
                    <label>Profile photo</label>

                    <div className="profile-photo-editor">
                      <div className="profile-photo-preview">
                        {displayImage ? (
                          <img src={displayImage} alt="Profile preview" />
                        ) : (
                          <span>{firstLetter}</span>
                        )}
                      </div>

                      <div className="profile-photo-controls">
                        <div className="d-flex align-items-center flex-wrap gap-2">
                          <label className="profile-photo-upload-button">
                            <FontAwesomeIcon icon={faCamera} />

                            {selectedImage ? "Change photo" : "Choose photo"}

                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="d-none"
                              onChange={handleImageSelect}
                              disabled={savingProfile}
                            />
                          </label>

                          {(displayImage || profile.profileImage) && (
                            <button
                              type="button"
                              className="profile-photo-remove-button"
                              onClick={handleRemoveImage}
                              disabled={savingProfile}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                              Remove
                            </button>
                          )}
                        </div>

                        {selectedImage && (
                          <div className="profile-photo-selected-name">
                            {selectedImage.name}
                          </div>
                        )}

                        <div className="profile-photo-help">
                          JPG, PNG, WEBP or GIF. Maximum file size: 5 MB.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ABOUT */}

                  <div className="profile-form-group profile-form-full">
                    <label htmlFor="profile-about">About</label>

                    <textarea
                      id="profile-about"
                      name="about"
                      rows="4"
                      value={formData.about}
                      maxLength={150}
                      placeholder="Tell people something about yourself..."
                      onChange={handleChange}
                      disabled={savingProfile}
                    />

                    <small>
                      {formData.about.length}
                      /150
                    </small>
                  </div>

                  {/* ACTIONS */}

                  <div className="profile-edit-actions profile-form-full">
                    <button
                      type="button"
                      className="profile-edit-cancel-button"
                      onClick={cancelEditing}
                      disabled={savingProfile}
                    >
                      <FontAwesomeIcon icon={faXmark} />
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="profile-edit-save-button"
                      disabled={savingProfile || !formData.name.trim()}
                    >
                      {savingProfile ? (
                        <>
                          <span className="spinner-border spinner-border-sm" />

                          {uploadingImage ? "Uploading..." : "Saving..."}
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faCheck} />
                          Save changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {/* =================================================
                      ACCOUNT DETAILS
                  ================================================= */}

                  <div className="profile-details-grid">
                    <div className="profile-detail-item">
                      <div className="profile-detail-icon">
                        <FontAwesomeIcon icon={faUser} />
                      </div>

                      <div>
                        <span>Full name</span>

                        <strong>{profile.name}</strong>
                      </div>
                    </div>

                    <div className="profile-detail-item">
                      <div className="profile-detail-icon">
                        <FontAwesomeIcon icon={faEnvelope} />
                      </div>

                      <div>
                        <span>Email address</span>

                        <strong>{profile.email}</strong>
                      </div>
                    </div>

                    <div className="profile-detail-item">
                      <div className="profile-detail-icon">
                        <FontAwesomeIcon icon={faAt} />
                      </div>

                      <div>
                        <span>Account status</span>

                        <strong>
                          {isOnline ? "Currently online" : "Offline"}
                        </strong>
                      </div>
                    </div>

                    <div className="profile-detail-item">
                      <div className="profile-detail-icon">
                        <FontAwesomeIcon icon={faCircle} />
                      </div>

                      <div>
                        <span>Last seen</span>

                        <strong>
                          {isOnline
                            ? "Active now"
                            : formatLastSeen(profile.lastSeen)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="profile-information-note">
                    <strong>Profile information</strong>

                    <p>
                      Your name, profile photo and bio are visible throughout
                      Connectly.
                    </p>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
