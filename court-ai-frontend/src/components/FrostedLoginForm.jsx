import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0 drop-shadow-sm" aria-hidden="true" focusable="false">
    <path fill="#EA4335" d="M12 10.2v3.96h5.5c-.24 1.27-.96 2.35-2.02 3.07l3.27 2.53c1.91-1.76 3-4.35 3-7.41 0-.72-.06-1.41-.2-2.07H12z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.45l-3.27-2.53c-.9.6-2.06.95-3.35.95-2.58 0-4.77-1.74-5.55-4.08l-3.38 2.6C4.72 19.72 8.08 22 12 22z" />
    <path fill="#4A90E2" d="M6.45 13.9A5.97 5.97 0 0 1 6.13 12c0-.66.12-1.29.32-1.9l-3.38-2.6A9.97 9.97 0 0 0 2 12c0 1.62.39 3.15 1.07 4.5l3.38-2.6z" />
    <path fill="#FBBC05" d="M12 6.03c1.48 0 2.8.5 3.84 1.48l2.88-2.88C16.95 3 14.7 2 12 2 8.08 2 4.72 4.28 3.07 7.5l3.38 2.6c.78-2.35 2.97-4.08 5.55-4.08z" />
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState("neutral");
  const [formValues, setFormValues] = useState({
    loginEmail: "",
    loginPassword: "",
    signupEmail: "",
    signupUsername: "",
    signupPassword: "",
    signupConfirmPassword: "",
    forgotEmail: "",
  });

  const setField = (key, value) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setStatusMessage("");
  };

  const setStatus = (message, tone = "neutral") => {
    setStatusMessage(message);
    setStatusTone(tone);
  };

  const switchView = (nextView) => {
    const order = { login: 0, signup: 1, forgot: 2 };
    setDirection(order[nextView] > order[view] ? 1 : -1);
    setView(nextView);
    setStatusMessage("");
  };

  const heading = useMemo(() => {
    if (view === "signup") return { title: "Create Account", subtitle: "Join CaseCast" };
    if (view === "forgot") return { title: "Recover Account", subtitle: "Forgot your password?" };
    return { title, subtitle };
  }, [view, title, subtitle]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (view === "login") {
      const email = formValues.loginEmail.trim();
      const password = formValues.loginPassword;
      if (!email || !password) { setStatus("Enter email and password to continue.", "error"); return; }
      
      setIsSubmitting(true);
      try {
        const result = await onLogin?.({ email, password });
        setStatus(result?.message || "Logged in successfully.", "success");
        setIsMergingToApp(true);
      } catch (error) {
        setStatus(error?.message || "Login failed. Check credentials and try again.", "error");
      } finally { setIsSubmitting(false); }
      return;
    }

    if (view === "signup") {
      const email = formValues.signupEmail.trim();
      const username = formValues.signupUsername.trim();
      const password = formValues.signupPassword;
      const confirmPassword = formValues.signupConfirmPassword;
      if (!email || !password || !confirmPassword) { setStatus("Email, password, and confirm password are required.", "error"); return; }
      if (password !== confirmPassword) { setStatus("Passwords do not match.", "error"); return; }

      setIsSubmitting(true);
      try {
        const result = await onSignup?.({ email, password, username });
        setStatus(result?.message || "Signup successful. Check your email for verification.", "success");
      } catch (error) {
        setStatus(error?.message || "Signup failed. Please try again.", "error");
      } finally { setIsSubmitting(false); }
      return;
    }

    const email = formValues.forgotEmail.trim();
    if (!email) { setStatus("Enter your email to send a reset link.", "error"); return; }
    setIsSubmitting(true);
    try {
      const result = await onForgot?.({ email });
      setStatus(result?.message || "Password reset link sent.", "success");
    } catch (error) {
      setStatus(error?.message || "Could not send reset link.", "error");
    } finally { setIsSubmitting(false); }
  };

  const handleGoogleAuth = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try { await onGoogleAuth?.(); } catch (error) { setStatus(error?.message || "Google authentication failed.", "error"); setIsSubmitting(false); }
  };

  return (
    <div className={`w-full relative transition-all duration-700 ${isMergingToApp ? "scale-110 blur-sm opacity-0" : ""}`}>
      
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-cyan-400 text-xs tracking-widest uppercase font-semibold mb-2">{heading.subtitle}</p>
        <h2 className="font-display text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 tracking-tight">{heading.title}</h2>
        {!isMergingToApp && <span className="block mt-2 text-sm text-slate-400">Secure access to your legal intelligence workspace</span>}
      </div>

      <form className="flex flex-col gap-6 items-center w-full max-w-sm mx-auto" onSubmit={handleSubmit}>
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={view}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 20 : -20, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: direction > 0 ? -20 : 20, filter: "blur(4px)" }}
            transition={{ duration: 0.3 }}
            className="w-full flex flex-col gap-4"
          >
            {view === "login" && (
              <>
                <label className="flex flex-col gap-1.5 w-full">
                  <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Email ID</span>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    disabled={isMergingToApp || isSubmitting}
                    value={formValues.loginEmail}
                    onChange={(e) => setField("loginEmail", e.target.value)}
                    className="input-glass"
                  />
                </label>

                <label className="flex flex-col gap-1.5 w-full">
                  <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Password</span>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={isMergingToApp || isSubmitting}
                    value={formValues.loginPassword}
                    onChange={(e) => setField("loginPassword", e.target.value)}
                    className="input-glass"
                  />
                </label>

                <div className="flex justify-between items-center w-full mt-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" disabled={isMergingToApp || isSubmitting} className="rounded border-slate-700 bg-slate-900 text-cyan-500 shadow-sm focus:ring-cyan-500 focus:ring-offset-slate-950" />
                    <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => switchView("forgot")}
                    disabled={isMergingToApp || isSubmitting}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isMergingToApp || isSubmitting}
                  className="btn-primary w-full mt-2"
                >
                  {isMergingToApp ? "Launching..." : isSubmitting ? "Processing..." : "Log In"}
                </button>

                {!isMergingToApp && (
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={isSubmitting}
                    className="btn-secondary w-full flex items-center justify-center gap-3"
                  >
                    <GoogleLogo />
                    <span>Continue with Google</span>
                  </button>
                )}

                <p className="text-xs text-center text-slate-400 mt-2">
                  Don&apos;t have an account?{' '}
                  <button type="button" onClick={() => switchView("signup")} className="text-cyan-400 hover:text-cyan-300 font-medium">
                    Create new account
                  </button>
                </p>
              </>
            )}

            {view === "signup" && (
              <>
                <label className="flex flex-col gap-1.5 w-full">
                  <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Email</span>
                  <input type="email" placeholder="Enter your email" autoComplete="email" value={formValues.signupEmail} onChange={(e) => setField("signupEmail", e.target.value)} disabled={isSubmitting} className="input-glass" />
                </label>
                <label className="flex flex-col gap-1.5 w-full">
                  <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Username</span>
                  <input type="text" placeholder="Choose username" autoComplete="username" value={formValues.signupUsername} onChange={(e) => setField("signupUsername", e.target.value)} disabled={isSubmitting} className="input-glass" />
                </label>
                <label className="flex flex-col gap-1.5 w-full">
                  <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Password</span>
                  <input type="password" placeholder="Create password" autoComplete="new-password" value={formValues.signupPassword} onChange={(e) => setField("signupPassword", e.target.value)} disabled={isSubmitting} className="input-glass" />
                </label>
                <label className="flex flex-col gap-1.5 w-full">
                  <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Confirm Password</span>
                  <input type="password" placeholder="Confirm password" autoComplete="new-password" value={formValues.signupConfirmPassword} onChange={(e) => setField("signupConfirmPassword", e.target.value)} disabled={isSubmitting} className="input-glass" />
                </label>

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
                  {isSubmitting ? "Processing..." : "Create account"}
                </button>

                <div className="flex items-center gap-4 w-full opacity-50">
                  <div className="h-px bg-slate-700 flex-1"></div>
                  <span className="text-xs uppercase tracking-widest text-slate-400">or</span>
                  <div className="h-px bg-slate-700 flex-1"></div>
                </div>

                <button type="button" onClick={handleGoogleAuth} disabled={isSubmitting} className="btn-secondary w-full flex items-center justify-center gap-3">
                  <GoogleLogo />
                  <span>Continue with Google</span>
                </button>

                <p className="text-xs text-center text-slate-400 mt-2">
                  Already have an account?{' '}
                  <button type="button" onClick={() => switchView("login")} className="text-cyan-400 hover:text-cyan-300 font-medium">Login</button>
                </p>
              </>
            )}

            {view === "forgot" && (
              <>
                <label className="flex flex-col gap-1.5 w-full">
                  <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Email Address</span>
                  <input type="email" placeholder="you@example.com" autoComplete="email" value={formValues.forgotEmail} onChange={(e) => setField("forgotEmail", e.target.value)} disabled={isSubmitting} className="input-glass" />
                </label>

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
                  {isSubmitting ? "Processing..." : "Send reset link"}
                </button>

                <p className="text-xs text-center text-slate-400 mt-2">
                  Remembered your password?{' '}
                  <button type="button" onClick={() => switchView("login")} className="text-cyan-400 hover:text-cyan-300 font-medium">Back to login</button>
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {statusMessage && (
          <div className={`w-full px-4 py-3 rounded-lg text-sm border text-center ${
            statusTone === 'success' ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-200' : 'bg-rose-900/40 border-rose-500/50 text-rose-200'
          }`}>
            {statusMessage}
          </div>
        )}

        {(showHomeButton || onClose) && (
          <div className="flex justify-center gap-3 w-full mt-2">
            {showHomeButton && (
              <button type="button" onClick={onHome} className="text-xs px-4 py-2 rounded-full border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
                Back to Home
              </button>
            )}
            {onClose && (
              <button type="button" onClick={onClose} className="text-xs px-4 py-2 rounded-full border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
                Close
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
