import { motion } from "framer-motion";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FrostedLoginForm from "../components/FrostedLoginForm";

export default function Login({ user, onLogin, onSignup }) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const authRequiredNotice = searchParams.get("msg") === "auth_required";

  useEffect(() => {
    if (user) {
      navigate("/app", { replace: true });
    }
  }, [user, navigate]);

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Mesh */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-900/40 rounded-full mix-blend-screen filter blur-[120px] animate-pulse"></div>
        <div
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-900/40 rounded-full mix-blend-screen filter blur-[150px] animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 z-0 bg-[url('/noise.svg')] opacity-[0.04]"></div>

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="glass-panel p-8 rounded-3xl relative overflow-hidden group border-white/10 hover:border-cyan-500/30 transition-colors duration-500">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

          {authRequiredNotice && (
            <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs text-center font-medium">
              Create an account and log in to use the model
            </div>
          )}

          <FrostedLoginForm
            title="Login"
            subtitle="Welcome to CaseCast"
            showHomeButton
            onHome={() => navigate("/")}
            onLogin={onLogin}
            onSignup={onSignup}
          />
        </div>
      </motion.div>
    </main>
  );
}
