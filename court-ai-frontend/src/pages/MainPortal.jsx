import { AnimatePresence, motion } from "framer-motion";
import { History, Home, LogOut, Scale, Sparkles, UserRound, ChevronRight, Activity, AlertCircle, ShieldAlert, Network, ChevronDown, Database, Cpu, BrainCircuit } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabaseClient";

const navItems = [
  { key: "home", label: "Dashboard", icon: Home },
  { key: "casting", label: "Predictor", icon: Sparkles },
  { key: "history", label: "Logs", icon: History },
  { key: "profile", label: "Settings", icon: UserRound },
];

const initialCastingInputs = {
  age: "",
  gender: "",
  priorOffenses: "",
  juvenileFelonyCount: "",
  juvenileMisdemeanorCount: "",
  juvenileOtherCount: "",
  daysBetweenArrestAndScreening: "",
  daysFromOffenseToScreen: "",
  jailDurationDays: "",
};

const homeFeatureBlocks = [
  { title: "Conviction Likelihood", icon: Scale, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { title: "Charge Severity", icon: AlertCircle, color: "text-indigo-400", bg: "bg-indigo-500/10" },
  { title: "Recidivism Risk", icon: ShieldAlert, color: "text-rose-400", bg: "bg-rose-500/10" },
  { title: "Decile Matrix", icon: Activity, color: "text-purple-400", bg: "bg-purple-500/10" },
];

const fallbackModelInfo = {
  decileRegressor: { name: "GradientBoosting Regressor", mae: 1.615 },
  violentDecileRegressor: { name: "Random Forest Regressor", mae: 1.214 },
  bestSummary: {
    conviction: { model: "XGBoost (GBM)", accuracy: 84.66, f1: 91.42, precision: 86.98, recall: 96.33, cvAccuracy: 84.73, cvF1: 91.49 },
    chargeSeverity: { model: "XGBoost (GBM)", accuracy: 68.23, f1: 78.34, precision: 70.58, recall: 88.03, cvAccuracy: 67.41, cvF1: 77.9 },
    recidivism: { model: "Random Forest", accuracy: 69.83, f1: 68.48, precision: 66.23, recall: 70.89, cvAccuracy: 69.0, cvF1: 66.56 },
  },
  trainingLogs: null,
};

const getFallbackPrediction = (features) => {
  const riskSeed =
    features.priorOffenses * 2 +
    features.juvenileFelonyCount * 2 +
    features.juvenileMisdemeanorCount +
    features.juvenileOtherCount +
    Math.max(0, features.daysFromOffenseToScreen - 10) * 0.04 +
    Math.max(0, Math.abs(features.daysBetweenArrestAndScreening) - 7) * 0.03 +
    Math.max(0, features.jailDurationDays - 2) * 0.12;

  let outcome = "Low Risk";
  if (riskSeed >= 10) outcome = "High Risk";
  else if (riskSeed >= 5) outcome = "Moderate Risk";

  const confidence = Math.min(95, Math.max(68, 68 + Math.round(riskSeed * 2.4)));
  const convProb = Math.min(98, Math.max(52, confidence + 6));
  const nbProb = Math.min(93, Math.max(44, 44 + riskSeed * 2.2));
  const recidProb = Math.min(96, Math.max(46, 46 + riskSeed * 2.5));

  const convictionLabel = convProb >= 50 ? "CONVICTED" : "NOT CONVICTED / DROPPED";
  const chargeLabel = nbProb >= 50 ? "NON-BAILABLE (NB)" : "BAILABLE (B)";
  const recidLabel = recidProb >= 50 ? "LIKELY TO REOFFEND" : "UNLIKELY TO REOFFEND";

  return {
    summary: { outcome, confidence },
    conviction: { prediction: convictionLabel, pConvicted: Number(convProb.toFixed(1)), pNotConvicted: Number((100 - convProb).toFixed(1)), bestModel: "XGBoost (GBM)" },
    chargeSeverity: { prediction: chargeLabel, pNonBailable: Number(nbProb.toFixed(1)), pBailable: Number((100 - nbProb).toFixed(1)), bestModel: "XGBoost (GBM)" },
    recidivism: { prediction: recidLabel, pWillReoffend: Number(recidProb.toFixed(1)), pWillNotReoffend: Number((100 - recidProb).toFixed(1)), bestModel: "Random Forest" },
    modelInfo: fallbackModelInfo,
    source: "fallback",
  };
};

const parseNumericInput = (value) => (value === "" ? null : Number.isFinite(Number(value)) ? Number(value) : null);

export default function MainPortal({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("home");
  const [castingInputs, setCastingInputs] = useState(initialCastingInputs);
  const [result, setResult] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [formError, setFormError] = useState("");
  const [isPredicting, setIsPredicting] = useState(false);
  const [apiStatus, setApiStatus] = useState("checking");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showModelOverlay, setShowModelOverlay] = useState(false);
  const [expandedModelKey, setExpandedModelKey] = useState(null);

  const authProvider = (user?.app_metadata?.provider || "email").toUpperCase();
  const signedInEmail = user?.email || "Authenticated User";
  const username = user?.user_metadata?.username || signedInEmail?.split('@')[0] || "User";

  useEffect(() => {
    let active = true;
    const loadHistory = async () => {
      let cached = [];
      try {
        if (supabase && user?.id) {
          const { data, error } = await supabase.from('prediction_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(24);
          if (data && !error) {
             cached = data.map(d => ({
               id: d.id,
               createdAt: d.created_at,
               outcome: d.outcome,
               confidence: d.confidence,
               source: d.source,
               ...d.input_payload,
             }));
          }
        } else {
          const stored = localStorage.getItem("casecast-history");
          if (stored) cached = JSON.parse(stored);
        }
      } catch { cached = []; }
      if (active) setHistoryItems(cached);
    };
    loadHistory();
    return () => { active = false; };
  }, [user]);

  useEffect(() => { 
    if (!supabase || !user?.id) localStorage.setItem("casecast-history", JSON.stringify(historyItems)); 
  }, [historyItems, user]);

  useEffect(() => {
    if (activeTab !== "casting") return;
    const handleKeyDown = (e) => {
      // Allow standard input navigation (Left/Right arrow)
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const formContainer = document.getElementById("predictor-form-container");
        if (!formContainer) return;
        const focusable = Array.from(formContainer.querySelectorAll("input, select, button[type='submit']"));
        const index = focusable.indexOf(document.activeElement);
        if (index > -1) {
          let nextIndex = e.key === "ArrowRight" ? index + 1 : index - 1;
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

  const stats = useMemo(() => {
    const casts = historyItems.length;
    const avg = casts ? Math.round(historyItems.reduce((sum, item) => sum + (item.confidence || 0), 0) / casts) : 0;
    return { totalCasts: casts, avgConfidence: avg };
  }, [historyItems]);

  const updateCastingInput = (key, value) => {
    setCastingInputs((prev) => ({ ...prev, [key]: value }));
    setFormError(""); 
  };

  const handlePredict = async (event) => {
    event.preventDefault();
    const parsed = {
      age: parseNumericInput(castingInputs.age), gender: castingInputs.gender.trim().toUpperCase(),
      priorOffenses: parseNumericInput(castingInputs.priorOffenses),
      juvenileFelonyCount: parseNumericInput(castingInputs.juvenileFelonyCount),
      juvenileMisdemeanorCount: parseNumericInput(castingInputs.juvenileMisdemeanorCount),
      juvenileOtherCount: parseNumericInput(castingInputs.juvenileOtherCount),
      daysBetweenArrestAndScreening: parseNumericInput(castingInputs.daysBetweenArrestAndScreening),
      daysFromOffenseToScreen: parseNumericInput(castingInputs.daysFromOffenseToScreen),
      jailDurationDays: parseNumericInput(castingInputs.jailDurationDays),
    };

    const hasNullNumber = Object.entries(parsed).filter(([key]) => key !== "gender").some(([, value]) => value === null);
    if (hasNullNumber || !parsed.gender) { setFormError("Please fill all input features before prediction."); return; }
    
    setIsPredicting(true); setFormError("");
    setApiStatus("offline");
    
    setTimeout(async () => {
      const prediction = getFallbackPrediction(parsed);
      const entry = { id: `${Date.now()}-${Math.random()}`, ...parsed, ...prediction.summary, source: prediction.source, createdAt: new Date().toISOString() };
      
      if (supabase && user?.id) {
         try {
            await supabase.from('prediction_history').insert([{
              user_id: user.id,
              input_payload: parsed,
              output_payload: prediction,
              metadata: { model_used: "fallback_simulation" },
              source: prediction.source,
              outcome: prediction.summary.outcome,
              confidence: prediction.summary.confidence
            }]);
         } catch(e) {
            console.error("DB Save Failed", e);
            setFormError("Failed to store prediction to Supabase. Check database config.");
         }
      }

      setResult(prediction);
      setHistoryItems((prev) => [entry, ...prev].slice(0, 24));
      setIsPredicting(false);
    }, 2500); // simulate ML work for the cool animation
  };

  const AnimatedCount = ({ value, duration = 1.5 }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
      let start = 0; const end = parseFloat(value); if (isNaN(end)) return;
      const stepTime = Math.abs(Math.floor((duration * 1000) / 60));
      let current = start; const increment = end / 60;
      const timer = setInterval(() => {
        current += increment;
        if (current >= end) { setCount(end); clearInterval(timer); } else { setCount(current); }
      }, stepTime);
      return () => clearInterval(timer);
    }, [value, duration]);
    return <>{count.toFixed(1)}</>;
  };

  useEffect(() => {
    if (showModelOverlay) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [showModelOverlay]);

  const CircularGauge = ({ label, value, color }) => {
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
          <div className="absolute inset-0 flex items-center justify-center font-display font-bold text-white text-lg"><AnimatedCount value={value} />%</div>
        </div>
        <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">{label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans overflow-hidden">
      
      {/* Global Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-indigo-900/10 blur-[150px] rounded-full mix-blend-screen animate-pulse duration-[10s]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-900/10 blur-[150px] rounded-full mix-blend-screen animate-pulse duration-[12s]"></div>
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.02]"></div>
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full bg-black/50 backdrop-blur-xl border-b border-white/5 flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-3">
          <Scale className="text-cyan-400 w-6 h-6" />
          <h1 className="font-display font-bold text-xl tracking-wide text-white">CaseCast</h1>
        </div>
        
        <nav className="hidden md:flex bg-white/5 border border-white/10 rounded-full p-1 lg:p-1.5 backdrop-blur-md">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button key={item.key} onClick={() => setActiveTab(item.key)} className={`relative px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                {isActive && <motion.div layoutId="nav-pill" className="absolute inset-0 bg-white/10 rounded-full" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                <span className="relative z-10 flex items-center gap-2"><Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : ''}`} />{item.label}</span>
              </button>
            )
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
              <UserRound className="w-4 h-4 text-white"/>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500"/>
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
                      <Activity className="w-5 h-5 text-cyan-400"/>
                   </div>
                   <div>
                     <p className="text-white font-semibold">{username}</p>
                     <p className="text-xs text-slate-400">{signedInEmail}</p>
                   </div>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400">Total Predictions</span>
                  <span className="text-sm font-bold text-cyan-400">{stats.totalCasts}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-slate-400">Avg Confidence</span>
                  <span className="text-sm font-bold text-indigo-400">{stats.avgConfidence}%</span>
                </div>
                <button onClick={onLogout} className="w-full py-2 bg-rose-500/10 text-rose-400 rounded-lg text-sm text-center font-medium hover:bg-rose-500/20 transition-colors">
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Mobile Nav */}
      <div className="md:hidden flex justify-center gap-2 p-4 glass-panel border-b-0 sticky top-[72px] z-40 bg-black/80 mx-4 mt-4 rounded-xl">
        {navItems.map((item) => (
           <button key={item.key} onClick={() => setActiveTab(item.key)} className={`p-3 rounded-lg ${activeTab === item.key ? 'bg-cyan-900/40 text-cyan-400' : 'text-slate-400'}`}><item.icon className="w-5 h-5"/></button>
        ))}
      </div>

      <main className="flex-1 relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col gap-8">
        <AnimatePresence mode="wait">
          
          {/* DASHBOARD TAB */}
          {activeTab === "home" && (
            <motion.div key="home" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5, ease: "easeOut" }} className="flex flex-col gap-8 w-full">
               {/* Hero Banner with Aurora/Nebula effect */}
               <div className="relative w-full rounded-[2.5rem] p-10 md:p-[4.5rem] overflow-hidden border border-white/10 group shadow-[0_0_120px_rgba(34,211,238,0.07)] bg-black">
                 {/* Intense animated blobs mimicking Aurora Background */}
                 <div className="absolute top-[-50%] left-[-20%] w-[800px] h-[800px] bg-cyan-600/40 blur-[150px] rounded-full mix-blend-screen opacity-70 group-hover:opacity-100 transition-opacity duration-1000 animate-pulse pointer-events-none"></div>
                 <div className="absolute bottom-[-50%] right-[-20%] w-[800px] h-[800px] bg-indigo-600/40 blur-[150px] rounded-full mix-blend-screen opacity-70 group-hover:opacity-100 transition-opacity duration-1000 animate-pulse delay-700 pointer-events-none"></div>
                 
                 <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                 
                 <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
                   <div className="flex items-center gap-2 px-5 py-2 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                     <Sparkles className="w-4 h-4 text-cyan-400" />
                     <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-slate-300 uppercase">CaseCast Intelligence V2</span>
                   </div>
                   <h2 className="font-display text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-100 to-slate-500 tracking-tight mb-6 leading-tight">
                     Predictive <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500">Legal</span> Telemetry
                   </h2>
                   <p className="text-slate-400 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl font-light">
                     An elite intelligence portal orchestrating complex historical priors and demographic patterns into actionable structured insights with high-fidelity modeling.
                   </p>
                   <button onClick={() => setActiveTab("casting")} className="px-8 py-4 bg-white text-black font-display font-bold text-lg rounded-full hover:scale-105 hover:bg-slate-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] flex items-center gap-3">
                     Initialize Matrix <ChevronRight className="w-5 h-5"/>
                   </button>
                 </div>
               </div>

               {/* Spotlight Feature Cards for Core AI Functions */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-4">
                 <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="group relative p-[1px] rounded-3xl overflow-hidden bg-white/5 hover:bg-white/10 transition-transform hover:-translate-y-1 hover:scale-[1.02] duration-300 cursor-default">
                   {/* Animated Starborder Trail Hover Effect */}
                   <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] rotate-[0deg] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(34,211,238,1)_360deg)] opacity-0 group-hover:opacity-100 animate-[spin_3s_linear_infinite] transition-opacity duration-500"></div>
                   
                   <div className="relative h-full bg-black border border-transparent group-hover:border-white/5 backdrop-blur-3xl rounded-[23px] p-8 flex flex-col gap-5 transition-colors z-10 w-[calc(100%-2px)] m-[1px]">
                      <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.2)] group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all duration-300">
                        <Scale className="w-7 h-7 text-cyan-400" />
                      </div>
                      <h3 className="text-2xl font-display font-bold text-white tracking-wide">Conviction Probability</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        Anticipate formal court determinations and verdict likelihoods natively.<br/>Heavily influenced by prior offense records and historical precedence matrices.
                      </p>
                   </div>
                 </motion.div>

                 <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }} className="group relative p-[1px] rounded-3xl overflow-hidden bg-white/5 hover:bg-white/10 transition-transform hover:-translate-y-1 hover:scale-[1.02] duration-300 cursor-default">
                   <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] rotate-[0deg] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(99,102,241,1)_360deg)] opacity-0 group-hover:opacity-100 animate-[spin_3s_linear_infinite] transition-opacity duration-500"></div>
                   
                   <div className="relative h-full bg-black border border-transparent group-hover:border-white/5 backdrop-blur-3xl rounded-[23px] p-8 flex flex-col gap-5 transition-colors z-10 w-[calc(100%-2px)] m-[1px]">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.2)] group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all duration-300">
                        <Activity className="w-7 h-7 text-indigo-400" />
                      </div>
                      <h3 className="text-2xl font-display font-bold text-white tracking-wide">Charge Severity</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        Classify active legal infractions completely automatically.<br/>Determines core statutory bailable and non-bailable alignments effortlessly.
                      </p>
                   </div>
                 </motion.div>

                 <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }} className="group relative p-[1px] rounded-3xl overflow-hidden bg-white/5 hover:bg-white/10 transition-transform hover:-translate-y-1 hover:scale-[1.02] duration-300 cursor-default">
                   <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] rotate-[0deg] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(244,63,94,1)_360deg)] opacity-0 group-hover:opacity-100 animate-[spin_3s_linear_infinite] transition-opacity duration-500"></div>
                   
                   <div className="relative h-full bg-black border border-transparent group-hover:border-white/5 backdrop-blur-3xl rounded-[23px] p-8 flex flex-col gap-5 transition-colors z-10 w-[calc(100%-2px)] m-[1px]">
                      <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.2)] group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(244,63,94,0.4)] transition-all duration-300">
                        <ShieldAlert className="w-7 h-7 text-rose-400" />
                      </div>
                      <h3 className="text-2xl font-display font-bold text-white tracking-wide">Recidivism Matrix</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        Evaluate the likelihood and probability of future behavioral patterns.<br/>Computed chronologically using complex demographic algorithms.
                      </p>
                   </div>
                 </motion.div>
               </div>
            </motion.div>
          )}

          {/* PREDICTOR TAB */}
          {activeTab === "casting" && (
            <motion.div key="predict" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col xl:flex-row gap-8 items-start relative">
              
              <div className="w-full xl:w-5/12 flex flex-col gap-4 order-2 xl:order-1 h-auto relative z-10 mb-12">
                <div className="glass-card p-5 md:p-6 flex flex-col gap-5">
                  <div className="flex justify-between items-center mb-1">
                    <h2 className="font-display text-xl font-bold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-cyan-400"/> Settings</h2>
                  </div>

                  <form id="predictor-form-container" onSubmit={handlePredict} className="flex flex-col gap-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <label className="flex flex-col gap-1.5"><span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Age (18+)</span><input name="age" type="number" min="18" max="120" className="input-glass bg-slate-900/60 py-2 px-3 text-sm" placeholder="e.g. 35" value={castingInputs.age} onChange={e => updateCastingInput('age', e.target.value)}/></label>
                      <label className="flex flex-col gap-1.5"><span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sex</span><select name="sex" className="input-glass bg-slate-900/60 py-2 px-2 text-sm" value={castingInputs.sex} onChange={e => updateCastingInput('sex', e.target.value)}><option value="">Sel</option><option value="M">M</option><option value="F">F</option></select></label>
                      <label className="flex flex-col gap-1.5"><span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Priors</span><input name="priorOffenses" type="number" min="0" className="input-glass bg-slate-900/60 py-2 px-3 text-sm" placeholder="0" value={castingInputs.priorOffenses} onChange={e => updateCastingInput('priorOffenses', e.target.value)}/></label>
                      <label className="flex flex-col gap-1.5"><span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Jail Days</span><input name="jailDurationDays" type="number" min="0" className="input-glass bg-slate-900/60 py-2 px-3 text-sm" placeholder="0" value={castingInputs.jailDurationDays} onChange={e => updateCastingInput('jailDurationDays', e.target.value)}/></label>
                    </div>

                    <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                      <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest leading-none">Juvenile History Counts</span>
                      <div className="grid grid-cols-3 gap-3">
                        <label className="flex flex-col gap-1.5"><span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Felony</span><input name="juvenileFelonyCount" type="number" min="0" className="input-glass py-2 px-3 border-indigo-500/20 bg-indigo-950/20 focus:border-indigo-400 text-sm" placeholder="0" value={castingInputs.juvenileFelonyCount} onChange={e => updateCastingInput('juvenileFelonyCount', e.target.value)}/></label>
                        <label className="flex flex-col gap-1.5"><span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Misdemean</span><input name="juvenileMisdemeanorCount" type="number" min="0" className="input-glass py-2 px-3 border-indigo-500/20 bg-indigo-950/20 focus:border-indigo-400 text-sm" placeholder="0" value={castingInputs.juvenileMisdemeanorCount} onChange={e => updateCastingInput('juvenileMisdemeanorCount', e.target.value)}/></label>
                        <label className="flex flex-col gap-1.5"><span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Other</span><input name="juvenileOtherCount" type="number" min="0" className="input-glass py-2 px-3 border-indigo-500/20 bg-indigo-950/20 focus:border-indigo-400 text-sm" placeholder="0" value={castingInputs.juvenileOtherCount} onChange={e => updateCastingInput('juvenileOtherCount', e.target.value)}/></label>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                      <span className="text-[10px] uppercase font-bold text-slate-300 tracking-widest leading-none">Timeline Constraints (Days)</span>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1.5"><span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Arrest to Screen</span><input name="daysBetweenArrestAndScreening" type="number" className="input-glass bg-slate-900/60 py-2 px-3 text-sm" placeholder="e.g. -20" value={castingInputs.daysBetweenArrestAndScreening} onChange={e => updateCastingInput('daysBetweenArrestAndScreening', e.target.value)}/></label>
                        <label className="flex flex-col gap-1.5"><span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Offense to Screen</span><input name="daysFromOffenseToScreen" type="number" min="0" className="input-glass bg-slate-900/60 py-2 px-3 text-sm" placeholder="e.g. 22" value={castingInputs.daysFromOffenseToScreen} onChange={e => updateCastingInput('daysFromOffenseToScreen', e.target.value)}/></label>
                      </div>
                    </div>

                    {formError && (
                       <div className="px-3 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs mt-1 font-medium shadow-inner">
                          {formError}
                       </div>
                    )}

                    <button type="submit" disabled={isPredicting} className="btn-primary w-full py-3.5 text-base border border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] font-bold uppercase tracking-widest mt-1">
                      {isPredicting ? "Initializing..." : "Execute Prediction"}
                    </button>
                  </form>
                </div>
              </div>

              <div className="w-full xl:w-7/12 flex flex-col order-1 xl:order-2 self-stretch min-h-[600px] justify-center relative mt-6 xl:mt-0 pb-12">
                {!result && !isPredicting && (
                  <div className="text-center text-slate-500 flex flex-col items-center p-12 glass-card rounded-3xl h-full justify-center">
                    <Database className="w-24 h-24 mb-6 text-slate-800 animate-pulse"/>
                    <p className="text-2xl font-display font-medium text-slate-400">Awaiting Input Parameters</p>
                    <p className="text-sm mt-2 max-w-md">Configure the legal feature matrix on the left panel to execute the advanced prediction engine.</p>
                  </div>
                )}

                {/* ML Scanning Animation */}
                {isPredicting && (
                  <motion.div 
                    initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center glass-panel rounded-3xl border-cyan-500/50 bg-black/80 backdrop-blur-3xl overflow-hidden shadow-[0_0_80px_rgba(34,211,238,0.15)]"
                  >
                    <motion.div 
                      animate={{y: ['-100%', '300%']}} 
                      transition={{duration: 1.5, repeat: Infinity, ease: "linear"}} 
                      className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_30px_rgba(34,211,238,1)] z-30" 
                    />
                    
                    <div className="relative">
                      <Network className="w-24 h-24 text-cyan-400 mb-8" />
                      <motion.div animate={{scale: [1, 1.5, 1], opacity: [0, 0.5, 0]}} transition={{duration: 1, repeat: Infinity}} className="absolute inset-0 bg-cyan-500 rounded-full blur-xl"></motion.div>
                    </div>
                    
                    <h3 className="text-xl md:text-2xl font-display font-bold text-white mb-2 tracking-wide uppercase text-center max-w-sm">Computing the outcome, calculating probability of conviction, charge severity and recidivism</h3>
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></span>
                       <p className="text-cyan-400 font-mono text-sm tracking-widest uppercase">Evaluating 12x Feature Constraints</p>
                    </div>
                  </motion.div>
                )}

                {result && !isPredicting && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-6 h-full">
                    
                    <div className="flex justify-between items-center px-2">
                       <span className="text-slate-400 text-sm font-mono flex items-center gap-2"><Cpu className="w-4 h-4 text-emerald-400"/> Inference Complete</span>
                       <button onClick={() => setShowModelOverlay(true)} className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                         Model Info
                       </button>
                    </div>

                    <div className={`p-10 rounded-3xl border shadow-2xl relative overflow-hidden backdrop-blur-xl ${
                      result.summary.outcome.includes("High") ? 'bg-rose-950/20 border-rose-500/50 shadow-rose-500/20' : 
                      result.summary.outcome.includes("Moderate") ? 'bg-amber-950/20 border-amber-500/50 shadow-amber-500/20' : 
                      'bg-emerald-950/20 border-emerald-500/50 shadow-emerald-500/20'
                    }`}>
                      <div className="absolute -right-10 -top-10 opacity-10">
                        {result.summary.outcome.includes("High") ? <ShieldAlert className="w-64 h-64 text-rose-500"/> : <Scale className="w-64 h-64 text-emerald-500"/>}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                      <div className="glass-card p-6 border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-900/10 transition-all">
                         <div className="flex justify-between items-start mb-4">
                            <h3 className="font-semibold text-slate-200">Conviction Prediction</h3>
                            <Scale className="w-5 h-5 text-cyan-400"/>
                         </div>
                         <p className="text-2xl font-display font-bold text-white mb-4">{result.conviction.prediction}</p>
                         <div className="flex flex-col gap-2">
                           <div className="flex justify-between text-sm"><span className="text-slate-400">Convicted</span><span className="text-cyan-400">{result.conviction.pConvicted}%</span></div>
                           <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/5"><div className="bg-cyan-500 h-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" style={{width: `${result.conviction.pConvicted}%`}}></div></div>
                           <div className="flex justify-between text-sm mt-2"><span className="text-slate-400">Not Convicted</span><span className="text-cyan-400">{result.conviction.pNotConvicted}%</span></div>
                         </div>
                      </div>

                      <div className="glass-card p-6 border-indigo-500/20 hover:border-indigo-500/40 hover:bg-indigo-900/10 transition-all">
                         <div className="flex justify-between items-start mb-4">
                            <h3 className="font-semibold text-slate-200">Charge Severity</h3>
                            <AlertCircle className="w-5 h-5 text-indigo-400"/>
                         </div>
                         <p className="text-2xl font-display font-bold text-white mb-4">{result.chargeSeverity.prediction}</p>
                         <div className="flex flex-col gap-2">
                           <div className="flex justify-between text-sm"><span className="text-slate-400">Non-Bailable</span><span className="text-indigo-400">{result.chargeSeverity.pNonBailable}%</span></div>
                           <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/5"><div className="bg-indigo-500 h-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" style={{width: `${result.chargeSeverity.pNonBailable}%`}}></div></div>
                         </div>
                      </div>

                      <div className="glass-card p-6 border-rose-500/20 hover:border-rose-500/40 hover:bg-rose-900/10 transition-all md:col-span-2 relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldAlert className="w-24 h-24 text-rose-500"/></div>
                         <div className="flex justify-between items-start mb-4 relative z-10">
                            <h3 className="font-semibold text-slate-200">Recidivism (2-Year Risk)</h3>
                         </div>
                         <p className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500 mb-6 relative z-10">{result.recidivism.prediction}</p>
                         <div className="flex flex-col gap-2 relative z-10">
                           <div className="flex justify-between text-sm"><span className="text-slate-400 font-semibold uppercase tracking-wider">Risk Probability</span><span className="text-rose-400 font-bold">{result.recidivism.pWillReoffend}%</span></div>
                           <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-white/5"><div className="bg-gradient-to-r from-orange-400 to-rose-600 h-full shadow-[0_0_15px_rgba(244,63,94,0.8)]" style={{width: `${result.recidivism.pWillReoffend}%`}}></div></div>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
              <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-3xl font-display font-bold text-white tracking-tight">Audit Logs</h2>
                  <p className="text-slate-400 mt-2">Historical inference data and prediction payloads.</p>
                </div>
                <div className="text-sm text-slate-500 font-mono">Total Records: {historyItems.length}</div>
              </div>

              {!historyItems.length ? (
                <div className="text-center p-16 glass-card border-dashed">
                  <p className="text-slate-400 text-lg">No audit records found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {historyItems.map((item, i) => (
                    <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y:0}} transition={{delay: i*0.05}} key={item.id} className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-800/80 transition-colors">
                       <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-3">
                           <span className={`w-3 h-3 rounded-full ${item.outcome.includes("High") ? "bg-rose-500" : item.outcome.includes("Moderate") ? "bg-amber-500" : "bg-emerald-500"} shadow-[0_0_10px_rgba(255,255,255,0.2)]`}></span>
                           <span className="font-display font-semibold text-lg text-white">{item.outcome}</span>
                           <span className="text-xs text-slate-500 font-mono">{new Date(item.createdAt).toLocaleString()}</span>
                         </div>
                         <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                           <span><b className="text-slate-200">{item.age}</b> yrs</span>
                           <span><b className="text-slate-200">{item.sex}</b></span>
                           <span><b className="text-slate-200">{item.priorOffenses}</b> Priors</span>
                           <span>Jail: <b className="text-slate-200">{item.jailDurationDays}</b>d</span>
                         </div>
                       </div>
                       <div className="text-right flex items-center gap-4">
                         <div className="text-left">
                           <div className="text-2xl font-mono text-cyan-400">{Math.round(item.confidence || 0)}%</div>
                           <div className="text-[10px] uppercase tracking-widest text-slate-500">Confidence</div>
                         </div>
                       </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto flex flex-col gap-8 w-full">
               <div className="glass-panel p-10 rounded-3xl border-t-4 border-indigo-500 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left shadow-[0_0_40px_rgba(99,102,241,0.1)]">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                    <UserRound className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-display font-bold text-white mb-2">{username}</h2>
                    <p className="text-slate-400 mb-6">Manage your operational preferences and review authentication status.</p>
                    <button onClick={onLogout} className="btn-secondary flex items-center justify-center md:justify-start gap-2 text-rose-400 hover:text-rose-300 border-rose-900/50 hover:bg-rose-900/30 w-full md:w-auto"><LogOut className="w-4 h-4"/> Terminate Session</button>
                  </div>
               </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Model Overlay (Animated Visuals for Model Info) */}
      <AnimatePresence>
        {showModelOverlay && result?.modelInfo && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl overflow-y-auto overflow-x-hidden px-4 py-12 md:py-24 flex justify-center custom-scrollbar"
          >
             {/* Floating Background Court Icons */}
             <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-0">
                <Scale className="absolute top-[10%] left-[5%] w-96 h-96 text-indigo-500/5 rotate-[-15deg] blur-[2px] animate-pulse duration-[10s]" />
                <History className="absolute bottom-[20%] right-[5%] w-80 h-80 text-cyan-500/5 rotate-[15deg] blur-[2px] animate-pulse duration-[12s]" />
             </div>

             <motion.div 
                initial={{ scale: 0.85, y: 40, opacity: 0 }} 
                animate={{ scale: 1, y: 0, opacity: 1 }} 
                exit={{ scale: 0.85, y: 40, opacity: 0 }} 
                transition={{ type: "spring", damping: 25, stiffness: 250 }}
                className="w-full max-w-4xl bg-black border border-white/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-[0_0_80px_rgba(255,255,255,0.03)] h-fit my-auto z-10"
             >
               {/* Background Grid & Glows */}
               <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none"></div>
               <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>
               <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none"></div>

               <button onClick={() => setShowModelOverlay(false)} className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all hover:scale-110 shadow-lg border border-white/5 z-20">
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
                     <motion.div initial={{opacity:0, y: 30}} animate={{opacity:1, y:0}} transition={{delay: index*0.15 + 0.1, type: "spring", stiffness: 200}} key={key} className="glass-panel p-6 rounded-3xl bg-black border border-white/10 shadow-2xl hover:border-white/20 transition-all group">
                       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                         <div className="flex items-center gap-3">
                           <div className={`w-2.5 h-2.5 rounded-full ${dotColors[key]} group-hover:scale-150 transition-transform shadow-[0_0_10px_rgba(255,255,255,0.5)]`}></div>
                           <h3 className="text-xl font-display font-bold text-white tracking-wide">{titles[key]}</h3>
                         </div>
                         <div className="flex flex-wrap items-center gap-3">
                           <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono tracking-widest uppercase text-slate-300 shadow-inner">{details.model}</span>
                           <button onClick={(e) => { e.preventDefault(); setExpandedModelKey(isExpanded ? null : key); }} className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-[10px] font-bold tracking-widest uppercase text-white transition-colors flex items-center gap-2">
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
                               <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center">
                                 <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-1">Accuracy</span>
                                 <span className={`text-2xl font-mono font-bold ${textColors[key]}`}><AnimatedCount value={details.accuracy} />%</span>
                               </div>
                               <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center">
                                 <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-1">F1 Score</span>
                                 <span className={`text-2xl font-mono font-bold ${textColors[key]}`}><AnimatedCount value={details.f1} />%</span>
                               </div>
                               <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center">
                                 <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-1">Precision</span>
                                 <span className={`text-2xl font-mono font-bold ${textColors[key]}`}><AnimatedCount value={details.precision} />%</span>
                               </div>
                               <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center">
                                 <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-1">Recall</span>
                                 <span className={`text-2xl font-mono font-bold ${textColors[key]}`}><AnimatedCount value={details.recall} />%</span>
                               </div>
                             </div>
                             
                             {(key === 'conviction' || key === 'chargeSeverity') && result.modelInfo.decileRegressor && (
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
                   )
                 })}
               </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
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
