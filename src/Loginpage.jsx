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
    // ALLOW 'davis' as a valid entry even if not strict email
    if (email !== "davis") {
      // Keeps original regex for other inputs if needed, or just relax it
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      // if (!re.test(email)) { ... } 
      // For this specific 'davis' request, I'll relax validation.
    }
    setError("");
    return true;
    setError("");
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // SIMULATED BACKEND CHECK
    // User requested: user: "davis", password: "12345678"
    // Accepting email "davis" (as username) or any email + correct password for simplicity?
    // Request specifically said "user name : davis". The input is type="email" currently.
    // I will allow logic to accept "davis" in the email field even if it's not a valid email regex, 
    // OR just change the input type/validation to allow "davis".

    const isUserValid = email.toLowerCase() === "davis";
    const isPassValid = password === "12345678";

    if (isUserValid && isPassValid) {
      if (onLogin) onLogin({ name: "Davis", email: "davis@greenhouse.com" });
    } else {
      setError("Invalid username or password. (Try: davis / 12345678)");
    }
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
          <label className="lp-label" htmlFor="email">Username or Email</label>
          <input
            id="email"
            className="lp-input"
            type="text"
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
          {/* <span className="lp-footer-right">© {new Date().getFullYear()} KV Project</span> */}
        </div>
      </div>
    </div>
  );
};

export default Loginpage;
