import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const passwordStrength = useMemo(() => {
    if (!newPassword) return { label: "", color: "", score: 0 };
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (newPassword.length >= 12) score += 1;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score += 1;
    if (/\d/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (score <= 2) return { label: "Weak", color: "text-rose-400", score: 1 };
    if (score <= 4) return { label: "Medium", color: "text-amber-400", score: 2 };
    return { label: "Strong", color: "text-emerald-400", score: 3 };
  }, [newPassword]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError("Please fill all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setMessage("Password updated successfully! Redirecting...");
      setTimeout(() => {
        navigate("/app");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to update password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-cyan-900/30 rounded-full mix-blend-screen filter blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-900/30 rounded-full mix-blend-screen filter blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      <div className="absolute inset-0 z-0 bg-[url('/noise.svg')] opacity-[0.04]"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 md:p-10 rounded-3xl w-full max-w-md relative z-10 border border-white/10"
      >
        <h2 className="text-2xl font-display font-bold text-white mb-2">Reset Password</h2>
        <p className="text-slate-400 text-sm mb-6">Enter your new secure password below.</p>

        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 w-full">
            <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">New Password</span>
            <input
              type="password"
              className="input-glass"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </label>

          {passwordStrength.label && (
            <div className="rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 uppercase tracking-wider">Strength</span>
                <span className={`font-semibold ${passwordStrength.color}`}>{passwordStrength.label}</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    passwordStrength.score === 1 ? "bg-rose-400" : passwordStrength.score === 2 ? "bg-amber-400" : "bg-emerald-400"
                  }`}
                  style={{ width: `${(passwordStrength.score / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

          <label className="flex flex-col gap-1.5 w-full">
            <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Confirm Password</span>
            <input
              type="password"
              className="input-glass"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </label>

          {error && <div className="text-rose-400 text-sm bg-rose-900/20 p-3 rounded-lg border border-rose-500/20">{error}</div>}
          {message && <div className="text-emerald-400 text-sm bg-emerald-900/20 p-3 rounded-lg border border-emerald-500/20">{message}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full mt-2"
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
