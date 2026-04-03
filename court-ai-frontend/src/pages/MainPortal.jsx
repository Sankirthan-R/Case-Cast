import { AnimatePresence, motion } from "framer-motion";
import {
  History,
  Home,
  Scale,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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

const fallbackModelInfo = {
  decileRegressor: {
    name: "GradientBoosting Regressor",
    mae: 1.615,
  },
  violentDecileRegressor: {
    name: "Random Forest Regressor",
    mae: 1.214,
  },
  bestSummary: {
    conviction: {
      model: "XGBoost (GBM)",
      accuracy: 84.66,
      f1: 91.42,
      precision: 86.98,
      recall: 96.33,
      cvAccuracy: 84.73,
      cvF1: 91.49,
    },
    chargeSeverity: {
      model: "XGBoost (GBM)",
      accuracy: 68.23,
      f1: 78.34,
      precision: 70.58,
      recall: 88.03,
      cvAccuracy: 67.41,
      cvF1: 77.9,
    },
    recidivism: {
      model: "Random Forest",
      accuracy: 69.83,
      f1: 68.48,
      precision: 66.23,
      recall: 70.89,
      cvAccuracy: 69.0,
      cvF1: 66.56,
    },
  },
  trainingLogs: {
    decileRegressors: [
      { model: "Random Forest Regressor", mae: 1.636, r2: 0.488, plusMinusOneAcc: 54.8 },
      { model: "GradientBoosting Regressor", mae: 1.615, r2: 0.497, plusMinusOneAcc: 56.2 },
    ],
    violentDecileRegressors: [
      { model: "Random Forest Regressor", mae: 1.214, r2: 0.578, plusMinusOneAcc: 69.6 },
      { model: "GradientBoosting Regressor", mae: 1.223, r2: 0.573, plusMinusOneAcc: 69.8 },
    ],
    classifiers: {
      conviction: [
        { model: "Logistic Regression", accuracy: 71.64, precision: 88.24, recall: 76.79, f1: 82.12, cvAccuracy: 72.35, cvF1: 82.55 },
        { model: "Decision Tree", accuracy: 67.37, precision: 90.19, recall: 69.03, f1: 78.2, cvAccuracy: 66.31, cvF1: 76.85 },
        { model: "Random Forest", accuracy: 72.79, precision: 90.53, recall: 75.85, f1: 82.54, cvAccuracy: 73.77, cvF1: 83.09 },
        { model: "XGBoost (GBM)", accuracy: 84.66, precision: 86.98, recall: 96.33, f1: 91.42, cvAccuracy: 84.73, cvF1: 91.49 },
      ],
      chargeSeverity: [
        { model: "Logistic Regression", accuracy: 57.89, precision: 75.4, recall: 52.66, f1: 62.01, cvAccuracy: 58.75, cvF1: 63.33 },
        { model: "Decision Tree", accuracy: 59.19, precision: 74.42, recall: 57.1, f1: 64.62, cvAccuracy: 59.81, cvF1: 65.9 },
        { model: "Random Forest", accuracy: 64.54, precision: 74.58, recall: 69.29, f1: 71.84, cvAccuracy: 63.94, cvF1: 71.62 },
        { model: "XGBoost (GBM)", accuracy: 68.23, precision: 70.58, recall: 88.03, f1: 78.34, cvAccuracy: 67.41, cvF1: 77.9 },
      ],
      recidivism: [
        { model: "Logistic Regression", accuracy: 69.61, precision: 65.85, recall: 71.21, f1: 68.42, cvAccuracy: 68.41, cvF1: 65.56 },
        { model: "Decision Tree", accuracy: 66.43, precision: 62.17, recall: 69.95, f1: 65.83, cvAccuracy: 66.67, cvF1: 64.07 },
        { model: "Random Forest", accuracy: 69.83, precision: 66.23, recall: 70.89, f1: 68.48, cvAccuracy: 69, cvF1: 66.56 },
        { model: "XGBoost (GBM)", accuracy: 69.61, precision: 67.98, recall: 64.79, f1: 66.35, cvAccuracy: 68.51, cvF1: 64.18 },
      ],
    },
  },
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

  const confidence = Math.min(95, Math.max(68, 68 + Math.round(riskSeed * 2.4)));
  const convProb = Math.min(98, Math.max(52, confidence + 6));
  const nbProb = Math.min(93, Math.max(44, 44 + riskSeed * 2.2));
  const recidProb = Math.min(96, Math.max(46, 46 + riskSeed * 2.5));
  const predictedDecile = Math.min(10, Math.max(1, Math.round(1 + riskSeed / 2)));
  const predictedViolentDecile = Math.min(10, Math.max(1, Math.round(2 + riskSeed / 1.8)));

  const convictionLabel = convProb >= 50 ? "CONVICTED" : "NOT CONVICTED / CHARGE DROPPED";
  const chargeLabel = nbProb >= 50 ? "NON-BAILABLE (NB)" : "BAILABLE (B)";
  const recidLabel = recidProb >= 50 ? "LIKELY TO REOFFEND" : "UNLIKELY TO REOFFEND";

  return {
    summary: {
      outcome,
      confidence,
    },
    autoComputedRiskScores: {
      decileScore: predictedDecile,
      decileScoreRaw: Number(predictedDecile.toFixed(2)),
      violentDecileScore: predictedViolentDecile,
      violentDecileScoreRaw: Number(predictedViolentDecile.toFixed(2)),
    },
    conviction: {
      prediction: convictionLabel,
      pConvicted: Number(convProb.toFixed(1)),
      pNotConvicted: Number((100 - convProb).toFixed(1)),
      bestModel: "XGBoost (GBM)",
    },
    chargeSeverity: {
      prediction: chargeLabel,
      pNonBailable: Number(nbProb.toFixed(1)),
      pBailable: Number((100 - nbProb).toFixed(1)),
      bestModel: "XGBoost (GBM)",
    },
    recidivism: {
      prediction: recidLabel,
      pWillReoffend: Number(recidProb.toFixed(1)),
      pWillNotReoffend: Number((100 - recidProb).toFixed(1)),
      bestModel: "Random Forest",
    },
    modelInfo: fallbackModelInfo,
    source: "fallback",
  };
};

const getModelPrediction = async (features) => {
  const endpoint = getPredictionEndpoint();

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

  if (payload?.summary?.outcome) {
    return {
      ...payload,
      source: "model",
    };
  }

  throw new Error("Prediction response missing summary fields.");
};

const parseNumericInput = (value) => {
  if (value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const metricValue = (value) => Math.max(0, Math.min(100, Number(value) || 0));

const fieldOrder = [
  "age",
  "sex",
  "priorOffenses",
  "juvenileFelonyCount",
  "juvenileMisdemeanorCount",
  "juvenileOtherCount",
  "daysBetweenArrestAndScreening",
  "daysFromOffenseToScreen",
  "jailDurationDays",
];

const getApiEndpoint = (path) => {
  const base = (import.meta.env.VITE_API_BASE_URL || "").trim();
  if (!base) {
    return `/api/${path}`;
  }
  return `${base.replace(/\/$/, "")}/api/${path}`;
};

const getPredictionEndpoint = () => {
  const explicit = (import.meta.env.VITE_PREDICT_API_URL || "").trim();
  if (explicit) {
    return explicit;
  }
  return getApiEndpoint("predict");
};

const sectionTitleMap = {
  conviction: "Convicted / Not Convicted",
  chargeSeverity: "Bailable / Non-Bailable",
  recidivism: "Recidivism (2-Year)",
};

export default function MainPortal() {
  const castFormRef = useRef(null);
  const [activeTab, setActiveTab] = useState("home");
  const [castingInputs, setCastingInputs] = useState(initialCastingInputs);
  const [result, setResult] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [formError, setFormError] = useState("");
  const [isPredicting, setIsPredicting] = useState(false);
  const [showModelInfo, setShowModelInfo] = useState(false);
  const [apiStatus, setApiStatus] = useState("checking");
  const [lastApiError, setLastApiError] = useState("");

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
    } catch {
      setHistoryItems([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("casecast-history", JSON.stringify(historyItems));
  }, [historyItems]);

  useEffect(() => {
    let active = true;

    const checkBackend = async () => {
      try {
        const response = await fetch(getApiEndpoint("health"));
        if (!response.ok) {
          throw new Error(`Health check failed with ${response.status}`);
        }
        if (active) {
          setApiStatus("online");
        }
      } catch {
        if (active) {
          setApiStatus("offline");
        }
      }
    };

    checkBackend();

    return () => {
      active = false;
    };
  }, []);

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
    setShowModelInfo(false);
  };

  const focusRelativeField = (currentField, step) => {
    const currentIndex = fieldOrder.indexOf(currentField);
    if (currentIndex === -1) {
      return;
    }
    const nextIndex = currentIndex + step;
    if (nextIndex < 0 || nextIndex >= fieldOrder.length) {
      return;
    }

    const nextField = fieldOrder[nextIndex];
    const root = castFormRef.current;
    if (!root) {
      return;
    }

    const nextInput = root.querySelector(`[name="${nextField}"]`);
    if (nextInput) {
      nextInput.focus();
      if (typeof nextInput.select === "function") {
        nextInput.select();
      }
    }
  };

  const handleFieldKeyNav = (event, fieldKey) => {
    if (event.key === "Enter") {
      event.preventDefault();
      focusRelativeField(fieldKey, event.shiftKey ? -1 : 1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusRelativeField(fieldKey, 1);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusRelativeField(fieldKey, -1);
    }
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
    setLastApiError("");

    let prediction;
    try {
      prediction = await getModelPrediction(parsed);
      setApiStatus("online");
    } catch {
      prediction = getFallbackPrediction(parsed);
      setApiStatus("offline");
      setLastApiError("Backend API unreachable. Showing fallback prediction.");
    } finally {
      setIsPredicting(false);
    }

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...parsed,
      outcome: prediction.summary.outcome,
      confidence: prediction.summary.confidence,
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
    setShowModelInfo(false);
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
                    aria-current={active ? "page" : undefined}
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
                    <form className="portal-cast-form" onSubmit={handlePredict} ref={castFormRef}>
                    <div className="portal-cast-header">
                      <p className="portal-kicker">Casting Inputs</p>
                      <h3>Provide model features for prediction</h3>
                      <p className={`portal-api-status ${apiStatus === "online" ? "is-online" : apiStatus === "offline" ? "is-offline" : "is-checking"}`}>
                        Backend: {apiStatus === "online" ? "Connected" : apiStatus === "offline" ? "Not Connected" : "Checking..."}
                      </p>
                    </div>

                    <div className="portal-cast-grid">
                      <label className="portal-field portal-mini-field">
                        <span>Age (years, 18+)</span>
                        <input
                          name="age"
                          type="number"
                          min="18"
                          max="120"
                          value={castingInputs.age}
                          onChange={(event) => updateCastingInput("age", event.target.value)}
                          onKeyDown={(event) => handleFieldKeyNav(event, "age")}
                          placeholder="e.g. 35"
                        />
                      </label>

                      <label className="portal-field portal-mini-field">
                        <span>Sex</span>
                        <select
                          name="sex"
                          value={castingInputs.sex}
                          onChange={(event) => updateCastingInput("sex", event.target.value)}
                          onKeyDown={(event) => handleFieldKeyNav(event, "sex")}
                        >
                          <option value="">Select M or F</option>
                          <option value="M">M - Male</option>
                          <option value="F">F - Female</option>
                        </select>
                      </label>

                      <label className="portal-field portal-mini-field">
                        <span>Number of Prior Offenses</span>
                        <input
                          name="priorOffenses"
                          type="number"
                          min="0"
                          value={castingInputs.priorOffenses}
                          onChange={(event) => updateCastingInput("priorOffenses", event.target.value)}
                          onKeyDown={(event) => handleFieldKeyNav(event, "priorOffenses")}
                          placeholder="e.g. 4"
                        />
                      </label>

                      <label className="portal-field portal-mini-field">
                        <span>Juvenile Felony Count</span>
                        <input
                          name="juvenileFelonyCount"
                          type="number"
                          min="0"
                          value={castingInputs.juvenileFelonyCount}
                          onChange={(event) =>
                            updateCastingInput("juvenileFelonyCount", event.target.value)
                          }
                          onKeyDown={(event) => handleFieldKeyNav(event, "juvenileFelonyCount")}
                          placeholder="e.g. 2"
                        />
                      </label>

                      <label className="portal-field portal-mini-field">
                        <span>Juvenile Misdemeanor Count</span>
                        <input
                          name="juvenileMisdemeanorCount"
                          type="number"
                          min="0"
                          value={castingInputs.juvenileMisdemeanorCount}
                          onChange={(event) =>
                            updateCastingInput("juvenileMisdemeanorCount", event.target.value)
                          }
                          onKeyDown={(event) => handleFieldKeyNav(event, "juvenileMisdemeanorCount")}
                          placeholder="e.g. 0"
                        />
                      </label>

                      <label className="portal-field portal-mini-field">
                        <span>Juvenile Other Charges</span>
                        <input
                          name="juvenileOtherCount"
                          type="number"
                          min="0"
                          value={castingInputs.juvenileOtherCount}
                          onChange={(event) => updateCastingInput("juvenileOtherCount", event.target.value)}
                          onKeyDown={(event) => handleFieldKeyNav(event, "juvenileOtherCount")}
                          placeholder="e.g. 0"
                        />
                      </label>

                      <label className="portal-field portal-mini-field">
                        <span>Days Between Arrest and Screen</span>
                        <input
                          name="daysBetweenArrestAndScreening"
                          type="number"
                          value={castingInputs.daysBetweenArrestAndScreening}
                          onChange={(event) =>
                            updateCastingInput("daysBetweenArrestAndScreening", event.target.value)
                          }
                          onKeyDown={(event) => handleFieldKeyNav(event, "daysBetweenArrestAndScreening")}
                          placeholder="e.g. -20"
                        />
                      </label>

                      <label className="portal-field portal-mini-field">
                        <span>Days from Offense to Screen</span>
                        <input
                          name="daysFromOffenseToScreen"
                          type="number"
                          min="0"
                          value={castingInputs.daysFromOffenseToScreen}
                          onChange={(event) =>
                            updateCastingInput("daysFromOffenseToScreen", event.target.value)
                          }
                          onKeyDown={(event) => handleFieldKeyNav(event, "daysFromOffenseToScreen")}
                          placeholder="e.g. 22"
                        />
                      </label>

                      <label className="portal-field portal-mini-field">
                        <span>Jail Duration (days)</span>
                        <input
                          name="jailDurationDays"
                          type="number"
                          min="0"
                          value={castingInputs.jailDurationDays}
                          onChange={(event) => updateCastingInput("jailDurationDays", event.target.value)}
                          onKeyDown={(event) => handleFieldKeyNav(event, "jailDurationDays")}
                          placeholder="e.g. 4"
                        />
                      </label>
                    </div>

                    {formError && <p className="portal-form-error">{formError}</p>}
                    {lastApiError && <p className="portal-form-error">{lastApiError}</p>}

                    <div className="portal-cast-actions">
                      <StarBorder
                        as="button"
                        type="submit"
                        disabled={isPredicting}
                        className="portal-cast-predict-btn"
                        color="rgba(206, 230, 255, 0.92)"
                        speed="6.4s"
                      >
                        {isPredicting ? "Predicting..." : "Predict Output"}
                      </StarBorder>
                      {result && (
                        <button
                          type="button"
                          className="portal-ghost"
                          onClick={() => setShowModelInfo((prev) => !prev)}
                        >
                          {showModelInfo ? "Hide Model Info" : "MODEL INFO"}
                        </button>
                      )}
                      <button type="button" className="portal-ghost" onClick={clearCasting}>
                        Reset
                      </button>
                    </div>

                    {isPredicting && (
                      <motion.p
                        className="portal-predicting-indicator"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -2 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                      >
                        Predicting
                        <span className="portal-predicting-dots" aria-hidden="true">...</span>
                      </motion.p>
                    )}

                    {result && (
                      <section className="portal-result-stack">
                        <article className="portal-result">
                          <span>Prediction Results</span>
                          <h3>{result.summary.outcome}</h3>
                          <p>Confidence score: {result.summary.confidence}%</p>

                          <div className="portal-result-grid">
                            <div className="portal-result-card">
                              <h4>Auto-Computed Risk Scores</h4>
                              <p>
                                Decile (general): {result.autoComputedRiskScores.decileScore}/10
                                <span>raw {result.autoComputedRiskScores.decileScoreRaw.toFixed(2)}</span>
                              </p>
                              <p>
                                Decile (violent): {result.autoComputedRiskScores.violentDecileScore}/10
                                <span>raw {result.autoComputedRiskScores.violentDecileScoreRaw.toFixed(2)}</span>
                              </p>
                            </div>

                            <div className="portal-result-card">
                              <h4>Conviction Likelihood</h4>
                              <p>{result.conviction.prediction}</p>
                              <p>Convicted: {result.conviction.pConvicted}%</p>
                              <p>Not Convicted: {result.conviction.pNotConvicted}%</p>
                              <p>Best model: {result.conviction.bestModel}</p>
                            </div>

                            <div className="portal-result-card">
                              <h4>Charge Severity</h4>
                              <p>{result.chargeSeverity.prediction}</p>
                              <p>Non-Bailable: {result.chargeSeverity.pNonBailable}%</p>
                              <p>Bailable: {result.chargeSeverity.pBailable}%</p>
                              <p>Best model: {result.chargeSeverity.bestModel}</p>
                            </div>

                            <div className="portal-result-card">
                              <h4>Recidivism (2-Year)</h4>
                              <p>{result.recidivism.prediction}</p>
                              <p>Will Reoffend: {result.recidivism.pWillReoffend}%</p>
                              <p>Will Not Reoffend: {result.recidivism.pWillNotReoffend}%</p>
                              <p>Best model: {result.recidivism.bestModel}</p>
                            </div>
                          </div>

                          <p>Source: {result.source === "model" ? "ML backend model" : "Frontend fallback"}</p>
                        </article>

                        {showModelInfo && result.modelInfo && (
                          <article className="portal-model-info">
                            <h3>Best Model Summary</h3>
                            <p>
                              Decile Regressor: {result.modelInfo.decileRegressor.name} (MAE {result.modelInfo.decileRegressor.mae})
                            </p>
                            <p>
                              Violent Decile Regressor: {result.modelInfo.violentDecileRegressor.name} (MAE {result.modelInfo.violentDecileRegressor.mae})
                            </p>

                            <div className="portal-model-metrics-grid">
                              {Object.entries(result.modelInfo.bestSummary).map(([key, details]) => (
                                <div key={key} className="portal-model-metric-card">
                                  <h4>{sectionTitleMap[key] || key}</h4>
                                  <p>{details.model}</p>

                                  <div className="portal-gauge-grid">
                                    {[
                                      { label: "Accuracy", value: details.accuracy },
                                      { label: "F1", value: details.f1 },
                                    ].map((item) => (
                                      <div key={item.label} className="portal-gauge-wrap">
                                        <div className="portal-ring" style={{ "--value": metricValue(item.value) }}>
                                          <span className="portal-ring-value">{item.value}%</span>
                                        </div>
                                        <span className="portal-gauge-label">{item.label}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {result.modelInfo.trainingLogs && (
                              <div className="portal-training-logs">
                                <h4>Training Logs</h4>

                                <div className="portal-log-block">
                                  <p>Decile Score Regressors</p>
                                  <div className="portal-log-table">
                                    {result.modelInfo.trainingLogs.decileRegressors?.map((row) => (
                                      <div key={row.model} className="portal-log-row">
                                        <span>{row.model}</span>
                                        <strong>MAE {row.mae}</strong>
                                        <strong>R2 {row.r2}</strong>
                                        <strong>±1 {row.plusMinusOneAcc}%</strong>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="portal-log-block">
                                  <p>Violent Decile Regressors</p>
                                  <div className="portal-log-table">
                                    {result.modelInfo.trainingLogs.violentDecileRegressors?.map((row) => (
                                      <div key={row.model} className="portal-log-row">
                                        <span>{row.model}</span>
                                        <strong>MAE {row.mae}</strong>
                                        <strong>R2 {row.r2}</strong>
                                        <strong>±1 {row.plusMinusOneAcc}%</strong>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {Object.entries(result.modelInfo.trainingLogs.classifiers || {}).map(([target, rows]) => (
                                  <div key={target} className="portal-log-block">
                                    <p>{sectionTitleMap[target] || target}</p>
                                    <div className="portal-log-table portal-log-table--classifier">
                                      {rows.map((row) => (
                                        <div key={`${target}-${row.model}`} className="portal-log-classifier-card">
                                          <h5>{row.model}</h5>
                                          <div className="portal-compact-metrics">
                                            <span><b>Acc</b> {row.accuracy}%</span>
                                            <span><b>F1</b> {row.f1}%</span>
                                            <span><b>Prec</b> {row.precision}%</span>
                                            <span><b>Rec</b> {row.recall}%</span>
                                            <span><b>CV Acc</b> {row.cvAccuracy}%</span>
                                            <span><b>CV F1</b> {row.cvF1}%</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </article>
                        )}
                      </section>
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
