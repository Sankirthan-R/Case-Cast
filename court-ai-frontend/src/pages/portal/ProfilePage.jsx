import { motion } from "framer-motion";
import { Globe, KeyRound, LogOut, Pencil, RefreshCw, Save, Trash2, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * ProfilePage — User account info, editable profile, and password update.
 */
export default function ProfilePage({ user, setUser, onLogout }) {
  const roleOptions = ["Citizen", "Lawyer", "Judge", "Researcher"];
  const signedInEmail = user?.email || "Authenticated User";
  const inferredName = user?.full_name || signedInEmail.split("@")[0] || "User";

  const [profile, setProfile] = useState({
    fullName: inferredName,
    email: signedInEmail,
    contactNumber: user?.phone || "",
    address: user?.address || "",
    role: user?.role || "Citizen",
    about:
      localStorage.getItem("casecast-about") ||
      "Legal professional focused on data-driven court strategy and evidence-based risk interpretation.",
  });
  const [draftProfile, setDraftProfile] = useState(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [passwordDraft, setPasswordDraft] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [sessions, setSessions] = useState([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [sessionActionMsg, setSessionActionMsg] = useState("");

  const fetchSessions = useCallback(async () => {
    const token = localStorage.getItem("casecast-token");
    if (!token) return;
    try {
      setIsSessionsLoading(true);
      const res = await fetch(`${BASE_URL}/api/auth/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setIsSessionsLoading(false);
    }
  }, [onLogout]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const revokeSession = async (sessionId) => {
    const token = localStorage.getItem("casecast-token");
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/auth/sessions/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      if (res.ok) {
        setSessionActionMsg("Session revoked successfully.");
        await fetchSessions();
      } else {
        const err = await res.json().catch(() => null);
        setSessionActionMsg(err?.detail || "Failed to revoke session.");
      }
    } catch (err) {
      console.error("Failed to revoke session:", err);
      setSessionActionMsg("Network error revoking session.");
    }
  };

  useEffect(() => {
    const updated = {
      fullName: user?.full_name || inferredName,
      email: user?.email || signedInEmail,
      contactNumber: user?.phone || "",
      address: user?.address || "",
      role: user?.role || "Citizen",
      about:
        localStorage.getItem("casecast-about") ||
        "Legal professional focused on data-driven court strategy and evidence-based risk interpretation.",
    };
    setProfile(updated);
    setDraftProfile(updated);
  }, [user, inferredName, signedInEmail]);

  const initials = useMemo(() => {
    const parts = (profile.fullName || "User").trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("");
  }, [profile.fullName]);

  const updateDraftField = (key, value) => {
    setDraftProfile((prev) => ({ ...prev, [key]: value }));
  };

  const startEdit = () => {
    setDraftProfile(profile);
    setIsEditing(true);
    setSaveMessage("");
  };

  const cancelEdit = () => {
    setDraftProfile(profile);
    setIsEditing(false);
    setSaveMessage("Changes discarded.");
  };

  const saveEdit = async () => {
    const token = localStorage.getItem("casecast-token");
    const payload = {
      full_name: draftProfile.fullName,
      phone: draftProfile.contactNumber,
      address: draftProfile.address,
      role: draftProfile.role,
    };

    try {
      if (token) {
        const res = await fetch(`${BASE_URL}/api/users/me`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Profile update failed: ${errText}`);
        }

        const updatedUserData = await res.json();
        if (setUser) {
          setUser(updatedUserData);
        }
        localStorage.setItem("casecast-user", JSON.stringify(updatedUserData));
      }

      if (draftProfile.about) {
        localStorage.setItem("casecast-about", draftProfile.about);
      }

      setProfile(draftProfile);
      setIsEditing(false);
      setSaveMessage("Profile updates saved successfully.");
    } catch (err) {
      console.error("Failed to save profile:", err);
      setSaveMessage(err?.message || "Unable to save profile updates right now.");
    }
  };

  const savePassword = async () => {
    if (!passwordDraft.currentPassword || !passwordDraft.newPassword || !passwordDraft.confirmPassword) {
      setSaveMessage("Please complete all password fields.");
      return;
    }

    if (passwordDraft.newPassword.length < 8) {
      setSaveMessage("New password must be at least 8 characters long.");
      return;
    }

    if (passwordDraft.newPassword !== passwordDraft.confirmPassword) {
      setSaveMessage("New password and confirmation must match.");
      return;
    }

    if (passwordDraft.currentPassword === passwordDraft.newPassword) {
      setSaveMessage("New password must be different from current password.");
      return;
    }

    try {
      const token = localStorage.getItem("casecast-token");
      if (!token) {
        setSaveMessage("Authentication token not found. Please log in again.");
        return;
      }

      setIsPasswordUpdating(true);

      const res = await fetch(`${BASE_URL}/api/users/me/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: passwordDraft.currentPassword,
          new_password: passwordDraft.newPassword,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          onLogout();
          return;
        }
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.detail || "Current password is incorrect.");
      }

      setPasswordDraft({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordFields(false);
      setSaveMessage("Password updated successfully. Other sessions revoked.");
      await fetchSessions();
    } catch (err) {
      console.error("Failed to update password:", err);
      setSaveMessage(err?.message || "Unable to update password right now.");
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  const passwordStrength = useMemo(() => {
    const pwd = passwordDraft.newPassword || "";
    if (!pwd) return { label: "", color: "", score: 0 };

    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { label: "Weak", color: "text-rose-300", score: 1 };
    if (score <= 4) return { label: "Medium", color: "text-amber-300", score: 2 };
    return { label: "Strong", color: "text-emerald-300", score: 3 };
  }, [passwordDraft.newPassword]);

  const activeProfile = isEditing ? draftProfile : profile;

  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto flex flex-col gap-8 w-full"
    >
      <div className="glass-panel p-8 md:p-10 rounded-3xl border-t-4 border-indigo-500 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left shadow-[0_0_40px_rgba(99,102,241,0.12)]">
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)] flex-shrink-0 border border-white/20">
          <span className="text-white font-display text-2xl font-bold">
            {initials || <UserRound className="w-10 h-10 text-white" />}
          </span>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-950 border border-white/20 flex items-center justify-center">
            <UserRound className="w-4 h-4 text-cyan-300" />
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-3xl font-display font-bold text-white mb-1">{activeProfile.fullName}</h2>
          <p className="text-slate-400 text-sm mb-2">{activeProfile.email}</p>
          <div className="mb-4 max-w-[220px] mx-auto md:mx-0">
            <select
              className="input-glass text-sm font-semibold"
              value={activeProfile.role}
              disabled={!isEditing}
              onChange={(e) => updateDraftField("role", e.target.value)}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role} className="bg-slate-900 text-white">
                  {role}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed max-w-xl">{activeProfile.about}</p>
        </div>

        <div className="flex flex-col gap-3 w-full md:w-auto">
          {!isEditing ? (
            <button onClick={startEdit} className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap">
              <Pencil className="w-4 h-4" /> Edit Profile
            </button>
          ) : (
            <>
              <button onClick={saveEdit} className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap">
                <Save className="w-4 h-4" /> Save
              </button>
              <button onClick={cancelEdit} className="btn-secondary flex items-center justify-center gap-2 whitespace-nowrap">
                <X className="w-4 h-4" /> Cancel
              </button>
            </>
          )}

          <button
            onClick={onLogout}
            className="btn-secondary flex items-center justify-center md:justify-start gap-2 text-rose-400 hover:text-rose-300 border-rose-900/50 hover:bg-rose-900/30 w-full md:w-auto"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="glass-panel p-4 rounded-xl border-cyan-500/30 text-cyan-200 text-sm text-center">
          {saveMessage}
        </div>
      )}

      {/* Profile Details Edit Form */}
      {isEditing && (
        <div className="glass-panel p-8 rounded-3xl flex flex-col gap-6">
          <h3 className="font-display font-bold text-xl text-white">Edit Profile Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-300 uppercase">Full Name</span>
              <input
                type="text"
                className="input-glass"
                value={draftProfile.fullName}
                onChange={(e) => updateDraftField("fullName", e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-300 uppercase">Phone</span>
              <input
                type="tel"
                className="input-glass"
                placeholder="+1-555-0100"
                value={draftProfile.contactNumber}
                onChange={(e) => updateDraftField("contactNumber", e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="text-xs font-semibold text-slate-300 uppercase">Address</span>
              <input
                type="text"
                className="input-glass"
                placeholder="Street, City, State"
                value={draftProfile.address}
                onChange={(e) => updateDraftField("address", e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="text-xs font-semibold text-slate-300 uppercase">About / Bio</span>
              <textarea
                className="input-glass resize-none"
                rows={3}
                value={draftProfile.about}
                onChange={(e) => updateDraftField("about", e.target.value)}
              />
            </label>
          </div>
        </div>
      )}

      {/* Password Management */}
      <div className="glass-panel p-8 rounded-3xl flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-display font-bold text-xl text-white">Security & Password</h3>
            <p className="text-xs text-slate-400 mt-1">Update your password securely</p>
          </div>
          <button
            type="button"
            onClick={() => setShowPasswordFields((prev) => !prev)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <KeyRound className="w-4 h-4" />
            {showPasswordFields ? "Hide" : "Change Password"}
          </button>
        </div>

        {showPasswordFields && (
          <div className="flex flex-col gap-4 border-t border-white/5 pt-6">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-300 uppercase">Current Password</span>
              <input
                type="password"
                className="input-glass"
                value={passwordDraft.currentPassword}
                onChange={(e) => setPasswordDraft((prev) => ({ ...prev, currentPassword: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-300 uppercase">New Password</span>
              <input
                type="password"
                className="input-glass"
                placeholder="At least 8 characters"
                value={passwordDraft.newPassword}
                onChange={(e) => setPasswordDraft((prev) => ({ ...prev, newPassword: e.target.value }))}
              />
            </label>
            {passwordStrength.label && (
              <p className={`text-xs ${passwordStrength.color}`}>Strength: {passwordStrength.label}</p>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-300 uppercase">Confirm New Password</span>
              <input
                type="password"
                className="input-glass"
                value={passwordDraft.confirmPassword}
                onChange={(e) => setPasswordDraft((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </label>
            <button
              type="button"
              disabled={isPasswordUpdating}
              onClick={savePassword}
              className="btn-primary mt-2"
            >
              {isPasswordUpdating ? "Updating..." : "Update Password"}
            </button>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="glass-panel p-8 rounded-3xl flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-display font-bold text-xl text-white">Active Sessions</h3>
            <p className="text-xs text-slate-400 mt-1">Manage active logins and connected devices</p>
          </div>
          <button
            type="button"
            onClick={fetchSessions}
            disabled={isSessionsLoading}
            className="btn-secondary flex items-center gap-2 text-xs py-1.5 px-3"
            title="Refresh sessions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSessionsLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {sessionActionMsg && (
          <p className="text-xs text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 rounded-lg p-2.5">
            {sessionActionMsg}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {sessions.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">
              {isSessionsLoading ? "Loading active sessions..." : "No active sessions found."}
            </p>
          ) : (
            sessions.map((sess) => {
              const isCurrent = sess.is_current;
              const isActive = sess.is_active;
              const formattedDate = sess.issued_at
                ? new Date(sess.issued_at).toLocaleString()
                : "Unknown";

              return (
                <div
                  key={sess.session_id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border ${
                    isCurrent
                      ? "bg-cyan-950/20 border-cyan-500/30"
                      : isActive
                      ? "bg-white/[0.02] border-white/10"
                      : "bg-black/20 border-white/5 opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg mt-0.5 ${
                        isCurrent
                          ? "bg-cyan-500/10 text-cyan-400"
                          : isActive
                          ? "bg-indigo-500/10 text-indigo-400"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-200 truncate max-w-xs sm:max-w-md">
                          {sess.user_agent || "Unknown Browser / Client"}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Current
                          </span>
                        )}
                        {!isActive && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Revoked
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 mt-0.5">
                        Issued: {formattedDate}
                        {sess.revoked_at ? ` · Revoked: ${new Date(sess.revoked_at).toLocaleString()}` : ""}
                      </span>
                    </div>
                  </div>

                  {isActive && !isCurrent && (
                    <button
                      type="button"
                      onClick={() => revokeSession(sess.session_id)}
                      className="btn-secondary text-xs text-rose-400 hover:text-rose-300 border-rose-900/40 hover:bg-rose-900/30 py-1.5 px-3 self-end sm:self-center flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Revoke
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}
