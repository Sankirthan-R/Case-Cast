from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import (
    GradientBoostingClassifier,
    GradientBoostingRegressor,
    RandomForestClassifier,
    RandomForestRegressor,
)
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    mean_absolute_error,
    precision_score,
    r2_score,
    recall_score,
)
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier


BASE_FEATURES = [
    "age",
    "sex_enc",
    "priors_count",
    "juv_fel_count",
    "juv_misd_count",
    "juv_other_count",
    "days_b_screening_arrest",
    "c_days_from_compas",
    "jail_duration",
]
DECILE_FEATURES = BASE_FEATURES + ["decile_score", "v_decile_score"]
EXT_FEATURES = DECILE_FEATURES + ["charge_degree"]

TARGET_CONVICTION = "Convicted / Not Convicted"
TARGET_CHARGE = "Bailable / Non-Bailable (B/NB)"
TARGET_RECID = "Recidivism (2-Year)"


@dataclass
class ArtifactBundle:
    scaler_base: StandardScaler
    scaler_decile: StandardScaler
    scaler_ext: StandardScaler
    decile_model: Any
    violent_decile_model: Any
    trained_models: Dict[str, Any]
    model_info: Dict[str, Any]


class ModelService:
    def __init__(self, artifact_path: Path) -> None:
        self.artifact_path = artifact_path
        self.bundle: ArtifactBundle | None = None

    def load_or_train(self, csv_path: Path) -> Dict[str, Any]:
        if self.artifact_path.exists():
            payload = joblib.load(self.artifact_path)
            self.bundle = ArtifactBundle(**payload)
            return self.bundle.model_info

        model_info = self.train(csv_path)
        return model_info

    def train(self, csv_path: Path) -> Dict[str, Any]:
        if not csv_path.exists():
            raise FileNotFoundError(f"CSV not found: {csv_path}")

        df = pd.read_csv(csv_path)
        prepared = self._prepare_dataframe(df)

        x_base = prepared[BASE_FEATURES].values
        x_decile = prepared[DECILE_FEATURES].values
        x_ext = prepared[EXT_FEATURES].values

        scaler_base = StandardScaler().fit(x_base)
        scaler_decile = StandardScaler().fit(x_decile)
        scaler_ext = StandardScaler().fit(x_ext)

        x_base_sc = scaler_base.transform(x_base)
        x_decile_sc = scaler_decile.transform(x_decile)
        x_ext_sc = scaler_ext.transform(x_ext)

        decile_model, decile_metrics, decile_log_rows = self._train_best_regressor(
            x_base_sc,
            prepared["decile_score"].values,
        )
        violent_decile_model, violent_decile_metrics, violent_decile_log_rows = self._train_best_regressor(
            x_base_sc,
            prepared["v_decile_score"].values,
        )

        targets = {
            TARGET_CONVICTION: (prepared["convicted_proxy"].values, x_decile_sc),
            TARGET_CHARGE: (prepared["charge_degree"].values, x_decile_sc),
            TARGET_RECID: (prepared["two_year_recid"].values, x_ext_sc),
        }

        trained_models: Dict[str, Any] = {}
        best_summary: Dict[str, Any] = {}
        classifier_logs: Dict[str, List[Dict[str, Any]]] = {}
        for target_name, (y, x_sc) in targets.items():
            best_model, summary, model_rows = self._train_best_classifier(x_sc, y)
            trained_models[target_name] = best_model
            key = self._summary_key(target_name)
            best_summary[key] = summary
            classifier_logs[key] = model_rows

        model_info = {
            "decileRegressor": decile_metrics,
            "violentDecileRegressor": violent_decile_metrics,
            "bestSummary": best_summary,
            "trainingLogs": {
                "decileRegressors": decile_log_rows,
                "violentDecileRegressors": violent_decile_log_rows,
                "classifiers": classifier_logs,
            },
        }

        self.bundle = ArtifactBundle(
            scaler_base=scaler_base,
            scaler_decile=scaler_decile,
            scaler_ext=scaler_ext,
            decile_model=decile_model,
            violent_decile_model=violent_decile_model,
            trained_models=trained_models,
            model_info=model_info,
        )

        self.artifact_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.bundle.__dict__, self.artifact_path)
        return model_info

    def predict(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        if not self.bundle:
            raise RuntimeError("Model bundle not loaded")

        base_input = self._parse_payload(payload)

        base_scaled = self.bundle.scaler_base.transform(base_input)
        pred_dec = float(np.clip(self.bundle.decile_model.predict(base_scaled)[0], 1, 10))
        pred_vdec = float(np.clip(self.bundle.violent_decile_model.predict(base_scaled)[0], 1, 10))

        decile_input = np.append(base_input, [[pred_dec, pred_vdec]], axis=1)
        decile_scaled = self.bundle.scaler_decile.transform(decile_input)

        conv_model = self.bundle.trained_models[TARGET_CONVICTION]
        bnb_model = self.bundle.trained_models[TARGET_CHARGE]
        recid_model = self.bundle.trained_models[TARGET_RECID]

        prob_conv = conv_model.predict_proba(decile_scaled)[0]
        pred_conv = int(prob_conv[1] >= 0.5)

        prob_bnb = bnb_model.predict_proba(decile_scaled)[0]
        pred_bnb = int(prob_bnb[1] >= 0.5)

        ext_input = np.append(decile_input, [[pred_bnb]], axis=1)
        ext_scaled = self.bundle.scaler_ext.transform(ext_input)
        prob_recid = recid_model.predict_proba(ext_scaled)[0]
        pred_recid = int(prob_recid[1] >= 0.5)

        recid_risk = float(prob_recid[1] * 100)
        if recid_risk >= 67:
            outcome = "High Risk"
        elif recid_risk >= 45:
            outcome = "Moderate Risk"
        else:
            outcome = "Low Risk"

        return {
            "summary": {
                "outcome": outcome,
                "confidence": round(max(prob_conv[1], prob_bnb[1], prob_recid[1]) * 100, 1),
            },
            "autoComputedRiskScores": {
                "decileScore": int(round(pred_dec)),
                "decileScoreRaw": round(pred_dec, 2),
                "violentDecileScore": int(round(pred_vdec)),
                "violentDecileScoreRaw": round(pred_vdec, 2),
            },
            "conviction": {
                "prediction": "CONVICTED" if pred_conv == 1 else "NOT CONVICTED / CHARGE DROPPED",
                "pConvicted": round(prob_conv[1] * 100, 1),
                "pNotConvicted": round(prob_conv[0] * 100, 1),
                "bestModel": self.bundle.model_info["bestSummary"]["conviction"]["model"],
            },
            "chargeSeverity": {
                "prediction": "NON-BAILABLE (NB)" if pred_bnb == 1 else "BAILABLE (B)",
                "pNonBailable": round(prob_bnb[1] * 100, 1),
                "pBailable": round(prob_bnb[0] * 100, 1),
                "bestModel": self.bundle.model_info["bestSummary"]["chargeSeverity"]["model"],
            },
            "recidivism": {
                "prediction": "LIKELY TO REOFFEND" if pred_recid == 1 else "UNLIKELY TO REOFFEND",
                "pWillReoffend": round(prob_recid[1] * 100, 1),
                "pWillNotReoffend": round(prob_recid[0] * 100, 1),
                "bestModel": self.bundle.model_info["bestSummary"]["recidivism"]["model"],
            },
            "modelInfo": self.bundle.model_info,
        }

    def model_info(self) -> Dict[str, Any]:
        if not self.bundle:
            raise RuntimeError("Model bundle not loaded")
        return self.bundle.model_info

    def training_logs(self) -> Dict[str, Any]:
        if not self.bundle:
            raise RuntimeError("Model bundle not loaded")
        return self.bundle.model_info.get("trainingLogs", {})

    @staticmethod
    def _prepare_dataframe(df: pd.DataFrame) -> pd.DataFrame:
        frame = df.copy()
        needed = EXT_FEATURES + ["convicted_proxy", "two_year_recid"]

        # Support already-preprocessed CSV files that contain model-input columns directly.
        if all(col in frame.columns for col in needed):
            prepared = frame[needed].dropna()
            prepared = prepared[prepared["age"] >= 18].copy()
            return prepared

        frame["c_jail_in_dt"] = pd.to_datetime(frame["c_jail_in"], errors="coerce")
        frame["c_jail_out_dt"] = pd.to_datetime(frame["c_jail_out"], errors="coerce")
        frame["jail_duration"] = (frame["c_jail_out_dt"] - frame["c_jail_in_dt"]).dt.days
        frame["sex_enc"] = (frame["sex"] == "Male").astype(int)

        no_charge = frame["c_charge_desc"].str.lower().str.contains("no charge", na=False)
        frame["convicted_proxy"] = (~no_charge).astype(int)
        frame["charge_degree"] = (frame["c_charge_degree"] == "F").astype(int)

        prepared = frame[needed].dropna()
        prepared = prepared[prepared["age"] >= 18].copy()
        return prepared

    @staticmethod
    def _regressors() -> Dict[str, Any]:
        return {
            "Random Forest Regressor": RandomForestRegressor(
                n_estimators=400,
                max_depth=12,
                min_samples_leaf=10,
                n_jobs=-1,
                random_state=42,
            ),
            "GradientBoosting Regressor": GradientBoostingRegressor(
                n_estimators=400,
                max_depth=5,
                learning_rate=0.04,
                subsample=0.8,
                min_samples_leaf=10,
                random_state=42,
            ),
        }

    @staticmethod
    def _classifiers() -> Dict[str, Any]:
        return {
            "Logistic Regression": LogisticRegression(
                max_iter=2000,
                C=1.0,
                solver="lbfgs",
                class_weight="balanced",
                random_state=42,
            ),
            "Decision Tree": DecisionTreeClassifier(
                max_depth=8,
                min_samples_leaf=20,
                class_weight="balanced",
                random_state=42,
            ),
            "Random Forest": RandomForestClassifier(
                n_estimators=400,
                max_depth=12,
                min_samples_leaf=10,
                class_weight="balanced",
                n_jobs=-1,
                random_state=42,
            ),
            "XGBoost (GBM)": GradientBoostingClassifier(
                n_estimators=400,
                max_depth=5,
                learning_rate=0.04,
                subsample=0.8,
                min_samples_leaf=10,
                random_state=42,
            ),
        }

    def _train_best_regressor(self, x_sc: np.ndarray, y: np.ndarray) -> Tuple[Any, Dict[str, Any], List[Dict[str, Any]]]:
        x_tr, x_te, y_tr, y_te = train_test_split(x_sc, y, test_size=0.2, random_state=42)

        best_mae = float("inf")
        best_name = ""
        best_model = None
        best_r2 = 0.0
        rows: List[Dict[str, Any]] = []

        for name, model in self._regressors().items():
            model.fit(x_tr, y_tr)
            pred = model.predict(x_te)
            mae = mean_absolute_error(y_te, pred)
            r2 = r2_score(y_te, pred)
            pred_rounded = np.clip(np.round(pred).astype(int), 1, 10)
            plus_minus_one = float((np.abs(pred_rounded - y_te) <= 1).mean() * 100)
            rows.append(
                {
                    "model": name,
                    "mae": round(float(mae), 3),
                    "r2": round(float(r2), 3),
                    "plusMinusOneAcc": round(plus_minus_one, 1),
                }
            )
            if mae < best_mae:
                best_mae = mae
                best_name = name
                best_r2 = r2
                best_model = model

        if best_model is None:
            raise RuntimeError("No regressor could be trained")

        best_model.fit(x_sc, y)
        return (
            best_model,
            {
                "name": best_name,
                "mae": round(float(best_mae), 3),
                "r2": round(float(best_r2), 3),
            },
            rows,
        )

    def _train_best_classifier(self, x_sc: np.ndarray, y: np.ndarray) -> Tuple[Any, Dict[str, Any], List[Dict[str, Any]]]:
        x_tr, x_te, y_tr, y_te = train_test_split(
            x_sc,
            y,
            test_size=0.2,
            random_state=42,
            stratify=y,
        )

        best_model = None
        best_name = ""
        best_f1 = -1.0
        best_metrics: Dict[str, float] = {}
        rows: List[Dict[str, Any]] = []

        for name, model in self._classifiers().items():
            model.fit(x_tr, y_tr)
            pred = model.predict(x_te)

            current_metrics = {
                "accuracy": round(float(accuracy_score(y_te, pred) * 100), 2),
                "precision": round(float(precision_score(y_te, pred, zero_division=0) * 100), 2),
                "recall": round(float(recall_score(y_te, pred, zero_division=0) * 100), 2),
                "f1": round(float(f1_score(y_te, pred, zero_division=0) * 100), 2),
            }

            cv = cross_validate(
                self._classifiers()[name],
                x_sc,
                y,
                cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42),
                scoring=["accuracy", "f1"],
            )
            current_metrics["cvAccuracy"] = round(float(cv["test_accuracy"].mean() * 100), 2)
            current_metrics["cvF1"] = round(float(cv["test_f1"].mean() * 100), 2)

            rows.append(
                {
                    "model": name,
                    "accuracy": current_metrics["accuracy"],
                    "precision": current_metrics["precision"],
                    "recall": current_metrics["recall"],
                    "f1": current_metrics["f1"],
                    "cvAccuracy": current_metrics["cvAccuracy"],
                    "cvF1": current_metrics["cvF1"],
                }
            )

            if current_metrics["f1"] > best_f1:
                best_f1 = current_metrics["f1"]
                best_model = model
                best_name = name
                best_metrics = current_metrics

        if best_model is None:
            raise RuntimeError("No classifier could be trained")

        best_model.fit(x_sc, y)
        summary = {
            "model": best_name,
            **best_metrics,
        }
        return best_model, summary, rows

    @staticmethod
    def _summary_key(target_name: str) -> str:
        mapping = {
            TARGET_CONVICTION: "conviction",
            TARGET_CHARGE: "chargeSeverity",
            TARGET_RECID: "recidivism",
        }
        return mapping[target_name]

    @staticmethod
    def _parse_payload(payload: Dict[str, Any]) -> np.ndarray:
        sex_raw = str(payload.get("sex", "")).strip().upper()
        if sex_raw not in {"M", "F"}:
            raise ValueError("sex must be M or F")

        values = [
            float(payload["age"]),
            float(1 if sex_raw == "M" else 0),
            float(payload["priorOffenses"]),
            float(payload["juvenileFelonyCount"]),
            float(payload["juvenileMisdemeanorCount"]),
            float(payload["juvenileOtherCount"]),
            float(payload["daysBetweenArrestAndScreening"]),
            float(payload["daysFromOffenseToScreen"]),
            float(payload["jailDurationDays"]),
        ]
        return np.array([values], dtype=float)
