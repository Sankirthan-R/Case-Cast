import { motion } from "framer-motion";
import { ChevronRight, Scale, Activity, ShieldAlert, Sparkles } from "lucide-react";

/**
 * HomePage — Dashboard hero banner + feature cards.
 * @param {function} onStartPredicting - Callback to switch to the predictor tab
 */
export default function HomePage({ onStartPredicting }) {
  return (
    <motion.div
      key="home"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col gap-8 w-full"
    >
      {/* ── Hero Banner ─────────────────────────────────────────────── */}
      <div className="relative w-full rounded-[2.5rem] p-10 md:p-[4.5rem] overflow-hidden border border-white/10 group shadow-[0_0_120px_rgba(34,211,238,0.07)] bg-black">
        {/* Aurora blobs */}
        <div className="absolute top-[-50%] left-[-20%] w-[800px] h-[800px] bg-cyan-600/40 blur-[150px] rounded-full mix-blend-screen opacity-70 group-hover:opacity-100 transition-opacity duration-1000 animate-pulse pointer-events-none" />
        <div className="absolute bottom-[-50%] right-[-20%] w-[800px] h-[800px] bg-indigo-600/40 blur-[150px] rounded-full mix-blend-screen opacity-70 group-hover:opacity-100 transition-opacity duration-1000 animate-pulse delay-700 pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="flex items-center gap-2 px-5 py-2 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-slate-300 uppercase">Legal Intelligence System</span>
          </div>

          {/* Title */}
          <h2 className="font-serif text-6xl md:text-8xl tracking-[0.1em] font-light text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] mb-6 leading-tight uppercase flex justify-center items-center gap-3">
            CASE{" "}
            <span className="font-serif italic font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 drop-shadow-[0_0_40px_rgba(34,211,238,0.5)]">
              CAST
            </span>
          </h2>

          <p className="text-slate-400 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl font-light">
            A highly advanced system that analyzes historical data and population trends to produce clear, useful insights
          </p>

          <button
            onClick={onStartPredicting}
            className="px-8 py-4 bg-white text-black font-display font-bold text-lg rounded-full hover:scale-105 hover:bg-slate-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] flex items-center gap-3"
          >
            Start Predicting <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Feature Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-4">
        {[
          {
            delay: 0,
            gradientColor: "rgba(34,211,238,1)",
            iconBg: "bg-cyan-950/80 border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)] group-hover:shadow-[0_0_30px_rgba(34,211,238,0.4)]",
            icon: <Scale className="w-7 h-7 text-cyan-400" />,
            title: "Conviction Probability",
            desc: <>Naturally predicts possible court decisions and how likely different verdicts are.<br />Heavily influenced by prior offense records and historical precedence matrices.</>,
          },
          {
            delay: 0.1,
            gradientColor: "rgba(99,102,241,1)",
            iconBg: "bg-indigo-950/80 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)] group-hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]",
            icon: <Activity className="w-7 h-7 text-indigo-400" />,
            title: "Charge Severity",
            desc: <>Classify active legal infractions completely automatically.<br />Easily identifies which offenses are bailable and which are non-bailable under the law.</>,
          },
          {
            delay: 0.2,
            gradientColor: "rgba(244,63,94,1)",
            iconBg: "bg-rose-950/80 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.2)] group-hover:shadow-[0_0_30px_rgba(244,63,94,0.4)]",
            icon: <ShieldAlert className="w-7 h-7 text-rose-400" />,
            title: "Recidivism Matrix",
            desc: <>Evaluate the likelihood and probability of future behavioral patterns.<br />Computed chronologically using complex demographic algorithms.</>,
          },
        ].map((card) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: card.delay }}
            className="group relative p-[1px] rounded-3xl overflow-hidden bg-white/5 hover:bg-white/10 transition-transform hover:-translate-y-1 hover:scale-[1.02] duration-300 cursor-default"
          >
            <div
              className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] opacity-0 group-hover:opacity-100 animate-[spin_3s_linear_infinite] transition-opacity duration-500"
              style={{ background: `conic-gradient(from 0deg, transparent 0 340deg, ${card.gradientColor} 360deg)` }}
            />
            <div className="relative h-full bg-black border border-transparent group-hover:border-white/5 backdrop-blur-3xl rounded-[23px] p-8 flex flex-col gap-5 transition-colors z-10 w-[calc(100%-2px)] m-[1px]">
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-all duration-300 ${card.iconBg}`}>
                {card.icon}
              </div>
              <h3 className="text-2xl font-display font-bold text-white tracking-wide">{card.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
