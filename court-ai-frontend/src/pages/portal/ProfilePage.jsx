import { motion } from "framer-motion";
import { KeyRound, LogOut, Pencil, Phone, Save, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";

/**
 * ProfilePage — User account info, editable profile, and password update.
 */
export default function ProfilePage({ user, onLogout }) {
  const roleOptions = ["Lawyer", "Judge", "Law Student", "Citizen"];
  const profileStorageKey = `casecast-profile-${user?.id || "guest"}`;
  const signedInEmail = user?.email || "Authenticated User";
  const inferredName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.username ||
    signedInEmail.split("@")[0] ||
    "User";

  const [profile, setProfile] = useState({
    fullName: inferredName,
    email: user?.user_metadata?.profile_email || signedInEmail,
    contactNumber: user?.user_metadata?.phone || "",
    address: user?.user_metadata?.address || "",
    role: user?.user_metadata?.role || "Lawyer",
    about:
      user?.user_metadata?.about ||
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

  useEffect(() => {
    const metadataProfile = {
      fullName: user?.user_metadata?.full_name,
      email: user?.user_metadata?.profile_email || user?.email,
      contactNumber: user?.user_metadata?.phone,
      address: user?.user_metadata?.address,
      role: user?.user_metadata?.role,
      about: user?.user_metadata?.about,
    };

    let localProfile = {};
    try {
      localProfile = JSON.parse(localStorage.getItem(profileStorageKey) || "{}");
    } catch {
      localProfile = {};
    }

    const merged = {
      ...localProfile,
      ...Object.fromEntries(
        Object.entries(metadataProfile).filter(([, value]) => value !== undefined && value !== null && value !== "")
      ),
    };

    setProfile((prev) => ({ ...prev, ...merged }));
    setDraftProfile((prev) => ({ ...prev, ...merged }));
  }, [user, profileStorageKey]);

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
    const payload = {
      full_name: draftProfile.fullName,
      profile_email: draftProfile.email,
      phone: draftProfile.contactNumber,
      address: draftProfile.address,
      role: draftProfile.role,
      about: draftProfile.about,
    };

    try {
      if (supabase) {
        const { error } = await supabase.auth.updateUser({ data: payload });
        if (error) throw error;
      }

      localStorage.setItem(profileStorageKey, JSON.stringify(draftProfile));
      setProfile(draftProfile);
      setIsEditing(false);
      setSaveMessage("Profile updates saved.");
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
      if (!supabase) {
        setSaveMessage("Password update requires Supabase configuration.");
        return;
      }

      if (!user?.email) {
        setSaveMessage("Unable to verify your account email for password update.");
        return;
      }

      setIsPasswordUpdating(true);

      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordDraft.currentPassword,
      });
      if (reauthError) {
        throw new Error("Current password is incorrect.");
      }

      const { error } = await supabase.auth.updateUser({ password: passwordDraft.newPassword });
      if (error) throw error;

      setPasswordDraft({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordFields(false);
      setSaveMessage("Password updated successfully.");
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
          <span className="text-white font-display text-2xl font-bold">{initials || <UserRound className="w-10 h-10 text-white" />}</span>
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
                <option key={role}>{role}</option>
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
            <LogOut className="w-4 h-4" /> Terminate Session
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="glass-panel rounded-2xl border border-cyan-500/30 px-5 py-3 text-cyan-200 text-sm">
          {saveMessage}
        </div>
      )}

      <div className="glass-panel p-6 rounded-2xl border border-white/5">
        <p className="text-xs uppercase tracking-widest text-slate-300 font-bold mb-5">Personal Info</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-slate-300 uppercase tracking-wider font-semibold">Full Name</span>
            <input
              className="input-glass text-base font-semibold"
              value={activeProfile.fullName}
              disabled={!isEditing}
              onChange={(e) => updateDraftField("fullName", e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-slate-300 uppercase tracking-wider font-semibold">Email</span>
            <input
              className="input-glass text-base font-semibold"
              value={activeProfile.email}
              disabled={!isEditing}
              onChange={(e) => updateDraftField("email", e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-slate-300 uppercase tracking-wider font-semibold">Contact Number</span>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className="input-glass pl-10 text-base font-semibold"
                value={activeProfile.contactNumber}
                disabled={!isEditing}
                onChange={(e) => updateDraftField("contactNumber", e.target.value)}
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-slate-300 uppercase tracking-wider font-semibold">Role / Designation</span>
            <select
              className="input-glass text-base font-semibold"
              value={activeProfile.role}
              disabled={!isEditing}
              onChange={(e) => updateDraftField("role", e.target.value)}
            >
              {roleOptions.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-sm text-slate-300 uppercase tracking-wider font-semibold">Address (Optional)</span>
            <textarea
              className="input-glass min-h-20 text-base font-semibold"
              value={activeProfile.address}
              disabled={!isEditing}
              onChange={(e) => updateDraftField("address", e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-white/5">
        <p className="text-xs uppercase tracking-widest text-slate-300 font-bold mb-5">Security & Settings</p>
        <div className="glass-card p-4 border-white/10">
          <p className="text-sm text-white font-semibold flex items-center gap-2 mb-3">
            <KeyRound className="w-4 h-4 text-cyan-300" /> Change Password
          </p>
          {!showPasswordFields ? (
            <button type="button" onClick={() => setShowPasswordFields(true)} className="btn-secondary w-full text-sm">
              Open Password Form
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                type="password"
                className="input-glass"
                placeholder="Current password"
                value={passwordDraft.currentPassword}
                onChange={(e) => setPasswordDraft((prev) => ({ ...prev, currentPassword: e.target.value }))}
              />
              <input
                type="password"
                className="input-glass"
                placeholder="New password"
                value={passwordDraft.newPassword}
                onChange={(e) => setPasswordDraft((prev) => ({ ...prev, newPassword: e.target.value }))}
              />
              {passwordStrength.label && (
                <div className="rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 uppercase tracking-wider">Password Strength</span>
                    <span className={`font-semibold ${passwordStrength.color}`}>{passwordStrength.label}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength.score === 1
                          ? "bg-rose-400"
                          : passwordStrength.score === 2
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                      }`}
                      style={{ width: `${(passwordStrength.score / 3) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              <input
                type="password"
                className="input-glass"
                placeholder="Confirm new password"
                value={passwordDraft.confirmPassword}
                onChange={(e) => setPasswordDraft((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={savePassword}
                  disabled={isPasswordUpdating}
                  className="btn-primary flex-1 text-sm disabled:opacity-60"
                >
                  {isPasswordUpdating ? "Updating..." : "Save Password"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordFields(false)}
                  disabled={isPasswordUpdating}
                  className="btn-secondary flex-1 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-white/5">
        <p className="text-xs uppercase tracking-widest text-slate-300 font-bold mb-5">About / Bio</p>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-slate-300 uppercase tracking-wider font-semibold">Professional Summary</span>
          <textarea
            className="input-glass min-h-28 text-base font-semibold"
            value={activeProfile.about}
            disabled={!isEditing}
            onChange={(e) => updateDraftField("about", e.target.value)}
          />
        </label>
      </div>
    </motion.div>
  );
}
