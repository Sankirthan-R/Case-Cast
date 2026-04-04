import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, BrainCircuit, Cpu, Database, History, Scale, ShieldAlert, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import OrbitalSpinner from "../../components/OrbitalSpinner";

// ── Animated Counter ──────────────────────────────────────────────────────────
function AnimatedCount({ value, duration = 1.5 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseFloat(value);
    if (isNaN(end)) return;
    const stepTime = Math.abs(Math.floor((duration * 1000) / 60));
    let current = start;
    const increment = end / 60;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) { setCount(end); clearInterval(timer); }
      else { setCount(current); }
    }, stepTime);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <>{count.toFixed(1)}</>;
}

// ── Circular Gauge ────────────────────────────────────────────────────────────
function CircularGauge({ label, value, color }) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" className="fill-transparent stroke-slate-800" strokeWidth="6" />
          <motion.circle
            cx="40" cy="40" r="36"
            className={`fill-transparent ${color}`}
            strokeWidth="6"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-display font-bold text-white text-lg">
          <AnimatedCount value={value} />%
        </div>
      </div>
      <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">{label}</span>
    </div>
  );
}

// ── PredictPage ───────────────────────────────────────────────────────────────
/**
 * PredictPage — Prediction form, loading state, results, and model info overlay.
 */
export default function PredictPage({
  castingInputs,
  updateCastingInput,
  handlePredict,
  isPredicting,
  formError,
  result,
  activeTab,
}) {
  const [showModelOverlay, setShowModelOverlay] = useState(false);
  const [expandedModelKey, setExpandedModelKey] = useState(null);

  useEffect(() => {
    if (showModelOverlay) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [showModelOverlay]);

  // Keyboard navigation inside form
  useEffect(() => {
    if (activeTab !== "casting") return;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const fc = document.getElementById("predictor-form-container");
        if (!fc) return;
        const focusable = Array.from(fc.querySelectorAll("input, select, button[type='submit']"));
        const index = focusable.indexOf(document.activeElement);
        if (index > -1) {
          const nextIndex = e.key === "ArrowRight" ? index + 1 : index - 1;
          if (nextIndex >= 0 && nextIndex < focusable.length) {
            focusable[nextIndex].focus();
            e.preventDefault();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab]);

  return (
    <>
      <motion.div
        key="predict"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex flex-col xl:flex-row gap-8 items-start relative"
      >
        {/* ── LEFT: Input Form ─────────────────────────────────────── */}
        <div className="w-full xl:w-5/12 flex flex-col gap-4 order-2 xl:order-1 h-auto relative z-10 mb-12">
          <div className="glass-card p-5 md:p-6 flex flex-col gap-5">
            <div className="flex justify-between items-center mb-1">
              <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" /> Prediction Inputs
              </h2>
            </div>

            <form id="predictor-form-container" onSubmit={handlePredict} className="flex flex-col gap-5">
              {/* Row 1 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] uppercase font-bold text-slate-400 tracking-wider">Age (18+)</span>
                  <input name="age" type="number" min="18" max="120" className="input-glass bg-slate-900/60 py-2 px-3 text-sm" placeholder="e.g. 35" value={castingInputs.age} onChange={e => updateCastingInput("age", e.target.value)} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] uppercase font-bold text-slate-400 tracking-wider">Sex</span>
                  <select name="sex" className="input-glass bg-slate-900/60 py-2 px-2 text-sm" value={castingInputs.sex} onChange={e => updateCastingInput("sex", e.target.value)}>
                    <option value="">Sel</option>
                    <option value="M">M</option>
                    <option value="F">F</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] uppercase font-bold text-slate-400 tracking-wider">Priors</span>
                  <input name="priorOffenses" type="number" min="0" className="input-glass bg-slate-900/60 py-2 px-3 text-sm" placeholder="0" value={castingInputs.priorOffenses} onChange={e => updateCastingInput("priorOffenses", e.target.value)} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] uppercase font-bold text-slate-400 tracking-wider">Jail Days</span>
                  <input name="jailDurationDays" type="number" min="0" className="input-glass bg-slate-900/60 py-2 px-3 text-sm" placeholder="0" value={castingInputs.jailDurationDays} onChange={e => updateCastingInput("jailDurationDays", e.target.value)} />
                </label>
              </div>

              {/* Juvenile History */}
              <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                <span className="text-[17px] uppercase font-bold text-indigo-400 tracking-widest leading-none">Juvenile History Counts</span>
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[13px] uppercase font-semibold text-slate-400 tracking-wider">Felony</span>
                    <input name="juvenileFelonyCount" type="number" min="0" className="input-glass py-2 px-3 border-indigo-500/20 bg-indigo-950/20 focus:border-indigo-400 text-sm" placeholder="0" value={castingInputs.juvenileFelonyCount} onChange={e => updateCastingInput("juvenileFelonyCount", e.target.value)} />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[13px] uppercase font-semibold text-slate-400 tracking-wider">Misdemean</span>
                    <input name="juvenileMisdemeanorCount" type="number" min="0" className="input-glass py-2 px-3 border-indigo-500/20 bg-indigo-950/20 focus:border-indigo-400 text-sm" placeholder="0" value={castingInputs.juvenileMisdemeanorCount} onChange={e => updateCastingInput("juvenileMisdemeanorCount", e.target.value)} />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[13px] uppercase font-semibold text-slate-400 tracking-wider">Other</span>
                    <input name="juvenileOtherCount" type="number" min="0" className="input-glass py-2 px-3 border-indigo-500/20 bg-indigo-950/20 focus:border-indigo-400 text-sm" placeholder="0" value={castingInputs.juvenileOtherCount} onChange={e => updateCastingInput("juvenileOtherCount", e.target.value)} />
                  </label>
                </div>
              </div>

              {/* Timeline */}
              <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                <span className="text-[17px] uppercase font-bold text-slate-300 tracking-widest leading-none">Timeline Constraints (Days)</span>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[13px] uppercase font-semibold text-slate-400 tracking-wider">Arrest to Screen</span>
                    <input name="daysBetweenArrestAndScreening" type="number" className="input-glass bg-slate-900/60 py-2 px-3 text-sm" placeholder="e.g. -20" value={castingInputs.daysBetweenArrestAndScreening} onChange={e => updateCastingInput("daysBetweenArrestAndScreening", e.target.value)} />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[13px] uppercase font-semibold text-slate-400 tracking-wider">Offense to Screen</span>
                    <input name="daysFromOffenseToScreen" type="number" min="0" className="input-glass bg-slate-900/60 py-2 px-3 text-sm" placeholder="e.g. 22" value={castingInputs.daysFromOffenseToScreen} onChange={e => updateCastingInput("daysFromOffenseToScreen", e.target.value)} />
                  </label>
                </div>
              </div>

              {formError && (
                <div className="px-3 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs mt-1 font-medium shadow-inner">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={isPredicting}
                className="btn-primary w-full py-3.5 text-base border border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] font-bold uppercase tracking-widest mt-1"
              >
                {isPredicting ? "Initializing..." : "Execute Prediction"}
              </button>
            </form>
          </div>
        </div>

        {/* ── RIGHT: Results Panel ─────────────────────────────────── */}
        <div className="w-full xl:w-7/12 flex flex-col order-1 xl:order-2 self-stretch min-h-[600px] justify-center relative mt-6 xl:mt-0 pb-12">
          {/* Empty state */}
          {!result && !isPredicting && (
            <div className="text-center text-slate-500 flex flex-col items-center p-12 glass-card rounded-3xl h-full justify-center">
              <Database className="w-24 h-24 mb-6 text-slate-800 animate-pulse" />
              <p className="text-2xl font-display font-medium text-slate-400">Awaiting Input Parameters</p>
              <p className="text-sm mt-2 max-w-md">Configure the legal feature matrix on the left panel to execute the advanced prediction engine.</p>
            </div>
          )}

          {/* Loading */}
          {isPredicting && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center glass-panel rounded-3xl border-cyan-500/30 bg-black/85 backdrop-blur-3xl overflow-hidden"
            >
              <OrbitalSpinner />
              <h3 className="text-xl md:text-2xl font-display font-bold text-white mb-3 tracking-wide uppercase text-center max-w-sm">
                Computing the outcome
              </h3>
              <p className="text-slate-400 text-sm text-center max-w-xs">Calculating conviction probability, charge severity and recidivism risk…</p>
            </motion.div>
          )}

          {/* Results */}
          {result && !isPredicting && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-6 h-full">
              <div className="flex justify-between items-center px-2">
                <span className="text-slate-400 text-sm font-mono flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" /> Inference Complete
                </span>
                <button
                  onClick={() => setShowModelOverlay(true)}
                  className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Model Info
                </button>
              </div>

              {/* Summary Banner */}
              <div className={`p-10 rounded-3xl border shadow-2xl relative overflow-hidden backdrop-blur-xl ${
                result.summary.outcome.includes("High") ? "bg-rose-950/20 border-rose-500/50 shadow-rose-500/20" :
                result.summary.outcome.includes("Moderate") ? "bg-amber-950/20 border-amber-500/50 shadow-amber-500/20" :
                "bg-emerald-950/20 border-emerald-500/50 shadow-emerald-500/20"
              }`}>
                <div className="absolute -right-10 -top-10 opacity-10">
                  {result.summary.outcome.includes("High") ? <ShieldAlert className="w-64 h-64 text-rose-500" /> : <Scale className="w-64 h-64 text-emerald-500" />}
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <p className="text-xs uppercase tracking-widest font-semibold opacity-70 mb-2">Aggregate Risk Assessment</p>
                    <h2 className="text-5xl font-display font-bold text-white tracking-tight leading-tight">{result.summary.outcome}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-5xl font-mono font-bold text-white mb-1">{result.summary.confidence}%</p>
                    <p className="text-xs uppercase tracking-widest opacity-60">Confidence Level</p>
                  </div>
                </div>
              </div>

              {/* Detail Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                <div className="glass-card p-6 border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-900/10 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-slate-200">Conviction Prediction</h3>
                    <Scale className="w-5 h-5 text-cyan-400" />
                  </div>
                  <p className="text-2xl font-display font-bold text-white mb-4">{result.conviction.prediction}</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm"><span className="text-slate-400">Convicted</span><span className="text-cyan-400">{result.conviction.pConvicted}%</span></div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/5"><div className="bg-cyan-500 h-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" style={{ width: `${result.conviction.pConvicted}%` }} /></div>
                    <div className="flex justify-between text-sm mt-2"><span className="text-slate-400">Not Convicted</span><span className="text-cyan-400">{result.conviction.pNotConvicted}%</span></div>
                  </div>
                </div>

                <div className="glass-card p-6 border-indigo-500/20 hover:border-indigo-500/40 hover:bg-indigo-900/10 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-slate-200">Charge Severity</h3>
                    <AlertCircle className="w-5 h-5 text-indigo-400" />
                  </div>
                  <p className="text-2xl font-display font-bold text-white mb-4">{result.chargeSeverity.prediction}</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm"><span className="text-slate-400">Non-Bailable</span><span className="text-indigo-400">{result.chargeSeverity.pNonBailable}%</span></div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/5"><div className="bg-indigo-500 h-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" style={{ width: `${result.chargeSeverity.pNonBailable}%` }} /></div>
                  </div>
                </div>

                <div className="glass-card p-6 border-rose-500/20 hover:border-rose-500/40 hover:bg-rose-900/10 transition-all md:col-span-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldAlert className="w-24 h-24 text-rose-500" /></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <h3 className="font-semibold text-slate-200">Recidivism (2-Year Risk)</h3>
                  </div>
                  <p className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500 mb-6 relative z-10">{result.recidivism.prediction}</p>
                  <div className="flex flex-col gap-2 relative z-10">
                    <div className="flex justify-between text-sm"><span className="text-slate-400 font-semibold uppercase tracking-wider">Risk Probability</span><span className="text-rose-400 font-bold">{result.recidivism.pWillReoffend}%</span></div>
                    <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-white/5"><div className="bg-gradient-to-r from-orange-400 to-rose-600 h-full shadow-[0_0_15px_rgba(244,63,94,0.8)]" style={{ width: `${result.recidivism.pWillReoffend}%` }} /></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Model Info Overlay ───────────────────────────────────────── */}
      <AnimatePresence>
        {showModelOverlay && result?.modelInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl overflow-y-auto overflow-x-hidden px-4 py-12 md:py-24 flex justify-center custom-scrollbar"
          >
            <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-0">
              <Scale className="absolute top-[10%] left-[5%] w-96 h-96 text-indigo-500/5 rotate-[-15deg] blur-[2px] animate-pulse" />
              <History className="absolute bottom-[20%] right-[5%] w-80 h-80 text-cyan-500/5 rotate-[15deg] blur-[2px] animate-pulse" />
            </div>

            <motion.div
              initial={{ scale: 0.85, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="w-full max-w-4xl bg-black border border-white/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-[0_0_80px_rgba(255,255,255,0.03)] h-fit my-auto z-10"
            >
              <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none" />
              <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
              <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

              <button
                onClick={() => setShowModelOverlay(false)}
                className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all hover:scale-110 shadow-lg border border-white/5 z-20"
              >
                ✕
              </button>

              <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-8 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                  <BrainCircuit className="w-8 h-8 text-black" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">Model Telemetry</h2>
                  <p className="text-slate-400 mt-1 font-medium">Deep analysis of court intelligence algorithms.</p>
                </div>
              </div>

              <div className="space-y-8 relative z-10">
                {Object.entries(result.modelInfo.bestSummary).map(([key, details], index) => {
                  const titles = { conviction: "Conviction Predictor", chargeSeverity: "Severity Classification", recidivism: "Recidivism Risk Matrix" };
                  const colors = { conviction: "stroke-cyan-400", chargeSeverity: "stroke-indigo-400", recidivism: "stroke-rose-400" };
                  const dotColors = { conviction: "bg-cyan-400 shadow-cyan-400/50", chargeSeverity: "bg-indigo-400 shadow-indigo-400/50", recidivism: "bg-rose-400 shadow-rose-400/50" };
                  const textColors = { conviction: "text-cyan-400", chargeSeverity: "text-indigo-400", recidivism: "text-rose-400" };
                  const isExpanded = expandedModelKey === key;

                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.15 + 0.1, type: "spring", stiffness: 200 }}
                      className="glass-panel p-6 rounded-3xl bg-black border border-white/10 shadow-2xl hover:border-white/20 transition-all group"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${dotColors[key]} group-hover:scale-150 transition-transform shadow-[0_0_10px_rgba(255,255,255,0.5)]`} />
                          <h3 className="text-xl font-display font-bold text-white tracking-wide">{titles[key]}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono tracking-widest uppercase text-slate-300 shadow-inner">{details.model}</span>
                          <button
                            onClick={(e) => { e.preventDefault(); setExpandedModelKey(isExpanded ? null : key); }}
                            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-[10px] font-bold tracking-widest uppercase text-white transition-colors flex items-center gap-2"
                          >
                            {isExpanded ? "Close Info" : "More Info"}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap md:flex-nowrap justify-around gap-6 py-4">
                        <CircularGauge label="CV Accuracy" value={details.cvAccuracy} color={colors[key]} />
                        <CircularGauge label="CV F1 Score" value={details.cvF1} color={colors[key]} />
                      </div>

                      {isExpanded && (
                        <div className="overflow-hidden">
                          <div className="pt-6 mt-4 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4">
                            {["accuracy", "f1", "precision", "recall"].map((metric) => (
                              <div key={metric} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center">
                                <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-1">{metric}</span>
                                <span className={`text-2xl font-mono font-bold ${textColors[key]}`}><AnimatedCount value={details[metric]} />%</span>
                              </div>
                            ))}
                          </div>
                          {(key === "conviction" || key === "chargeSeverity") && result.modelInfo.decileRegressor && (
                            <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="text-xs text-slate-400 font-semibold mb-1">Auxiliary Decile Regressor</span>
                                <span className="text-sm text-slate-200">{result.modelInfo.decileRegressor.name}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase block mb-1">Mean Abs Error</span>
                                <span className="text-xl font-mono font-bold text-slate-300">{result.modelInfo.decileRegressor.mae}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
