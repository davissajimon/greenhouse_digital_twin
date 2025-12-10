import React, { useState } from "react";
import "./Login.css"; 

const Loginpage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return false;
    }
    // simple email regex
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Replace this with your real login logic (e.g., call FastAPI)
    // Example: onLogin({ email, password })
    console.log("Logging in with", { email, password });
    if (onLogin) onLogin({ email, password });
  };

  return (
    <div className="lp-root">
      <div className="lp-card" role="main" aria-labelledby="lp-title">
        <div className="lp-brand">
          {/* replace with <img src="/logo.png" alt="logo" /> if you have one */}
          <div className="lp-logo">🌱</div>
          <h1 id="lp-title">Greenhouse Dashboard</h1>
          <p className="lp-sub">Sign in to continue to the project</p>
        </div>

        <form className="lp-form" onSubmit={handleSubmit} noValidate>
          <label className="lp-label" htmlFor="email">Email</label>
          <input
            id="email"
            className="lp-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />

          <label className="lp-label" htmlFor="password">Password</label>
          <div className="lp-password-row">
            <input
              id="password"
              className="lp-input lp-input-pass"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="lp-show-btn"
              aria-pressed={showPassword}
              onClick={() => setShowPassword((s) => !s)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {error && <div className="lp-error" role="alert">{error}</div>}

          <button type="submit" className="lp-submit">Login</button>
        </form>

        <div className="lp-footer">
          <a href="#forgot" className="lp-link">Forgot password?</a>
          <span className="lp-footer-right">© {new Date().getFullYear()} KV Project</span>
        </div>
      </div>
    </div>
  );
};

export default Loginpage;
