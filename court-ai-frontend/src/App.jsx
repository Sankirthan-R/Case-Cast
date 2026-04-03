import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import MainPortal from "./pages/MainPortal";
import { hasSupabaseConfig, supabase, supabaseInitError } from "./supabaseClient";
import FrostedLoginForm from "./components/FrostedLoginForm";
import { Scale, BookOpen, ScrollText } from "lucide-react";

function Landing({ user, onLogin, onSignup, onForgot, onGoogleAuth }) {
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
      {/* Majestic Royal Courtroom Background (Landing Page Only) */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#050505]">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat opacity-[0.55]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-black/30"></div>
        {/* Subtle warm glow behind text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-700/20 filter blur-[150px] rounded-full"></div>
      </div>
      
      {/* Grid Overlay & Subdued Noise */}
      <div className="fixed inset-0 z-0 bg-[url('/noise.svg')] opacity-[0.06] pointer-events-none"></div>

      <motion.main 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible" 
        className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 md:py-32 flex flex-col items-center text-center my-auto min-h-screen justify-center"
      >
        <motion.div variants={itemVariants} className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-amber-500/20 bg-amber-950/20 text-amber-100 text-xs md:text-sm font-semibold tracking-[0.2em] uppercase mb-10 shadow-[0_0_30px_rgba(217,119,6,0.1)] backdrop-blur-xl">
          <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)] animate-pulse"></span>
          Supreme Legal Intelligence
        </motion.div>

        <motion.div variants={itemVariants} className="mb-8 perspective-1000 w-full">
          <h1 className="font-royal flex flex-wrap justify-center items-center py-4 drop-shadow-2xl">
            {"CASE CAST".split("").map((char, index) => {
               if (char === " ") return <span key={index} className="w-6 md:w-12"></span>;
               
               // All characters use a completely vintage, premium warm gold/silver blend
               const gradStyle = "text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-200 to-amber-600 drop-shadow-[0_0_40px_rgba(251,191,36,0.2)]";

               return (
                 <motion.span 
                   key={index}
                   initial={{ opacity: 0, y: 70, filter: 'blur(20px)', rotateX: -90, scale: 0.8 }}
                   animate={{ opacity: 1, y: 0, filter: 'blur(0px)', rotateX: 0, scale: 1 }}
                   transition={{ duration: 1.5, delay: 0.2 + index * 0.1, type: "spring", stiffness: 80, damping: 20 }}
                   className={`text-[4.5rem] sm:text-[6rem] md:text-[9rem] lg:text-[11rem] md:leading-none font-bold tracking-tight mx-[2px] md:mx-[6px] ${gradStyle}`}
                 >
                   {char}
                 </motion.span>
               )
            })}
          </h1>
        </motion.div>
        
        <motion.p variants={itemVariants} className="max-w-3xl text-amber-100/70 text-lg md:text-2xl leading-relaxed mb-16 font-light tracking-wide shadow-black">
          Leverage advanced machine learning architecture to forecast conviction rates, evaluate risk, and map recidivism with absolute situational awareness.
        </motion.p>

        <motion.div variants={itemVariants} className="relative w-full max-w-md mx-auto flex justify-center h-[520px]">
          <AnimatePresence mode="wait">
            {!showInlineLogin ? (
              <motion.button 
                key="btn"
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20, filter: 'blur(15px)' }}
                transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 20 }}
                onClick={handleGetStarted}
                className="group absolute top-6 px-10 py-5 bg-black border border-white/10 hover:border-cyan-500/50 rounded-full shadow-[0_0_60px_rgba(0,0,0,0.8)] hover:shadow-[0_0_80px_rgba(6,182,212,0.3)] transition-all duration-500 flex items-center gap-4 overflow-hidden focus:outline-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/30 to-indigo-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <span className="relative z-10 font-display font-black tracking-[0.15em] uppercase text-sm text-slate-100 group-hover:text-white flex items-center justify-center gap-4">
                  Get Started
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-black transition-colors duration-300 shadow-inner">
                    <ChevronRightIcon />
                  </div>
                </span>
                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/80 to-transparent scale-0 group-hover:scale-100 transition-transform duration-700 origin-center"></div>
              </motion.button>
            ) : (
              <motion.div
                key="loginform"
                initial={{ opacity: 0, scale: 0.9, y: 50, filter: 'blur(20px)' }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.95, y: -30, filter: 'blur(20px)' }}
                transition={{ type: "spring", stiffness: 120, damping: 18, mass: 0.8 }}
                className="absolute inset-x-0 top-0 w-full z-20"
              >
                <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl rounded-[2.5rem] -z-10 shadow-[0_0_100px_rgba(0,0,0,0.9)] border border-white/10"></div>
                <div className="p-8 md:p-10 relative">
                   <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
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

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setIsAuthLoading(false);
      return;
    }

    let isActive = true;

    const initializeSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (isActive) {
        setCurrentUser(data.session?.user ?? null);
        setIsAuthLoading(false);
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