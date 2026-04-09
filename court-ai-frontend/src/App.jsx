import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import MainPortal from "./pages/MainPortal";
import { hasSupabaseConfig, supabase, supabaseInitError } from "./supabaseClient";
import FrostedLoginForm from "./components/FrostedLoginForm";
import { MoonStar, Scale, Sun } from "lucide-react";

function Landing({ user, onLogin, onSignup, onForgot, onGoogleAuth, theme }) {
  const navigate = useNavigate();
  const [showInlineLogin, setShowInlineLogin] = useState(false);

  const handleGetStarted = () => {
    if (user) {
      navigate("/app");
      return;
    }
    setShowInlineLogin(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, filter: 'blur(10px)', scale: 0.95 },
    visible: {
      opacity: 1, y: 0, filter: 'blur(0px)', scale: 1,
      transition: { type: "spring", stiffness: 120, damping: 20 }
    }
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-y-auto overflow-x-hidden font-sans bg-black selection:bg-cyan-500/30 text-white">
      {/* Futuristic Royal Blue / Cyan Nebula Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-black">
        <motion.div animate={{ rotate: 360, scale: [1, 1.05, 1] }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute top-[-20%] left-[-20%] w-[100vw] h-[100vw] opacity-[0.5]">
          <div className="absolute top-[20%] right-[30%] w-[600px] h-[600px] bg-blue-600/30 rounded-full mix-blend-screen filter blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[20%] left-[20%] w-[700px] h-[700px] bg-cyan-800/30 rounded-full mix-blend-screen filter blur-[150px]"></div>
        </motion.div>
        <motion.div animate={{ rotate: -360, scale: [1, 1.1, 1] }} transition={{ duration: 80, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-10%] right-[-20%] w-[100vw] h-[100vw] opacity-[0.4]">
          <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-indigo-700/30 rounded-full mix-blend-screen filter blur-[150px] animate-pulse"></div>
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-sky-600/20 rounded-full mix-blend-screen filter blur-[120px]"></div>
        </motion.div>
      </div>

      {/* Grid Overlay & Subdued Noise */}
      <div className="fixed inset-0 z-0 bg-[url('/noise.svg')] opacity-[0.06] pointer-events-none"></div>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-6xl mx-auto px-6 py-12 md:py-16 flex flex-col items-center text-center my-auto min-h-screen justify-center pb-20"
      >
        <motion.div variants={itemVariants} className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-white/10 bg-white/5 text-slate-200 text-xs md:text-sm font-semibold tracking-[0.2em] uppercase mb-10 shadow-[0_0_30px_rgba(255,255,255,0.05)] backdrop-blur-xl">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-pulse"></span>
          Supreme Legal Intelligence
        </motion.div>

        <motion.div variants={itemVariants} className="mb-8 perspective-1000 w-full">
          <h1 className="font-display flex flex-wrap justify-center items-center py-4 drop-shadow-2xl">
            {"CASE CAST".split("").map((char, index) => {
              if (char === " ") return <span key={index} className="w-6 md:w-12"></span>;

              const isCast = index > 4;
              const gradStyle = isCast
                ? "text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 via-blue-500 to-indigo-600 drop-shadow-[0_0_40px_rgba(59,130,246,0.5)]"
                : theme === "light"
                  ? "text-slate-950 drop-shadow-[0_0_18px_rgba(15,23,42,0.18)]"
                  : "text-transparent bg-clip-text bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]";

              return (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 70, filter: 'blur(20px)', rotateX: -90, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)', rotateX: 0, scale: 1 }}
                  transition={{ duration: 1.5, delay: 0.2 + index * 0.1, type: "spring", stiffness: 80, damping: 20 }}
                  className={`text-[4.5rem] sm:text-[6rem] md:text-[9.5rem] lg:text-[11rem] md:leading-none font-bold tracking-tighter mx-[2px] md:mx-[6px] ${gradStyle}`}
                >
                  {char}
                </motion.span>
              )
            })}
          </h1>
        </motion.div>

        <motion.p variants={itemVariants} className="max-w-3xl text-slate-300 text-lg md:text-2xl leading-relaxed mb-10 font-light tracking-wide shadow-black">
          Leverage advanced machine learning architecture to forecast conviction rates, evaluate risk, and map recidivism with absolute situational awareness.
        </motion.p>

        <motion.div variants={itemVariants} className="relative w-full max-w-md mx-auto flex justify-center mt-4">
          <AnimatePresence mode="wait">
            {!showInlineLogin ? (
              <motion.button
                key="btn"
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20, filter: 'blur(15px)' }}
                transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 20 }}
                onClick={handleGetStarted}
                className="landing-get-started-btn group relative px-10 py-5 bg-black border border-white/10 hover:border-blue-500/50 rounded-full shadow-[0_0_60px_rgba(0,0,0,0.8)] hover:shadow-[0_0_80px_rgba(59,130,246,0.3)] transition-all duration-500 flex items-center gap-4 overflow-hidden focus:outline-none"
              >
                <div className="landing-get-started-overlay absolute inset-0 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <span className="relative z-10 font-display font-black tracking-[0.15em] uppercase text-sm text-slate-100 group-hover:text-white flex items-center justify-center gap-4">
                  Get Started
                  <div className="landing-get-started-icon w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300 shadow-inner">
                    <ChevronRightIcon />
                  </div>
                </span>
                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/80 to-transparent scale-0 group-hover:scale-100 transition-transform duration-700 origin-center"></div>
              </motion.button>
            ) : (
              <motion.div
                key="loginform"
                initial={{ opacity: 0, scale: 0.9, y: 50, filter: 'blur(20px)' }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.95, y: -30, filter: 'blur(20px)' }}
                transition={{ type: "spring", stiffness: 120, damping: 18, mass: 0.8 }}
                className="w-full relative z-20 mt-4"
              >
                <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl rounded-[2.5rem] -z-10 shadow-[0_0_100px_rgba(0,0,0,0.9)] border border-white/10"></div>
                <div className="p-8 md:p-10 relative">
                  <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
                  <FrostedLoginForm
                    onClose={() => setShowInlineLogin(false)}
                    onLogin={onLogin}
                    onSignup={onSignup}
                    onForgot={onForgot}
                    onGoogleAuth={onGoogleAuth}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.main>
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-5 h-5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6l6 6-6 6" />
    </svg>
  );
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("casecast-theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("casecast-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setIsAuthLoading(false);
      return;
    }

    let isActive = true;

    const initializeSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          // Stale/invalid refresh token — clear and continue as logged out
          await supabase.auth.signOut();
        }
        if (isActive) {
          setCurrentUser(data?.session?.user ?? null);
          setIsAuthLoading(false);
        }
      } catch (e) {
        console.warn("Auth session init error:", e);
        if (isActive) setIsAuthLoading(false);
      }
    };

    initializeSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => {
      isActive = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignup = async ({ email, password, username }) => {
    if (!supabase) throw new Error(supabaseInitError || "Supabase is not configured.");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: username || "" } },
    });
    if (error) throw error;
    return { message: data.session ? "User created and signed in." : "User created. Check your email for verification." };
  };

  const handleLogin = async ({ email, password }) => {
    if (!supabase) throw new Error(supabaseInitError || "Supabase is not configured.");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    navigate("/app");
    return { message: `Logged in as ${userData.user?.email || email}` };
  };

  const handleGoogleAuth = async () => {
    if (!supabase) throw new Error(supabaseInitError || "Supabase is not configured.");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/app` },
    });
    if (error) throw error;
  };

  const handleForgotPassword = async ({ email }) => {
    if (!supabase) throw new Error(supabaseInitError || "Supabase is not configured.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw error;
    return { message: "Password reset email sent." };
  };

  const handleLogout = async () => {
    if (!supabase) { navigate("/login"); return; }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    navigate("/login");
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-900 border-t-cyan-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-50 selection:bg-cyan-500/30">
      <button
        type="button"
        onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        className="theme-toggle fixed top-4 right-4 z-[120]"
      >
        {theme === "dark" ? <Sun className="w-4 h-4" /> : <MoonStar className="w-4 h-4" />}
        <span className="text-xs font-semibold tracking-wide">
          {theme === "dark" ? "Light" : "Dark"}
        </span>
      </button>
      <Routes>
        <Route
          path="/"
          element={
            <Landing
              key={`landing-${location.key}`}
              user={currentUser}
              onLogin={handleLogin}
              onSignup={handleSignup}
              onForgot={handleForgotPassword}
              onGoogleAuth={handleGoogleAuth}
              theme={theme}
            />
          }
        />
        <Route
          path="/login"
          element={
            <Login
              user={currentUser}
              onLogin={handleLogin}
              onSignup={handleSignup}
              onForgot={handleForgotPassword}
              onGoogleAuth={handleGoogleAuth}
            />
          }
        />
        <Route
          path="/app"
          element={
            currentUser || !hasSupabaseConfig ? (
              <MainPortal user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </div>
  );
}

export default App;