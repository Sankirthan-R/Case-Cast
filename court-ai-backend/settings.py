from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    compas_csv_path: Path
    artifact_path: Path
    history_table: str
    slow_query_ms: int



def _required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value



def load_settings() -> Settings:
    csv_default = BASE_DIR / "compas-scores-two-years.csv"
    artifact_default = BASE_DIR / "artifacts" / "compas_model_bundle.joblib"

    compas_csv_path = Path(os.getenv("COMPAS_CSV_PATH", str(csv_default))).expanduser().resolve()
    artifact_path = Path(os.getenv("ARTIFACT_PATH", str(artifact_default))).expanduser().resolve()

    return Settings(
        supabase_url=_required_env("SUPABASE_URL"),
        supabase_anon_key=_required_env("SUPABASE_ANON_KEY"),
        supabase_service_role_key=_required_env("SUPABASE_SERVICE_ROLE_KEY"),
        compas_csv_path=compas_csv_path,
        artifact_path=artifact_path,
        history_table=os.getenv("HISTORY_TABLE", "prediction_history").strip() or "prediction_history",
        slow_query_ms=int(os.getenv("SLOW_QUERY_MS", "250")),
    )
