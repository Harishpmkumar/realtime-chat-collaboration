import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
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
      await register(form.name, form.email, form.password);

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
                  One place
                  <br />
                  for all your
                  <br />
                  conversations.
                </h1>

                <p className="brand-description">
                  Create your account and start connecting with people instantly
                  through fast, real-time messaging.
                </p>

                <div className="d-flex gap-4 mt-5">
                  <div>
                    <div className="fs-3 fw-bold">⚡</div>

                    <small className="text-white-50">Real-time</small>
                  </div>

                  <div>
                    <div className="fs-3 fw-bold">🔒</div>

                    <small className="text-white-50">Secure</small>
                  </div>

                  <div>
                    <div className="fs-3 fw-bold">👥</div>

                    <small className="text-white-50">Collaboration</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Register */}
          <div className="col-lg-6 d-flex align-items-center justify-content-center p-3 p-md-5">
            <div className="auth-wrapper">
              <div className="card auth-card">
                <div className="auth-card-body">
                  <div className="mb-4">
                    <div className="auth-icon mb-4">✨</div>

                    <h2 className="auth-title mb-2">Create your account</h2>

                    <p className="auth-subtitle mb-0">
                      Join your conversations in just a few seconds.
                    </p>
                  </div>

                  {error && (
                    <div className="alert alert-danger auth-error mb-4">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="auth-label">Full name</label>

                      <input
                        type="text"
                        name="name"
                        className="form-control auth-input"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        minLength={2}
                        required
                      />
                    </div>

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
                        placeholder="At least 6 characters"
                        minLength={6}
                        required
                      />

                      <div className="form-text mt-2">
                        Use at least 6 characters.
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary auth-button w-100"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          Create account
                          <span className="ms-2">→</span>
                        </>
                      )}
                    </button>
                  </form>

                  <div className="auth-divider my-4">
                    <span>OR</span>
                  </div>

                  <div className="text-center">
                    <span className="text-muted">
                      Already have an account?{" "}
                    </span>

                    <Link to="/login" className="auth-link">
                      Sign in
                    </Link>
                  </div>
                </div>
              </div>

              <p className="text-center text-muted small mt-4">
                By creating an account, you can start messaging instantly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
