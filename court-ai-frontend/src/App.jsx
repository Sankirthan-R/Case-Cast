import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import ClickSpark from "./components/ClickSpark";
import FrostedLoginForm from "./components/FrostedLoginForm";
import SplitText from "./components/SplitText";
import StarBorder from "./components/StarBorder";
import Login from "./pages/Login";
import MainPortal from "./pages/MainPortal";
import { hasSupabaseConfig, supabase, supabaseInitError } from "./supabaseClient";

const letterSource = "CASECOURTCRIMEPREDICTIONCONVICTION";

function Landing({ user, onLogin, onSignup, onForgot, onGoogleAuth }) {
  const navigate = useNavigate();
  const [cursor, setCursor] = useState({ x: 0, y: 0, active: false });
  const [cursorLetters, setCursorLetters] = useState([]);
  const [showInlineLogin, setShowInlineLogin] = useState(false);
  const [isAuthHovered, setIsAuthHovered] = useState(false);
  const lastSpawnRef = useRef(0);
  const letterIndexRef = useRef(0);

  const spawnCursorLetter = (x, y) => {
    const now = performance.now();
    if (now - lastSpawnRef.current < 150) {
      return;
    }

    lastSpawnRef.current = now;
    const id = `${now}-${Math.random().toString(36).slice(2, 8)}`;
    const sequence = letterIndexRef.current++;

    const angle = Math.random() * Math.PI * 2;
    const radius = 26 + Math.random() * 56;
    const spawnX = x + Math.cos(angle) * radius;
    const spawnY = y + Math.sin(angle) * radius;

    const letter = {
      id,
      text: letterSource[sequence % letterSource.length],
      x: spawnX,
      y: spawnY,
      dx: `${(Math.random() - 0.5) * 42}px`,
      dy: `${-14 - Math.random() * 36}px`,
      size: `${0.84 + Math.random() * 0.78}rem`,
      duration: `${1.05 + Math.random() * 0.42}s`,
      rotation: `${(Math.random() - 0.5) * 18}deg`,
    };

    setCursorLetters((prev) =>
      prev.length > 26 ? [...prev.slice(-20), letter] : [...prev, letter],
    );

    setTimeout(() => {
      setCursorLetters((prev) => prev.filter((item) => item.id !== id));
    }, 1220);
  };

  const handleGetStarted = () => {
    if (user) {
      navigate("/app");
      return;
    }

    if (showInlineLogin) {
      return;
    }

    setShowInlineLogin(true);
  };

  return (
    <div
      className={`landing-shell${isAuthHovered ? " is-auth-hovered" : ""}`}
      onMouseMove={(event) => {
        setCursor({ x: event.clientX, y: event.clientY, active: true });
        spawnCursorLetter(event.clientX, event.clientY);
      }}
      onMouseLeave={() => {
        setCursor((prev) => ({ ...prev, active: false }));
        setCursorLetters([]);
      }}
      onMouseEnter={() => setCursor((prev) => ({ ...prev, active: true }))}
    >
      <div
        className={`cursor-letter-field${cursor.active ? " is-active" : ""}`}
        style={{
          "--cursor-x": `${cursor.x}px`,
          "--cursor-y": `${cursor.y}px`,
        }}
        aria-hidden="true"
      >
        {cursorLetters.map((letter) => (
          <span
            key={letter.id}
            className="emerging-letter"
            style={{
              "--start-x": `${letter.x}px`,
              "--start-y": `${letter.y}px`,
              "--letter-dx": letter.dx,
              "--letter-dy": letter.dy,
              "--letter-size": letter.size,
              "--letter-duration": letter.duration,
              "--letter-rotation": letter.rotation,
            }}
          >
            {letter.text}
          </span>
        ))}
      </div>

      <main className="hero-wrap">
        <motion.section
          className={`hero-content${showInlineLogin ? " is-auth-open" : ""}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.24 }}
        >
          <p className="hero-kicker">Legal intelligence, reimagined</p>

          <ClickSpark
            sparkColor="rgba(226, 239, 255, 0.95)"
            sparkSize={12}
            sparkRadius={22}
            sparkCount={9}
            duration={520}
            easing="ease-out"
            extraScale={1.05}
            className="title-spark-wrap"
          >
            <SplitText
              tag="h1"
              text="CASE CAST"
              className="dot-title"
              splitType="chars"
              triggerOnLoad
              delay={38}
              duration={0.9}
              ease="power4.out"
              from={{ opacity: 0, y: 42, rotationX: -26 }}
              to={{ opacity: 1, y: 0, rotationX: 0 }}
              threshold={0.08}
            />
          </ClickSpark>

          <div className={`hero-actions${showInlineLogin ? " is-expanded" : ""}`}>
            <AnimatePresence mode="wait" initial={false}>
              {!showInlineLogin ? (
                <motion.div
                  key="cta"
                  layoutId="auth-morph-shell"
                  className="cta-shell"
                  transition={{ type: "spring", stiffness: 240, damping: 28, mass: 1 }}
                >
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                    <StarBorder
                      as="button"
                      type="button"
                      onClick={handleGetStarted}
                      className="get-started-btn"
                      color="rgba(203, 229, 255, 0.95)"
                      speed="6.8s"
                    >
                      <span>Get Started</span>
                      <span className="arrow">-&gt;</span>
                    </StarBorder>
                  </motion.div>
                </motion.div>
              ) : (
                <StarBorder
                  as={motion.section}
                  key="login"
                  layoutId="auth-morph-shell"
                  className="inline-frosted-shell inline-frosted-shell--star"
                  onMouseEnter={() => setIsAuthHovered(true)}
                  onMouseLeave={() => setIsAuthHovered(false)}
                  initial={{ opacity: 0.6, y: 14, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 14, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 235, damping: 30, mass: 1.08 }}
                  color="rgba(206, 229, 255, 0.9)"
                  speed="8.4s"
                  thickness={1.2}
                >
                  <FrostedLoginForm
                    title="Login"
                    subtitle="Sign in to CaseCast"
                    onClose={() => setShowInlineLogin(false)}
                    onLogin={onLogin}
                    onSignup={onSignup}
                    onForgot={onForgot}
                    onGoogleAuth={onGoogleAuth}
                  />
                </StarBorder>
              )}
            </AnimatePresence>
          </div>
        </motion.section>
      </main>
    </div>
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
    if (!supabase) {
      throw new Error(supabaseInitError || "Supabase is not configured.");
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || "",
        },
      },
    });

    if (error) {
      throw error;
    }

    return {
      message: data.session
        ? "User created and signed in."
        : "User created. Check your email for verification.",
    };
  };

  const handleLogin = async ({ email, password }) => {
    if (!supabase) {
      throw new Error(supabaseInitError || "Supabase is not configured.");
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      throw userError;
    }

    console.log("Supabase auth user:", userData.user);
    navigate("/app");

    return {
      message: `Logged in as ${userData.user?.email || email}`,
    };
  };

  const handleGoogleAuth = async () => {
    if (!supabase) {
      throw new Error(supabaseInitError || "Supabase is not configured.");
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/app`,
      },
    });

    if (error) {
      throw error;
    }
  };

  const handleForgotPassword = async ({ email }) => {
    if (!supabase) {
      throw new Error(supabaseInitError || "Supabase is not configured.");
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      throw error;
    }

    return { message: "Password reset email sent." };
  };

  const handleLogout = async () => {
    if (!supabase) {
      navigate("/login");
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    navigate("/login");
  };

  if (isAuthLoading) {
    return (
      <div className="app-shell">
        <div className="site-background" aria-hidden="true" />
        <div className="site-background-tint" aria-hidden="true" />
        <div className="app-content" style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: "#fff" }}>
          Loading authentication...
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="site-background" aria-hidden="true" />
      <div className="site-background-tint" aria-hidden="true" />

      <ClickSpark
        sparkColor="rgba(198, 224, 255, 0.9)"
        sparkSize={9}
        sparkRadius={18}
        sparkCount={7}
        duration={420}
        easing="ease-out"
        extraScale={1}
        className="w-full h-full"
      >
        <div className="app-content">
          <Routes>
            <Route
              path="/"
              element={(
                <Landing
                  key={`landing-${location.key}`}
                  user={currentUser}
                  onLogin={handleLogin}
                  onSignup={handleSignup}
                  onForgot={handleForgotPassword}
                  onGoogleAuth={handleGoogleAuth}
                />
              )}
            />
            <Route
              path="/login"
              element={(
                <Login
                  user={currentUser}
                  onLogin={handleLogin}
                  onSignup={handleSignup}
                  onForgot={handleForgotPassword}
                  onGoogleAuth={handleGoogleAuth}
                />
              )}
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
      </ClickSpark>
    </div>
  );
}

export default App;