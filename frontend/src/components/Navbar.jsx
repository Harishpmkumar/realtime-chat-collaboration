import { Link, useNavigate } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faComments,
  faRightFromBracket,
  faUser,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";

import useAuth from "../hooks/useAuth";

const Navbar = ({ socketConnected }) => {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();

    navigate("/login", {
      replace: true,
    });
  };

  const userName = user?.name || "User";

  const firstLetter = userName.charAt(0).toUpperCase();

  return (
    <nav className="connectly-navbar">
      <div className="container-fluid px-3 px-md-4 h-100">
        <div className="d-flex align-items-center justify-content-between h-100">
          {/* BRAND */}

          <Link to="/chat" className="connectly-brand">
            <div className="connectly-brand-icon">
              <FontAwesomeIcon icon={faComments} />
            </div>

            <div className="d-flex flex-column">
              <span className="connectly-brand-title">Connectly</span>

              <span className="connectly-brand-subtitle d-none d-sm-inline">
                Real-time collaboration
              </span>
            </div>
          </Link>

          {/* RIGHT */}

          <div className="d-flex align-items-center gap-2 gap-md-3">
            {typeof socketConnected === "boolean" && (
              <div
                className={`connectly-socket-status ${
                  socketConnected ? "online" : "offline"
                }`}
                title={socketConnected ? "Connected" : "Disconnected"}
              >
                <FontAwesomeIcon icon={faCircle} />

                <span className="d-none d-lg-inline">
                  {socketConnected ? "Connected" : "Offline"}
                </span>
              </div>
            )}

            <Link to="/profile" className="connectly-profile">
              <div className="connectly-profile-avatar">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={userName} />
                ) : (
                  firstLetter
                )}
              </div>

              <div className="connectly-profile-info d-none d-md-block">
                <div className="connectly-profile-name">{userName}</div>

                <div className="connectly-profile-label">View profile</div>
              </div>

              <FontAwesomeIcon
                icon={faUser}
                className="d-none d-lg-inline connectly-profile-arrow"
              />
            </Link>

            <button
              type="button"
              className="connectly-logout-button"
              onClick={handleLogout}
              title="Logout"
            >
              <FontAwesomeIcon icon={faRightFromBracket} />

              <span className="d-none d-lg-inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
