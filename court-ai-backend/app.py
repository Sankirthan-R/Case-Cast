from __future__ import annotations

import os
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS

from model_service import ModelService


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_CSV_PATH = BASE_DIR / "compas-scores-two-years.csv"
ARTIFACT_PATH = BASE_DIR / "artifacts" / "compas_model_bundle.joblib"

app = Flask(__name__)
CORS(app)

service = ModelService(artifact_path=ARTIFACT_PATH)


def _resolve_csv_path() -> Path:
    configured = os.getenv("COMPAS_CSV_PATH", "").strip()
    if configured:
        return Path(configured).expanduser().resolve()
    return DEFAULT_CSV_PATH


@app.get("/api/health")
def health() -> tuple:
    return jsonify({"status": "ok"}), 200


@app.post("/api/train")
def train() -> tuple:
    body = request.get_json(silent=True) or {}
    csv_path_raw = str(body.get("csvPath") or _resolve_csv_path())
    csv_path = Path(csv_path_raw).expanduser().resolve()

    try:
        info = service.train(csv_path)
        return jsonify({"message": "Model trained successfully", "modelInfo": info}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@app.get("/api/model-info")
def model_info() -> tuple:
    try:
        info = service.model_info()
        return jsonify({"modelInfo": info}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@app.get("/api/training-logs")
def training_logs() -> tuple:
    try:
        logs = service.training_logs()
        return jsonify({"trainingLogs": logs}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@app.post("/api/predict")
def predict() -> tuple:
    payload = request.get_json(silent=True) or {}
    try:
        prediction = service.predict(payload)
        return jsonify(prediction), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


def boot_model() -> None:
    csv_path = _resolve_csv_path()
    if csv_path.exists():
        service.load_or_train(csv_path)


if __name__ == "__main__":
    boot_model()
    app.run(host="127.0.0.1", port=8000, debug=True)
