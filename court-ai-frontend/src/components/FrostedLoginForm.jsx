import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import StarBorder from "./StarBorder";

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="google-logo" aria-hidden="true" focusable="false">
    <path
      fill="#EA4335"
      d="M12 10.2v3.96h5.5c-.24 1.27-.96 2.35-2.02 3.07l3.27 2.53c1.91-1.76 3-4.35 3-7.41 0-.72-.06-1.41-.2-2.07H12z"
    />
    <path
      fill="#34A853"
      d="M12 22c2.7 0 4.96-.9 6.62-2.45l-3.27-2.53c-.9.6-2.06.95-3.35.95-2.58 0-4.77-1.74-5.55-4.08l-3.38 2.6C4.72 19.72 8.08 22 12 22z"
    />
    <path
      fill="#4A90E2"
      d="M6.45 13.9A5.97 5.97 0 0 1 6.13 12c0-.66.12-1.29.32-1.9l-3.38-2.6A9.97 9.97 0 0 0 2 12c0 1.62.39 3.15 1.07 4.5l3.38-2.6z"
    />
    <path
      fill="#FBBC05"
      d="M12 6.03c1.48 0 2.8.5 3.84 1.48l2.88-2.88C16.95 3 14.7 2 12 2 8.08 2 4.72 4.28 3.07 7.5l3.38 2.6c.78-2.35 2.97-4.08 5.55-4.08z"
    />
  </svg>
);

export default function FrostedLoginForm({
  title = "Login",
  subtitle = "Welcome back",
  showHomeButton = false,
  onHome,
  onClose,
  onLogin,
  onSignup,
  onForgot,
  onGoogleAuth,
}) {
  const [view, setView] = useState("login");
  const [direction, setDirection] = useState(1);
  const [isMergingToApp, setIsMergingToApp] = useState(false);

  const switchView = (nextView) => {
    const order = { login: 0, signup: 1, forgot: 2 };
    setDirection(order[nextView] > order[view] ? 1 : -1);
    setView(nextView);
  };

  const heading = useMemo(() => {
    if (view === "signup") {
      return {
        title: "Create Account",
        subtitle: "Join CaseCast",
      };
    }

    if (view === "forgot") {
      return {
        title: "Recover Account",
        subtitle: "Forgot your password?",
      };
    }

    return {
      title,
      subtitle,
    };
  }, [view, title, subtitle]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (view === "login") {
      if (isMergingToApp) {
        return;
      }

      setIsMergingToApp(true);
      window.setTimeout(() => {
        onLogin?.();
      }, 640);
      return;
    }

    if (view === "signup") {
      onSignup?.();
      return;
    }

    onForgot?.();
  };

  return (
    <div className={`frosted-login-content${isMergingToApp ? " is-merging" : ""}`}>
      <div className="frosted-login-head">
        <p>{heading.subtitle}</p>
        <h2>{heading.title}</h2>
        {!isMergingToApp && (
          <span className="frosted-head-helper">Secure access to your legal intelligence workspace</span>
        )}
      </div>

      <form className="frosted-form" onSubmit={handleSubmit}>
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={view}
            className="frosted-view"
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 24 : -24, y: 8, filter: "blur(3px)" }}
            animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: direction > 0 ? -24 : 24, y: -6, filter: "blur(2px)" }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {view === "login" && (
              <>
                <label className="frosted-field">
                  <span>Email ID</span>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    disabled={isMergingToApp}
                  />
                </label>

                <label className="frosted-field">
                  <span>Password</span>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={isMergingToApp}
                  />
                </label>

                <div className="frosted-meta-row">
                  <label className="remember-wrap">
                    <input type="checkbox" disabled={isMergingToApp} />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    className="frosted-link"
                    onClick={() => switchView("forgot")}
                    disabled={isMergingToApp}
                  >
                    <StarBorder
                      as="span"
                      className="frosted-link-star"
                      color="rgba(173, 215, 255, 0.88)"
                      speed="7.2s"
                      thickness={1}
                    >
                      Forgot password?
                    </StarBorder>
                  </button>
                </div>

                <StarBorder
                  as="button"
                  type="submit"
                  className={`frosted-login-btn${isMergingToApp ? " is-launching" : ""}`}
                  color="rgba(184, 214, 255, 0.9)"
                  speed="6.2s"
                  disabled={isMergingToApp}
                >
                  {isMergingToApp ? "Launching..." : "Log In"}
                </StarBorder>

                {!isMergingToApp && (
                  <StarBorder
                    as="button"
                    type="button"
                    className="frosted-google-btn"
                    onClick={onGoogleAuth}
                    color="rgba(220, 235, 255, 0.78)"
                    speed="7.4s"
                  >
                    <span className="google-auth-content">
                      <GoogleLogo />
                      <span>Continue with Google</span>
                    </span>
                  </StarBorder>
                )}

                <p className="frosted-register-row">
                  Don&apos;t have an account?
                  <button
                    type="button"
                    className="frosted-link"
                    onClick={() => switchView("signup")}
                    disabled={isMergingToApp}
                  >
                    <StarBorder
                      as="span"
                      className="frosted-link-star"
                      color="rgba(165, 207, 255, 0.84)"
                      speed="7.3s"
                      thickness={1}
                    >
                      Create new account
                    </StarBorder>
                  </button>
                </p>
              </>
            )}

            {view === "signup" && (
              <>
                <label className="frosted-field">
                  <span>Username</span>
                  <input type="text" placeholder="Choose username" autoComplete="username" />
                </label>

                <label className="frosted-field">
                  <span>Password</span>
                  <input type="password" placeholder="Create password" autoComplete="new-password" />
                </label>

                <label className="frosted-field">
                  <span>Confirm Password</span>
                  <input type="password" placeholder="Confirm password" autoComplete="new-password" />
                </label>

                <StarBorder
                  as="button"
                  type="submit"
                  className="frosted-login-btn"
                  color="rgba(184, 214, 255, 0.9)"
                  speed="6.2s"
                >
                  Create account
                </StarBorder>

                <div className="frosted-divider" aria-hidden="true">
                  <span>or continue with</span>
                </div>

                <StarBorder
                  as="button"
                  type="button"
                  className="frosted-google-btn"
                  onClick={onGoogleAuth}
                  color="rgba(220, 235, 255, 0.78)"
                  speed="7.4s"
                >
                  <span className="google-auth-content">
                    <GoogleLogo />
                    <span>Continue with Google</span>
                  </span>
                </StarBorder>

                <p className="frosted-register-row">
                  Already have an account?
                  <button type="button" className="frosted-link" onClick={() => switchView("login")}>
                    <StarBorder
                      as="span"
                      className="frosted-link-star"
                      color="rgba(165, 207, 255, 0.84)"
                      speed="7.3s"
                      thickness={1}
                    >
                      Login
                    </StarBorder>
                  </button>
                </p>
              </>
            )}

            {view === "forgot" && (
              <>
                <label className="frosted-field">
                  <span>Username</span>
                  <input type="text" placeholder="Enter username" autoComplete="username" />
                </label>

                <label className="frosted-field">
                  <span>Email Address</span>
                  <input type="email" placeholder="you@example.com" autoComplete="email" />
                </label>

                <StarBorder
                  as="button"
                  type="submit"
                  className="frosted-login-btn"
                  color="rgba(184, 214, 255, 0.9)"
                  speed="6.2s"
                >
                  Send reset link
                </StarBorder>

                <p className="frosted-register-row">
                  Remembered your password?
                  <button type="button" className="frosted-link" onClick={() => switchView("login")}>
                    <StarBorder
                      as="span"
                      className="frosted-link-star"
                      color="rgba(165, 207, 255, 0.84)"
                      speed="7.3s"
                      thickness={1}
                    >
                      Back to login
                    </StarBorder>
                  </button>
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {(showHomeButton || onClose) && (
          <div className="frosted-footer-actions">
            {showHomeButton && (
              <StarBorder
                as="button"
                type="button"
                className="frosted-subtle-btn"
                onClick={onHome}
                color="rgba(209, 230, 255, 0.7)"
                speed="8s"
                thickness={1}
              >
                Back to Home
              </StarBorder>
            )}
            {onClose && (
              <StarBorder
                as="button"
                type="button"
                className="frosted-subtle-btn"
                onClick={onClose}
                color="rgba(209, 230, 255, 0.7)"
                speed="8s"
                thickness={1}
              >
                Close
              </StarBorder>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
