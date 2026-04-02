import { AnimatePresence, motion } from "framer-motion";
import {
  History,
  Home,
  Scale,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ClickSpark from "../components/ClickSpark";
import ScrollFloat from "../components/ScrollFloat/ScrollFloat";
import StarBorder from "../components/StarBorder";

const navItems = [
  { key: "home", label: "HOME", icon: Home },
  { key: "casting", label: "Casting", icon: Sparkles },
  { key: "history", label: "History", icon: History },
  { key: "profile", label: "Profile", icon: UserRound },
];

const initialCastingInputs = {
  age: "",
  sex: "",
  priorOffenses: "",
  juvenileFelonyCount: "",
  juvenileMisdemeanorCount: "",
  juvenileOtherCount: "",
  daysBetweenArrestAndScreening: "",
  daysFromOffenseToScreen: "",
  jailDurationDays: "",
};

const homeFeatureBlocks = [
  {
    title: "Conviction Likelihood",
    icon: Scale,
    toneClass: "is-conviction",
  },
  {
    title: "Charge Severity",
    icon: Sparkles,
    toneClass: "is-severity",
  },
  {
    title: "Recidivism Risk",
    icon: History,
    toneClass: "is-recidivism",
  },
  {
    title: "Predicted Decile Score",
    icon: UserRound,
    toneClass: "is-decile",
  },
];

const predictedClasses = ["Low Risk", "Moderate Risk", "High Risk"];

const normalizeConfidence = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return value <= 1 ? Math.round(value * 100) : Math.round(value);
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
  if (riskSeed >= 10) {
    outcome = "High Risk";
  } else if (riskSeed >= 5) {
    outcome = "Moderate Risk";
  }

  return {
    outcome,
    confidence: Math.min(95, Math.max(68, 68 + Math.round(riskSeed * 2.4))),
    source: "fallback",
  };
};

const getModelPrediction = async (features) => {
  const endpoint = import.meta.env.VITE_PREDICT_API_URL;
  if (!endpoint) {
    throw new Error("Prediction endpoint not configured.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(features),
  });

  if (!response.ok) {
    throw new Error(`Prediction request failed with ${response.status}`);
  }

  const payload = await response.json();
  const outcome =
    payload?.outcome ||
    payload?.prediction_label ||
    payload?.prediction ||
    payload?.result ||
    payload?.risk_class;

  if (!outcome) {
    throw new Error("Prediction response missing outcome.");
  }

  const modelConfidence =
    normalizeConfidence(payload?.confidence) ||
    normalizeConfidence(payload?.probability) ||
    normalizeConfidence(payload?.risk_score);

  return {
    outcome: predictedClasses.includes(outcome) ? outcome : String(outcome),
    confidence: modelConfidence ?? 0,
    source: "model",
  };
};

const parseNumericInput = (value) => {
  if (value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function MainPortal() {
  const [activeTab, setActiveTab] = useState("home");
  const [castingInputs, setCastingInputs] = useState(initialCastingInputs);
  const [result, setResult] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [formError, setFormError] = useState("");
  const [isPredicting, setIsPredicting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("casecast-history");
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setHistoryItems(parsed);
      }
    } catch (_) {
      setHistoryItems([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("casecast-history", JSON.stringify(historyItems));
  }, [historyItems]);

  const stats = useMemo(() => {
    const casts = historyItems.length;
    const avg = casts
      ? Math.round(historyItems.reduce((sum, item) => sum + (item.confidence || 0), 0) / casts)
      : 0;

    return {
      totalCasts: casts,
      avgConfidence: avg,
    };
  }, [historyItems]);

  const updateCastingInput = (key, value) => {
    setCastingInputs((prev) => ({ ...prev, [key]: value }));
    setFormError("");
  };

  const handlePredict = async (event) => {
    event.preventDefault();

    const parsed = {
      age: parseNumericInput(castingInputs.age),
      sex: castingInputs.sex.trim().toUpperCase(),
      priorOffenses: parseNumericInput(castingInputs.priorOffenses),
      juvenileFelonyCount: parseNumericInput(castingInputs.juvenileFelonyCount),
      juvenileMisdemeanorCount: parseNumericInput(castingInputs.juvenileMisdemeanorCount),
      juvenileOtherCount: parseNumericInput(castingInputs.juvenileOtherCount),
      daysBetweenArrestAndScreening: parseNumericInput(castingInputs.daysBetweenArrestAndScreening),
      daysFromOffenseToScreen: parseNumericInput(castingInputs.daysFromOffenseToScreen),
      jailDurationDays: parseNumericInput(castingInputs.jailDurationDays),
    };

    const hasNullNumber = Object.entries(parsed)
      .filter(([key]) => key !== "sex")
      .some(([, value]) => value === null);

    if (hasNullNumber || !parsed.sex) {
      setFormError("Please fill all input features before prediction.");
      return;
    }

    if (parsed.age < 18) {
      setFormError("Age must be 18 or older.");
      return;
    }

    if (!["M", "F"].includes(parsed.sex)) {
      setFormError("Sex must be M or F.");
      return;
    }

    const nonNegativeKeys = [
      "priorOffenses",
      "juvenileFelonyCount",
      "juvenileMisdemeanorCount",
      "juvenileOtherCount",
      "daysFromOffenseToScreen",
      "jailDurationDays",
    ];

    const hasNegativeValue = nonNegativeKeys.some((key) => parsed[key] < 0);
    if (hasNegativeValue) {
      setFormError("Counts and non-negative duration fields cannot be below 0.");
      return;
    }

    setIsPredicting(true);
    setFormError("");

    let prediction;
    try {
      prediction = await getModelPrediction(parsed);
    } catch (_error) {
      prediction = getFallbackPrediction(parsed);
    } finally {
      setIsPredicting(false);
    }

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...parsed,
      outcome: prediction.outcome,
      confidence: prediction.confidence,
      source: prediction.source,
      createdAt: new Date().toISOString(),
    };

    setResult(prediction);
    setHistoryItems((prev) => [entry, ...prev].slice(0, 24));
  };

  const clearCasting = () => {
    setCastingInputs(initialCastingInputs);
    setResult(null);
    setFormError("");
  };

  return (
    <ClickSpark
      sparkColor="rgba(194, 223, 255, 0.9)"
      sparkSize={8}
      sparkRadius={20}
      sparkCount={8}
      duration={420}
      easing="ease-out"
      className="portal-page-spark"
    >
      <StarBorder
        as="div"
        className="portal-shell portal-shell-star"
        color="rgba(194, 224, 255, 0.88)"
        speed="9.4s"
        thickness={1.1}
      >
        <header className="portal-header-wrap">
        <motion.nav
          className="portal-nav"
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.48, ease: "easeOut" }}
        >
          <StarBorder
            as="div"
            className="portal-nav-shell"
            color="rgba(209, 231, 255, 0.88)"
            speed="7.4s"
          >
            <div className="portal-nav-links" role="tablist" aria-label="Main navigation tabs">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`portal-nav-link${active ? " is-active" : ""}`}
                    onClick={() => setActiveTab(item.key)}
                    role="tab"
                    aria-selected={active}
                  >
                    {active && <motion.span className="portal-nav-active-glow" layoutId="portal-nav-active" />}
                    <Icon size={16} strokeWidth={2} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </StarBorder>
        </motion.nav>
      </header>

      <main className="portal-content">
        <AnimatePresence mode="wait">
          <motion.section
            key={activeTab}
            className="portal-panel"
            initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(3px)" }}
            transition={{ duration: 0.34, ease: "easeOut" }}
          >
            {activeTab === "home" && (
              <div className="portal-home-flow">
                <StarBorder
                  as="section"
                  className="portal-home-shell portal-home-hero"
                  color="rgba(212, 233, 255, 0.9)"
                  speed="7.2s"
                >
                  <ScrollFloat
                    containerClassName="portal-scroll-title-wrap"
                    textClassName="portal-scroll-title"
                    animationDuration={1.1}
                    stagger={0.05}
                    scrollStart="top bottom-=6%"
                    scrollEnd="bottom center+=10%"
                  >
                    CASE CAST
                  </ScrollFloat>

                  <p className="portal-home-subtitle">
                    ML-powered legal intelligence interface for structured prediction workflows.
                  </p>

                  <div className="portal-home-quick-stats">
                    <article className="portal-card portal-stat">
                      <span>Total Predictions</span>
                      <strong>{stats.totalCasts}</strong>
                    </article>

                    <article className="portal-card portal-stat">
                      <span>Average Confidence</span>
                      <strong>{stats.avgConfidence}%</strong>
                    </article>

                    <article className="portal-card portal-court-motion" aria-hidden="true">
                      <motion.div
                        className="portal-court-icon"
                        animate={{ rotate: [0, 9, -8, 7, -6, 0] }}
                        transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Scale size={30} strokeWidth={2.1} />
                      </motion.div>
                      <p>Court Dynamics</p>
                    </article>
                  </div>

                  <StarBorder
                    as="button"
                    type="button"
                    className="portal-primary"
                    onClick={() => setActiveTab("casting")}
                    color="rgba(208, 230, 255, 0.9)"
                    speed="6.8s"
                  >
                    Start Casting
                  </StarBorder>
                </StarBorder>

                <StarBorder
                  as="section"
                  className="portal-home-shell portal-home-features"
                  color="rgba(206, 228, 255, 0.82)"
                  speed="8s"
                >
                  <div className="portal-home-features-head">
                    <p className="portal-kicker">Main Features</p>
                  </div>

                  <div className="portal-home-feature-list">
                    {homeFeatureBlocks.map((feature, index) => (
                      <motion.article
                        key={feature.title}
                        className="portal-card portal-home-feature-item portal-home-feature-icon-card"
                        initial={{ opacity: 0, y: 28 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{ duration: 0.42, delay: index * 0.08, ease: "easeOut" }}
                      >
                        <span className={`portal-home-feature-icon ${feature.toneClass}`}>
                          <feature.icon size={24} strokeWidth={2.1} />
                        </span>
                        <h4>{feature.title}</h4>
                      </motion.article>
                    ))}
                  </div>
                </StarBorder>

              </div>
            )}

            {activeTab === "casting" && (
              <StarBorder
                as="div"
                className="portal-casting-panel-star"
                color="rgba(185, 220, 255, 0.9)"
                speed="8.6s"
              >
                <ClickSpark
                  sparkColor="rgba(132, 201, 255, 0.95)"
                  sparkSize={9}
                  sparkRadius={22}
                  sparkCount={9}
                  duration={460}
                  easing="ease-out"
                  className="portal-casting-spark"
                >
                  <div className="portal-casting-main-box">
                    <form className="portal-cast-form" onSubmit={handlePredict}>
                    <div className="portal-cast-header">
                      <p className="portal-kicker">Casting Inputs</p>
                      <h3>Provide model features for prediction</h3>
                    </div>

                    <div className="portal-cast-grid">
                      <label className="portal-field portal-mini-field">
                        <span>Age (years, 18+)</span>
                        <input
                          type="number"
                          min="18"
                          max="120"
                          value={castingInputs.age}
                          onChange={(event) => updateCastingInput("age", event.target.value)}
                          placeholder="e.g. 35"
                        />
                      </label>

                      <label className="portal-field portal-mini-field">
                        <span>Sex</span>
                        <select
                          value={castingInputs.sex}
                          onChange={(event) => updateCastingInput("sex", event.target.value)}
                        >
                          <option value="">Select M or F</option>
                          <option value="M">M - Male</option>
                          <option value="F">F - Female</option>
                        </select>
                      </label>

                      <label className="portal-field portal-mini-field">
                        <span>Number of Prior Offenses</span>
                        <input
                          type="number"
                          min="0"
                          value={castingInputs.priorOffenses}
                          onChange={(event) => updateCastingInput("priorOffenses", event.target.value)}
                          placeholder="e.g. 4"
                        />
                      </label>

                      <label className="portal-field portal-mini-field">
                        <span>Juvenile Felony Count</span>
                        <input
                          type="number"
                          min="0"
                          value={castingInputs.juvenileFelonyCount}
                          onChange={(event) =>
                            updateCastingInput("juvenileFelonyCount", event.target.value)
                          }
                          placeholder="e.g. 2"
                        />
                      </label>

                      <label className="portal-field portal-mini-field">
                        <span>Juvenile Misdemeanor Count</span>
                        <input
                          type="number"
                          min="0"
                          value={castingInputs.juvenileMisdemeanorCount}
                          onChange={(event) =>
                            updateCastingInput("juvenileMisdemeanorCount", event.target.value)
                          }
                          placeholder="e.g. 0"
                        />
                      </label>

                      <label className="portal-field portal-mini-field">
                        <span>Juvenile Other Charges</span>
                        <input
                          type="number"
                          min="0"
                          value={castingInputs.juvenileOtherCount}
                          onChange={(event) => updateCastingInput("juvenileOtherCount", event.target.value)}
                          placeholder="e.g. 0"
                        />
                      </label>

                      <label className="portal-field portal-mini-field">
                        <span>Days Between Arrest and Screen</span>
                        <input
                          type="number"
                          value={castingInputs.daysBetweenArrestAndScreening}
                          onChange={(event) =>
                            updateCastingInput("daysBetweenArrestAndScreening", event.target.value)
                          }
                          placeholder="e.g. -20"
                        />
                      </label>

                      <label className="portal-field portal-mini-field">
                        <span>Days from Offense to Screen</span>
                        <input
                          type="number"
                          min="0"
                          value={castingInputs.daysFromOffenseToScreen}
                          onChange={(event) =>
                            updateCastingInput("daysFromOffenseToScreen", event.target.value)
                          }
                          placeholder="e.g. 22"
                        />
                      </label>

                      <label className="portal-field portal-mini-field">
                        <span>Jail Duration (days)</span>
                        <input
                          type="number"
                          min="0"
                          value={castingInputs.jailDurationDays}
                          onChange={(event) => updateCastingInput("jailDurationDays", event.target.value)}
                          placeholder="e.g. 4"
                        />
                      </label>
                    </div>

                    {formError && <p className="portal-form-error">{formError}</p>}

                    <div className="portal-cast-actions">
                      <StarBorder
                        as="button"
                        type="submit"
                        disabled={isPredicting}
                        className="portal-primary"
                        color="rgba(206, 230, 255, 0.92)"
                        speed="6.4s"
                      >
                        {isPredicting ? "Predicting..." : "Predict Output"}
                      </StarBorder>
                      <button type="button" className="portal-ghost" onClick={clearCasting}>
                        Reset
                      </button>
                    </div>

                    {result && (
                      <article className="portal-result">
                        <span>Predicted Result</span>
                        <h3>{result.outcome}</h3>
                        {result.confidence > 0 ? <p>Confidence score: {result.confidence}%</p> : <p>Confidence: N/A</p>}
                        <p>Source: {result.source === "model" ? "ML model" : "Frontend fallback"}</p>
                      </article>
                    )}
                    </form>
                  </div>
                </ClickSpark>
              </StarBorder>
            )}

            {activeTab === "history" && (
              <div className="portal-history-list">
                {historyItems.length === 0 && (
                  <article className="portal-card portal-empty">
                    <h3>No prediction history yet.</h3>
                    <p>Run your first cast to see model interaction history here.</p>
                  </article>
                )}

                {historyItems.map((item) => (
                  <article key={item.id} className="portal-card portal-history-item">
                    <div className="portal-history-top">
                      <h3>{item.outcome}</h3>
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                    <p>
                      Age: {item.age} | Sex: {item.sex} | Prior Offenses: {item.priorOffenses}
                    </p>
                    <p>
                      Juvenile(Felony/Misdemeanor/Other): {item.juvenileFelonyCount}/
                      {item.juvenileMisdemeanorCount}/{item.juvenileOtherCount}
                    </p>
                    <p>
                      Days(Arrest-Screen/Offense-Screen): {item.daysBetweenArrestAndScreening}/
                      {item.daysFromOffenseToScreen} | Jail Duration: {item.jailDurationDays}
                    </p>
                    <div className="portal-history-meta">
                      <span>Feature Input: Structured (9 fields)</span>
                      <span>Confidence: {item.confidence}%</span>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {activeTab === "profile" && (
              <div className="portal-grid portal-grid-profile">
                <article className="portal-card portal-profile-main">
                  <p className="portal-kicker">User Profile</p>
                  <h2>Case Analyst</h2>
                  <p>Manage your account and system behavior preferences for smooth ML-assisted case predictions.</p>
                </article>

                <article className="portal-card portal-preference">
                  <h3>Interface</h3>
                  <p>Liquid glass theme: Enabled</p>
                  <p>Transition mode: Smooth</p>
                  <p>Render profile: Balanced quality</p>
                </article>

                <article className="portal-card portal-preference">
                  <h3>Model Context</h3>
                  <p>Domain: Legal outcome classification</p>
                  <p>Input mode: COMPAS-style structured features</p>
                  <p>History retention: 24 recent predictions</p>
                </article>
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      </main>

      <footer className="portal-footer">
        <div className="portal-footer-inner">
          <div className="portal-footer-brand">
            <p>CaseCast AI</p>
            <span>Premium legal intelligence frontend for ML-powered case outcome prediction.</span>
          </div>
          <div className="portal-footer-meta">
            <span>Copyright © 2026 CaseCast Technologies. All rights reserved.</span>
            <span>Contact: sankirthan1811@gmail.com | +91 9876543210</span>
            <span>Address: Sir M Visveshwaraih block, NMAMIT, Nitte, Udupi</span>
          </div>
        </div>
      </footer>
      </StarBorder>
    </ClickSpark>
  );
}
