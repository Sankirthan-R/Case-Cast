import { AnimatePresence, motion } from "framer-motion";
import { History, Home, LogOut, Sparkles, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StarBorder from "../components/StarBorder";

const navItems = [
  { key: "home", label: "Home", icon: Home },
  { key: "casting", label: "Casting", icon: Sparkles },
  { key: "history", label: "History", icon: History },
  { key: "profile", label: "Profile", icon: UserRound },
];

const initialOptions = ["", "", "", "", ""];

const getPrediction = (prompt, options, selectedIndex) => {
  const seed = [...prompt.trim()].reduce((sum, char) => sum + char.charCodeAt(0), 0) + (selectedIndex + 1) * 17;
  const predictionIndex = Math.abs(seed) % options.length;
  const confidence = 72 + (seed % 24);

  return {
    outcome: options[predictionIndex],
    confidence: Math.min(96, Math.max(68, confidence)),
  };
};

export default function MainPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState(initialOptions);
  const [selectedOption, setSelectedOption] = useState(0);
  const [result, setResult] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);

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

  const updateOption = (index, value) => {
    setOptions((prev) => prev.map((entry, i) => (i === index ? value : entry)));
  };

  const handlePredict = (event) => {
    event.preventDefault();

    const sanitizedOptions = options.map((entry) => entry.trim());
    if (!prompt.trim() || sanitizedOptions.some((entry) => !entry)) {
      return;
    }

    const prediction = getPrediction(prompt, sanitizedOptions, selectedOption);
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      prompt: prompt.trim(),
      options: sanitizedOptions,
      selectedOption: sanitizedOptions[selectedOption],
      outcome: prediction.outcome,
      confidence: prediction.confidence,
      createdAt: new Date().toISOString(),
    };

    setResult(prediction);
    setHistoryItems((prev) => [entry, ...prev].slice(0, 24));
    setActiveTab("history");
  };

  const clearCasting = () => {
    setPrompt("");
    setOptions(initialOptions);
    setSelectedOption(0);
    setResult(null);
  };

  return (
    <div className="portal-shell">
      <header className="portal-header-wrap">
        <motion.nav
          className="portal-nav"
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.48, ease: "easeOut" }}
        >
          <div className="portal-brand">
            <span className="portal-brand-dot" aria-hidden="true" />
            <div>
              <h1>CaseCast AI</h1>
              <p>Case outcome intelligence</p>
            </div>
          </div>

          <div className="portal-nav-links">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`portal-nav-link${active ? " is-active" : ""}`}
                  onClick={() => setActiveTab(item.key)}
                >
                  <Icon size={16} strokeWidth={2} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <StarBorder
            as="button"
            type="button"
            className="portal-logout"
            onClick={() => navigate("/")}
            color="rgba(214, 234, 255, 0.88)"
            speed="7.4s"
            thickness={1}
          >
            <LogOut size={14} />
            <span>Logout</span>
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
              <div className="portal-grid portal-grid-home">
                <article className="portal-card portal-card-hero">
                  <p className="portal-kicker">Prediction Studio</p>
                  <h2>Premium frontend for your legal outcome ML model.</h2>
                  <p>
                    Provide a case context, define five candidate outcomes, and let the model-facing workflow surface
                    the most probable case result.
                  </p>
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
                </article>

                <article className="portal-card portal-stat">
                  <span>Total Predictions</span>
                  <strong>{stats.totalCasts}</strong>
                </article>

                <article className="portal-card portal-stat">
                  <span>Average Confidence</span>
                  <strong>{stats.avgConfidence}%</strong>
                </article>
              </div>
            )}

            {activeTab === "casting" && (
              <form className="portal-cast-form" onSubmit={handlePredict}>
                <label className="portal-field">
                  <span>Case Summary</span>
                  <textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Paste the case brief, key facts, and legal context here..."
                    rows={6}
                  />
                </label>

                <div className="portal-options-wrap">
                  <p>Outcome Options (MCQ)</p>
                  {options.map((value, index) => (
                    <label key={`option-${index}`} className="portal-option-field">
                      <input
                        type="radio"
                        name="selected-outcome"
                        checked={selectedOption === index}
                        onChange={() => setSelectedOption(index)}
                      />
                      <input
                        type="text"
                        value={value}
                        placeholder={`Option ${index + 1}`}
                        onChange={(event) => updateOption(index, event.target.value)}
                      />
                    </label>
                  ))}
                </div>

                <div className="portal-cast-actions">
                  <StarBorder
                    as="button"
                    type="submit"
                    className="portal-primary"
                    color="rgba(206, 230, 255, 0.92)"
                    speed="6.4s"
                  >
                    Predict Outcome
                  </StarBorder>
                  <button type="button" className="portal-ghost" onClick={clearCasting}>
                    Reset
                  </button>
                </div>

                {result && (
                  <article className="portal-result">
                    <span>Predicted Outcome</span>
                    <h3>{result.outcome}</h3>
                    <p>Confidence score: {result.confidence}%</p>
                  </article>
                )}
              </form>
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
                    <p>{item.prompt}</p>
                    <div className="portal-history-meta">
                      <span>Selected: {item.selectedOption}</span>
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
                  <p>Input mode: Narrative + 5-option MCQ</p>
                  <p>History retention: 24 recent predictions</p>
                </article>
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      </main>
    </div>
  );
}
