import { AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { runPrediction } from "../api/predict";
import { usePredictionHistory } from "../hooks/usePredictionHistory";
import { getFallbackPrediction, initialCastingInputs, parseNumericInput } from "../utils/prediction";
import AppShell from "../components/AppShell";
import HomePage from "./portal/HomePage";
import PredictPage from "./portal/PredictPage";
import LogsPage from "./portal/LogsPage";
import ProfilePage from "./portal/ProfilePage";

export default function MainPortal({ user, onLogout, theme, setTheme }) {
  const [activeTab, setActiveTab] = useState("home");
  const [castingInputs, setCastingInputs] = useState(initialCastingInputs);
  const [result, setResult] = useState(null);
  const [formError, setFormError] = useState("");
  const [isPredicting, setIsPredicting] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const { historyItems, setHistoryItems, refreshHistory } = usePredictionHistory(user);

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
    const parsed = {
      age: parseNumericInput(castingInputs.age),
      sex: castingInputs.sex ? castingInputs.sex.trim().toUpperCase() : "",
      priorOffenses: parseNumericInput(castingInputs.priorOffenses),
      juvenileFelonyCount: parseNumericInput(castingInputs.juvenileFelonyCount),
      juvenileMisdemeanorCount: parseNumericInput(castingInputs.juvenileMisdemeanorCount),
      juvenileOtherCount: parseNumericInput(castingInputs.juvenileOtherCount),
      daysBetweenArrestAndScreening: parseNumericInput(castingInputs.daysBetweenArrestAndScreening),
      daysFromOffenseToScreen: parseNumericInput(castingInputs.daysFromOffenseToScreen),
      jailDurationDays: parseNumericInput(castingInputs.jailDurationDays),
    };

    const missingKeys = Object.entries(parsed)
      .filter(([key, value]) => key !== "sex" && value === null)
      .map(([key]) => key);
    if (!parsed.sex) missingKeys.push("sex");

    if (missingKeys.length > 0) {
      setFormError(`Please fill all required inputs. Missing: ${missingKeys.join(", ")}`);
      return;
    }

    // ── Logical Validations ──────────────────────────────────────────
    if (parsed.age > 90) {
      setFormError("Age cannot exceed 90 years.");
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

    if (parsed.daysBetweenArrestAndScreening < -10000 || parsed.daysBetweenArrestAndScreening > 15000) {
      setFormError("Arrest to screening days must be between -10000 and 15000.");
      return;
    }

    if (parsed.daysFromOffenseToScreen < -10000 || parsed.daysFromOffenseToScreen > 15000) {
      setFormError("Days from offense to screening must be between -10000 and 15000.");
      return;
    }

    setIsPredicting(true);
    setFormError("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("No active session token.");

      const prediction = await runPrediction(token, parsed);
      setResult(prediction);
      await refreshHistory();
    } catch (err) {
      console.error("Prediction fell back to client simulation:", err);
      const fallbackPred = getFallbackPrediction(parsed);
      const entry = {
        id: `${Date.now()}-${Math.random()}`,
        ...parsed,
        ...fallbackPred.summary,
        source: fallbackPred.source,
        createdAt: new Date().toISOString(),
      };

      if (supabase && user?.id) {
        try {
          const { error: dbError } = await supabase.from("prediction_history").insert([{
            user_id: user.id,
            input_payload: parsed,
            output_payload: fallbackPred,
            metadata: { model_used: "fallback_simulation" },
            source: fallbackPred.source,
            outcome: fallbackPred.summary.outcome,
            confidence: fallbackPred.summary.confidence,
          }]);
          if (dbError) setFormError(`DB Error: ${dbError.message}`);
        } catch (e) {
          console.error("Fallback DB save failed:", e);
        }
      }

      setResult(fallbackPred);
      setHistoryItems((prev) => [entry, ...prev].slice(0, 50));
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
          <ProfilePage key="profile" user={user} onLogout={onLogout} />
        )}
      </AnimatePresence>
    </AppShell>
  );
}
