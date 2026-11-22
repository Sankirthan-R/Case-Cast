import { AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { runPrediction } from "../api/predict";
import { usePredictionHistory } from "../hooks/usePredictionHistory";
import { initialCastingInputs, parseNumericInput } from "../utils/prediction";
import AppShell from "../components/AppShell";
import HomePage from "./portal/HomePage";
import PredictPage from "./portal/PredictPage";
import LogsPage from "./portal/LogsPage";
import ProfilePage from "./portal/ProfilePage";

export default function MainPortal({ user, setUser, onLogout, theme, setTheme }) {
  const [activeTab, setActiveTab] = useState("home");
  const [castingInputs, setCastingInputs] = useState(initialCastingInputs);
  const [result, setResult] = useState(null);
  const [formError, setFormError] = useState("");
  const [isPredicting, setIsPredicting] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const { historyItems, refreshHistory } = usePredictionHistory(user);

  const stats = useMemo(() => {
    const casts = historyItems.length;
    const avg = casts
      ? Math.round(historyItems.reduce((s, i) => s + (i.confidence || 0), 0) / casts)
      : 0;
    return { totalCasts: casts, avgConfidence: avg };
  }, [historyItems]);

  const updateCastingInput = (key, value) => {
    setCastingInputs((prev) => ({ ...prev, [key]: value }));
    setFormError("");
  };

  const handlePredict = async (event) => {
    event.preventDefault();
    const rawSex = castingInputs.sex ? castingInputs.sex.trim().toUpperCase() : "";
    const sex = rawSex.startsWith("M") ? "M" : rawSex.startsWith("F") ? "F" : "";

    const parsed = {
      age: Math.round(Number(parseNumericInput(castingInputs.age))),
      sex: sex,
      priorOffenses: Math.round(Number(parseNumericInput(castingInputs.priorOffenses))),
      juvenileFelonyCount: Math.round(Number(parseNumericInput(castingInputs.juvenileFelonyCount) || 0)),
      juvenileMisdemeanorCount: Math.round(Number(parseNumericInput(castingInputs.juvenileMisdemeanorCount) || 0)),
      juvenileOtherCount: Math.round(Number(parseNumericInput(castingInputs.juvenileOtherCount) || 0)),
      daysBetweenArrestAndScreening: Math.round(Number(parseNumericInput(castingInputs.daysBetweenArrestAndScreening))),
      daysFromOffenseToScreen: Math.round(Number(parseNumericInput(castingInputs.daysFromOffenseToScreen))),
      jailDurationDays: Math.round(Number(parseNumericInput(castingInputs.jailDurationDays))),
    };

    const missingKeys = Object.entries(parsed)
      .filter(([key, value]) => key !== "sex" && (value === null || isNaN(value)))
      .map(([key]) => key);
    if (!parsed.sex) missingKeys.push("sex");

    if (missingKeys.length > 0) {
      setFormError(`Please fill all required inputs. Missing or invalid: ${missingKeys.join(", ")}`);
      return;
    }

    if (parsed.age < 18 || parsed.age > 100) {
      setFormError("Age must be between 18 and 100 years.");
      return;
    }

    const juvenileTotal =
      parsed.juvenileFelonyCount + parsed.juvenileMisdemeanorCount + parsed.juvenileOtherCount;
    if (parsed.priorOffenses < juvenileTotal) {
      setFormError(
        `Prior offenses (${parsed.priorOffenses}) must be ≥ total juvenile counts (${juvenileTotal} = felony + misdemeanor + other).`
      );
      return;
    }

    const maxJailDays = parsed.age * 365;
    if (parsed.jailDurationDays >= maxJailDays) {
      setFormError(
        `Jail duration (${parsed.jailDurationDays} days) cannot exceed the person's lifetime (${maxJailDays} days for age ${parsed.age}).`
      );
      return;
    }

    setIsPredicting(true);
    setFormError("");

    try {
      const token = localStorage.getItem("casecast-token");
      if (!token) {
        onLogout();
        return;
      }
      const prediction = await runPrediction(token, parsed);
      setResult(prediction);
      await refreshHistory();
    } catch (err) {
      if (err.message && err.message.includes("401")) {
        onLogout();
        return;
      }
      setFormError(err.message || "Prediction failed.");
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <AppShell
      user={user}
      onLogout={onLogout}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      stats={stats}
      showProfileMenu={showProfileMenu}
      setShowProfileMenu={setShowProfileMenu}
      theme={theme}
      setTheme={setTheme}
    >
      <AnimatePresence mode="wait">
        {activeTab === "home" && (
          <HomePage key="home" onStartPredicting={() => setActiveTab("casting")} />
        )}
        {activeTab === "casting" && (
          <PredictPage
            key="casting"
            castingInputs={castingInputs}
            updateCastingInput={updateCastingInput}
            handlePredict={handlePredict}
            isPredicting={isPredicting}
            formError={formError}
            result={result}
            activeTab={activeTab}
          />
        )}
        {activeTab === "history" && (
          <LogsPage key="history" historyItems={historyItems} onRefresh={refreshHistory} />
        )}
        {activeTab === "profile" && (
          <ProfilePage key="profile" user={user} setUser={setUser} onLogout={onLogout} />
        )}
      </AnimatePresence>
    </AppShell>
  );
}
