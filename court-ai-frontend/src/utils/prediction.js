// ─── Shared Prediction Utilities ─────────────────────────────────────────────

export const initialCastingInputs = {
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

export const fallbackModelInfo = {
  decileRegressor: { name: "GradientBoosting Regressor", mae: 1.615 },
  violentDecileRegressor: { name: "Random Forest Regressor", mae: 1.214 },
  bestSummary: {
    conviction: { model: "XGBoost (GBM)", accuracy: 84.66, f1: 91.42, precision: 86.98, recall: 96.33, cvAccuracy: 84.73, cvF1: 91.49 },
    chargeSeverity: { model: "XGBoost (GBM)", accuracy: 68.23, f1: 78.34, precision: 70.58, recall: 88.03, cvAccuracy: 67.41, cvF1: 77.9 },
    recidivism: { model: "Random Forest", accuracy: 69.83, f1: 68.48, precision: 66.23, recall: 70.89, cvAccuracy: 69.0, cvF1: 66.56 },
  },
  trainingLogs: null,
};

export const parseNumericInput = (value) =>
  value === "" ? null : Number.isFinite(Number(value)) ? Number(value) : null;

export const getFallbackPrediction = (features) => {
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

  return {
    summary: { outcome, confidence },
    conviction: {
      prediction: convProb >= 50 ? "CONVICTED" : "NOT CONVICTED / DROPPED",
      pConvicted: Number(convProb.toFixed(1)),
      pNotConvicted: Number((100 - convProb).toFixed(1)),
      bestModel: "XGBoost (GBM)",
    },
    chargeSeverity: {
      prediction: nbProb >= 50 ? "NON-BAILABLE (NB)" : "BAILABLE (B)",
      pNonBailable: Number(nbProb.toFixed(1)),
      pBailable: Number((100 - nbProb).toFixed(1)),
      bestModel: "XGBoost (GBM)",
    },
    recidivism: {
      prediction: recidProb >= 50 ? "LIKELY TO REOFFEND" : "UNLIKELY TO REOFFEND",
      pWillReoffend: Number(recidProb.toFixed(1)),
      pWillNotReoffend: Number((100 - recidProb).toFixed(1)),
      bestModel: "Random Forest",
    },
    modelInfo: fallbackModelInfo,
    source: "fallback",
  };
};
