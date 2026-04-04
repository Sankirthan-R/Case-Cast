import { motion } from "framer-motion";

/**
 * Reusable orbital spinner shown during prediction processing.
 */
export default function OrbitalSpinner() {
  return (
    <div className="relative flex items-center justify-center w-32 h-32 mb-8">
      {/* Outer ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 border-r-cyan-400/30"
      />
      {/* Middle ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="absolute inset-3 rounded-full border-2 border-transparent border-t-indigo-400 border-l-indigo-400/30"
      />
      {/* Inner ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        className="absolute inset-6 rounded-full border-2 border-transparent border-t-purple-400 border-b-purple-400/20"
      />
      {/* Center pulsing orb */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="w-5 h-5 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]"
      />
    </div>
  );
}
