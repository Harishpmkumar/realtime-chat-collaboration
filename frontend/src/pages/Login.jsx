import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(form.email, form.password);
      navigate("/chat");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container-fluid p-0">
        <div className="row g-0 min-vh-100">
          {/* Brand Panel */}
          <div className="col-lg-6 d-none d-lg-flex">
            <div className="auth-brand-panel w-100 d-flex align-items-center p-5">
              <div className="auth-brand-content mx-auto">
                <div className="d-flex align-items-center gap-3 mb-5">
                  <div className="brand-logo">💬</div>

                  <div>
                    <h5 className="mb-0 fw-bold">Connectly</h5>

                    <small className="text-white-50">
                      Real-Time Collaboration
                    </small>
                  </div>
                </div>

                <h1 className="brand-title mb-4">
                  Conversations
                  <br />
                  that keep
                  <br />
                  teams connected.
                </h1>

                <p className="brand-description mb-0">
                  A fast, simple and real-time communication platform for
                  connecting with your team, friends and colleagues.
                </p>

                <div className="chat-preview">
                  <div className="chat-preview-header">
                    <div className="preview-avatar">AK</div>

                    <div>
                      <div className="fw-semibold">Arun Kumar</div>

                      <small className="text-white-50">
                        <span className="online-dot" />
                        Online
                      </small>
                    </div>
                  </div>

                  <div className="preview-message received">
                    Hey! Are we ready for today's meeting?
                  </div>

                  <div className="preview-message sent">
                    Yes! Everything is ready 👍
                  </div>

                  <div className="preview-message received">
                    Perfect. See you in 5 minutes.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Login */}
          <div className="col-lg-6 d-flex align-items-center justify-content-center p-3 p-md-5">
            <div className="auth-wrapper">
              <div className="card auth-card">
                <div className="auth-card-body">
                  <div className="mb-4">
                    <div className="auth-icon mb-4">🔐</div>

                    <h2 className="auth-title mb-2">Welcome back</h2>

                    <p className="auth-subtitle mb-0">
                      Sign in to continue to your conversations.
                    </p>
                  </div>

                  {error && (
                    <div className="alert alert-danger auth-error mb-4">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="auth-label">Email address</label>

                      <input
                        type="email"
                        name="email"
                        className="form-control auth-input"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="auth-label">Password</label>

                      <input
                        type="password"
                        name="password"
                        className="form-control auth-input"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary auth-button w-100"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign in
                          <span className="ms-2">→</span>
                        </>
                      )}
                    </button>
                  </form>

                  <div className="auth-divider my-4">
                    <span>OR</span>
                  </div>

                  <div className="text-center">
                    <span className="text-muted">New to Connectly? </span>

                    <Link to="/register" className="auth-link">
                      Create an account
                    </Link>
                  </div>
                </div>
              </div>

              <p className="text-center text-muted small mt-4">
                Secure authentication • Real-time messaging
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
