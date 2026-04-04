import { motion } from "framer-motion";
import { LogOut, UserRound } from "lucide-react";

/**
 * ProfilePage — User account info and logout.
 */
export default function ProfilePage({ user, onLogout }) {
  const signedInEmail = user?.email || "Authenticated User";
  const username = user?.user_metadata?.username || signedInEmail?.split("@")[0] || "User";
  const authProvider = (user?.app_metadata?.provider || "email").toUpperCase();

  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto flex flex-col gap-8 w-full"
    >
      {/* Profile Card */}
      <div className="glass-panel p-10 rounded-3xl border-t-4 border-indigo-500 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left shadow-[0_0_40px_rgba(99,102,241,0.1)]">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)] flex-shrink-0">
          <UserRound className="w-10 h-10 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-3xl font-display font-bold text-white mb-1">{username}</h2>
          <p className="text-slate-500 text-sm mb-1">{signedInEmail}</p>
          <span className="inline-block px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono tracking-widest uppercase text-slate-400 mb-6">
            {authProvider}
          </span>
          <div className="block">
            <button
              onClick={onLogout}
              className="btn-secondary flex items-center justify-center md:justify-start gap-2 text-rose-400 hover:text-rose-300 border-rose-900/50 hover:bg-rose-900/30 w-full md:w-auto"
            >
              <LogOut className="w-4 h-4" /> Terminate Session
            </button>
          </div>
        </div>
      </div>

      {/* Info Row */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5">
        <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">Account Details</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-600 uppercase tracking-wider">User ID</span>
            <span className="text-slate-300 text-sm font-mono truncate">{user?.id || "—"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-600 uppercase tracking-wider">Auth Provider</span>
            <span className="text-slate-300 text-sm">{authProvider}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
