import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

export default function FrostedLoginForm({
  title = "Login",
  subtitle = "Welcome back",
  showHomeButton = false,
  onHome,
  onClose,
  onLogin,
  onSignup,
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
    setDirection(nextView === "signup" ? 1 : -1);
    setView(nextView);
    setStatusMessage("");
  };

  const heading = useMemo(() => {
    if (view === "signup") return { title: "Create Account", subtitle: "Join CaseCast" };
    return { title, subtitle };
  }, [view, title, subtitle]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (view === "login") {
      const email = formValues.loginEmail.trim();
      const password = formValues.loginPassword;
      if (!email || !password) {
        setStatus("Enter email and password to continue.", "error");
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await onLogin?.({ email, password });
        setStatus(result?.message || "Logged in successfully.", "success");
        setIsMergingToApp(true);
      } catch (error) {
        setStatus(error?.message || "Login failed. Check credentials and try again.", "error");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (view === "signup") {
      const email = formValues.signupEmail.trim();
      const username = formValues.signupUsername.trim();
      const password = formValues.signupPassword;
      const confirmPassword = formValues.signupConfirmPassword;
      if (!email || !password || !confirmPassword) {
        setStatus("Email, password, and confirm password are required.", "error");
        return;
      }
      if (password !== confirmPassword) {
        setStatus("Passwords do not match.", "error");
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await onSignup?.({ email, password, username });
        setStatus(result?.message || "Signup successful.", "success");
      } catch (error) {
        setStatus(error?.message || "Signup failed. Please try again.", "error");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className={`w-full relative transition-all duration-700 ${isMergingToApp ? "scale-110 blur-sm opacity-0" : ""}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-cyan-400 text-xs tracking-widest uppercase font-semibold mb-2">{heading.subtitle}</p>
        <h2 className="font-display text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 tracking-tight">
          {heading.title}
        </h2>
        {!isMergingToApp && (
          <span className="block mt-2 text-sm text-slate-400">
            Secure access to your legal intelligence workspace
          </span>
        )}
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

                <button
                  type="submit"
                  disabled={isMergingToApp || isSubmitting}
                  className="btn-primary w-full mt-2"
                >
                  {isMergingToApp ? "Launching..." : isSubmitting ? "Processing..." : "Log In"}
                </button>

                <p className="text-xs text-center text-slate-400 mt-2">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchView("signup")}
                    className="text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    Create new account
                  </button>
                </p>
              </>
            )}

            {view === "signup" && (
              <>
                <label className="flex flex-col gap-1.5 w-full">
                  <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Email</span>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    value={formValues.signupEmail}
                    onChange={(e) => setField("signupEmail", e.target.value)}
                    disabled={isSubmitting}
                    className="input-glass"
                  />
                </label>
                <label className="flex flex-col gap-1.5 w-full">
                  <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Full Name</span>
                  <input
                    type="text"
                    placeholder="Your full name"
                    autoComplete="name"
                    value={formValues.signupUsername}
                    onChange={(e) => setField("signupUsername", e.target.value)}
                    disabled={isSubmitting}
                    className="input-glass"
                  />
                </label>
                <label className="flex flex-col gap-1.5 w-full">
                  <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Password</span>
                  <input
                    type="password"
                    placeholder="Create password (min 6 chars)"
                    autoComplete="new-password"
                    value={formValues.signupPassword}
                    onChange={(e) => setField("signupPassword", e.target.value)}
                    disabled={isSubmitting}
                    className="input-glass"
                  />
                </label>
                <label className="flex flex-col gap-1.5 w-full">
                  <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Confirm Password</span>
                  <input
                    type="password"
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    value={formValues.signupConfirmPassword}
                    onChange={(e) => setField("signupConfirmPassword", e.target.value)}
                    disabled={isSubmitting}
                    className="input-glass"
                  />
                </label>

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
                  {isSubmitting ? "Processing..." : "Create account"}
                </button>

                <p className="text-xs text-center text-slate-400 mt-2">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchView("login")}
                    className="text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    Login
                  </button>
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {statusMessage && (
          <div
            className={`w-full px-4 py-3 rounded-lg text-sm border text-center ${
              statusTone === "success"
                ? "bg-emerald-900/40 border-emerald-500/50 text-emerald-200"
                : "bg-rose-900/40 border-rose-500/50 text-rose-200"
            }`}
          >
            {statusMessage}
          </div>
        )}

        {(showHomeButton || onClose) && (
          <div className="flex justify-center gap-3 w-full mt-2">
            {showHomeButton && (
              <button
                type="button"
                onClick={onHome}
                className="text-xs px-4 py-2 rounded-full border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Back to Home
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-xs px-4 py-2 rounded-full border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
