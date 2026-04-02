import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ClickSpark from "../components/ClickSpark";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <ClickSpark
      sparkColor="rgba(209, 233, 255, 0.9)"
      sparkSize={9}
      sparkRadius={20}
      sparkCount={8}
      duration={430}
      easing="ease-out"
    >
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center overflow-hidden">
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-6xl font-bold mb-6"
        >
          CaseCast
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-lg text-gray-400 mb-10"
        >
          AI-powered Court Case Prediction
        </motion.p>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/login")}
          className="px-6 py-3 border border-white rounded-full hover:bg-white hover:text-black transition"
        >
          Get Started
        </motion.button>
      </div>
    </ClickSpark>
  );
}