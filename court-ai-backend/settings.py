from dataclasses import dataclass
from pathlib import Path
import os
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def _resolve_artifact_path() -> Path:
    env_val = os.getenv("ARTIFACT_PATH")
    if not env_val:
        return (BASE_DIR / "artifacts" / "compas_model_bundle.joblib").resolve()
    p = Path(env_val)
    if not p.is_absolute():
        p = (BASE_DIR / p).resolve()
    if p.is_dir():
        return (p / "compas_model_bundle.joblib").resolve()
    return p


def _resolve_csv_path() -> Path:
    env_val = os.getenv("COMPAS_CSV_PATH")
    if not env_val:
        return (BASE_DIR / "compas-scores-two-years.csv").resolve()
    p = Path(env_val)
    if not p.is_absolute():
        p = (BASE_DIR / p).resolve()
    return p


@dataclass(frozen=True)
class Settings:
    db_host: str = os.getenv("DB_HOST", "127.0.0.1")
    db_port: int = int(os.getenv("DB_PORT", "3306"))
    db_name: str = os.getenv("DB_NAME", "casecast")
    db_user: str = os.getenv("DB_USER", "casecast_app")
    db_password: str = os.getenv("DB_PASSWORD", "")
    jwt_secret: str = os.getenv("JWT_SECRET", "casecast-insecure-secret-key-change-in-prod")
    jwt_expire_hours: int = int(os.getenv("JWT_EXPIRE_HOURS", "12"))
    compas_csv_path: Path = _resolve_csv_path()
    artifact_path: Path = _resolve_artifact_path()
    slow_query_ms: int = int(os.getenv("SLOW_QUERY_MS", "250"))


def get_settings() -> Settings:
    return Settings()
