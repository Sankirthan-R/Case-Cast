import { AnimatePresence, motion } from "framer-motion";
import { Activity, ChevronDown, History, Home, LogOut, Scale, Sparkles, UserRound } from "lucide-react";

const navItems = [
  { key: "home",    label: "Dashboard", icon: Home },
  { key: "casting", label: "Predictor",  icon: Sparkles },
  { key: "history", label: "Logs",       icon: History },
  { key: "profile", label: "Settings",   icon: UserRound },
];

/**
 * AppShell — top nav bar, mobile nav bar, footer wrapper.
 * Children are rendered in the <main> content area.
 */
export default function AppShell({
  user,
  onLogout,
  activeTab,
  setActiveTab,
  stats,
  showProfileMenu,
  setShowProfileMenu,
  children,
}) {
  const authProvider = (user?.app_metadata?.provider || "email").toUpperCase();
  const signedInEmail = user?.email || "Authenticated User";
  const username = user?.user_metadata?.username || signedInEmail?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans overflow-hidden">

      {/* Global Background Blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-indigo-900/10 blur-[150px] rounded-full mix-blend-screen animate-pulse duration-[10s]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-900/10 blur-[150px] rounded-full mix-blend-screen animate-pulse duration-[12s]" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.02]" />
      </div>

      {/* ── Top Navigation Bar ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full bg-black/50 backdrop-blur-xl border-b border-white/5 flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-3">
          <Scale className="text-cyan-400 w-6 h-6" />
          <h1 className="font-display font-bold text-xl tracking-wide text-white">CaseCast</h1>
        </div>

        {/* Desktop nav pills */}
        <nav className="hidden md:flex bg-white/5 border border-white/10 rounded-full p-1 lg:p-1.5 backdrop-blur-md">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`relative px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${
                  isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-white/10 rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : ""}`} />
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
          >
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest leading-none mb-1">{authProvider}</div>
              <div className="text-sm font-medium text-slate-300 leading-none">{username}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.3)]">
              <UserRound className="w-4 h-4 text-white" />
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full mt-2 right-0 w-64 glass-card border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-3xl z-50"
              >
                <div className="flex items-center gap-3 border-b border-white/5 pb-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{username}</p>
                    <p className="text-xs text-slate-400">{signedInEmail}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-slate-400">Total Predictions</span>
                  <span className="text-sm font-bold text-cyan-400">{stats.totalCasts}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full py-2 bg-rose-500/10 text-rose-400 rounded-lg text-sm text-center font-medium hover:bg-rose-500/20 transition-colors"
                >
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ── Mobile Nav ──────────────────────────────────────────────── */}
      <div className="md:hidden flex justify-center gap-2 p-4 glass-panel border-b-0 sticky top-[72px] z-40 bg-black/80 mx-4 mt-4 rounded-xl">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            className={`p-3 rounded-lg ${activeTab === item.key ? "bg-cyan-900/40 text-cyan-400" : "text-slate-400"}`}
          >
            <item.icon className="w-5 h-5" />
          </button>
        ))}
      </div>

      {/* ── Page Content ─────────────────────────────────────────────── */}
      <main className="flex-1 relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col gap-8">
        {children}
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-black/80 backdrop-blur-md mt-auto z-10 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div>
            <p className="font-display font-bold text-white text-lg">CaseCast AI</p>
            <p className="text-slate-500 text-sm mt-1">Premium legal intelligence frontend for ML-powered case outcome prediction.</p>
          </div>
          <div className="flex flex-col gap-1 text-slate-500 text-xs md:text-right">
            <span>Copyright © 2026 CaseCast Technologies.</span>
            <span>sankirthan1811@gmail.com | +91 9876543210</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
