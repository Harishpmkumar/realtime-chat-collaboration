import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faArrowLeft,
  faAt,
  faCircle,
  faCommentDots,
  faEnvelope,
  faIdBadge,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

import Navbar from "../components/Navbar";
import useAuth from "../hooks/useAuth";

const Profile = () => {
  const { user } = useAuth();

  const name = user?.name || "User";

  const email = user?.email || "No email";

  const about = user?.about?.trim() || "No bio added yet.";

  const firstLetter = name.charAt(0).toUpperCase();

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

  return (
    <div className="profile-page">
      <Navbar />

      <main className="profile-page-content">
        <div className="profile-page-container">
          <div className="profile-page-topbar">
            <Link to="/chat" className="profile-back-button">
              <FontAwesomeIcon icon={faArrowLeft} />

              <span>Back to chats</span>
            </Link>

            <div>
              <h4>My Profile</h4>

              <p>Your Connectly account information</p>
            </div>
          </div>

          <div className="profile-layout">
            <aside className="profile-summary-card">
              <div className="profile-cover" />

              <div className="profile-summary-content">
                <div className="profile-avatar-large">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt={name} />
                  ) : (
                    firstLetter
                  )}

                  <span
                    className={`profile-presence-dot ${
                      user?.isOnline ? "online" : "offline"
                    }`}
                  />
                </div>

                <h3>{name}</h3>

                <div className="profile-email">{email}</div>

                <div
                  className={`profile-status-pill ${
                    user?.isOnline ? "online" : "offline"
                  }`}
                >
                  <FontAwesomeIcon icon={faCircle} />

                  {user?.isOnline ? "Online" : "Offline"}
                </div>

                <div className="profile-about-box">
                  <div className="profile-section-label">About</div>

                  <p>{about}</p>
                </div>

                <Link to="/chat" className="profile-message-button">
                  <FontAwesomeIcon icon={faCommentDots} />
                  Go to conversations
                </Link>
              </div>
            </aside>

            <section className="profile-details-card">
              <div className="profile-details-header">
                <div className="profile-details-icon">
                  <FontAwesomeIcon icon={faIdBadge} />
                </div>

                <div>
                  <h5>Account details</h5>

                  <p>Basic information associated with your account.</p>
                </div>
              </div>

              <div className="profile-details-grid">
                <div className="profile-detail-item">
                  <div className="profile-detail-icon">
                    <FontAwesomeIcon icon={faUser} />
                  </div>

                  <div>
                    <span>Full name</span>

                    <strong>{name}</strong>
                  </div>
                </div>

                <div className="profile-detail-item">
                  <div className="profile-detail-icon">
                    <FontAwesomeIcon icon={faEnvelope} />
                  </div>

                  <div>
                    <span>Email address</span>

                    <strong>{email}</strong>
                  </div>
                </div>

                <div className="profile-detail-item">
                  <div className="profile-detail-icon">
                    <FontAwesomeIcon icon={faAt} />
                  </div>

                  <div>
                    <span>Account status</span>

                    <strong>
                      {user?.isOnline ? "Currently online" : "Offline"}
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
                      {user?.isOnline
                        ? "Active now"
                        : formatLastSeen(user?.lastSeen)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="profile-information-note">
                <strong>Profile information</strong>

                <p>
                  Your name, email, profile photo, bio and presence information
                  are used throughout Connectly.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
