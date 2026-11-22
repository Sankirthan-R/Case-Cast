from __future__ import annotations

import time
import traceback
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from auth import (
    create_access_token,
    decode_access_token,
    get_bearer_token,
    hash_password,
    verify_password,
)
from db import get_engine, init_engine
from history_service import HistoryService, derive_outcome_and_confidence
from model_service import ModelService
from schemas import (
    HistoryQuery,
    LoginRequest,
    PasswordChange,
    PredictInput,
    ProfileUpdate,
    RoleEnum,
    SignupRequest,
)
from settings import Settings, get_settings


class AppState:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.engine = init_engine(settings)
        self.history_service = HistoryService(
            self.engine,
            slow_query_ms=settings.slow_query_ms,
        )
        self.model_service = ModelService(artifact_path=settings.artifact_path)

    def boot_model(self) -> None:
        if self.settings.artifact_path.exists():
            self.model_service.load_or_train(self.settings.compas_csv_path)
            print(f"[MODEL] Bundle successfully loaded from {self.settings.artifact_path}")
        elif self.settings.compas_csv_path.exists():
            print(f"[MODEL] Artifact not found at {self.settings.artifact_path}. Training on {self.settings.compas_csv_path}...")
            self.model_service.load_or_train(self.settings.compas_csv_path)
            print("[MODEL] Training complete and bundle saved.")
        else:
            print(f"[MODEL WARNING] Neither artifact nor CSV found at {self.settings.artifact_path} or {self.settings.compas_csv_path}")


state: Optional[AppState] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global state
    settings = get_settings()
    state = AppState(settings)
    state.boot_model()
    yield


app = FastAPI(
    title="CaseCast Core AI Service",
    lifespan=lifespan,
    description="Explainable legal AI risk assessment service backed by MySQL 8.4 and JWT auth.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_current_user(token: str = Depends(get_bearer_token)) -> Dict[str, Any]:
    global state
    if not state:
        raise HTTPException(status_code=500, detail="Application state not initialized")
    claims = decode_access_token(token, state.settings.jwt_secret)
    user_id = int(claims.get("user_id") or claims.get("sub"))
    return {"id": user_id, "email": claims.get("email")}


@app.get("/api/health")
async def health_check():
    global state
    if not state:
        return {"status": "starting"}
    try:
        with state.engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as exc:
        return {"status": "degraded", "database_error": str(exc)}


@app.post("/api/auth/signup", status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest):
    global state
    if not state:
        raise HTTPException(status_code=500, detail="State not ready")

    with state.engine.connect() as conn:
        existing = conn.execute(
            text("SELECT user_id FROM users WHERE email = :email"),
            {"email": payload.email.lower().strip()},
        ).fetchone()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

    full_name = (payload.full_name or payload.username or payload.email.split("@")[0]).strip()
    role_val = payload.role.value if isinstance(payload.role, RoleEnum) else str(payload.role)
    pwd_hash = hash_password(payload.password)

    with state.engine.begin() as conn:
        res = conn.execute(
            text("""
                INSERT INTO users (full_name, email, password_hash, role)
                VALUES (:full_name, :email, :password_hash, :role)
            """),
            {
                "full_name": full_name,
                "email": payload.email.lower().strip(),
                "password_hash": pwd_hash,
                "role": role_val,
            },
        )
        user_id = res.lastrowid

    token = create_access_token(
        user_id=user_id,
        email=payload.email.lower().strip(),
        secret=state.settings.jwt_secret,
        expire_hours=state.settings.jwt_expire_hours,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": state.settings.jwt_expire_hours * 3600,
        "user": {
            "id": user_id,
            "email": payload.email.lower().strip(),
            "full_name": full_name,
            "role": role_val,
            "phone": None,
            "address": None,
            "created_at": datetime.utcnow().isoformat(),
        },
    }


@app.post("/api/auth/login")
async def login(payload: LoginRequest):
    global state
    if not state:
        raise HTTPException(status_code=500, detail="State not ready")

    with state.engine.connect() as conn:
        user = conn.execute(
            text("""
                SELECT user_id, full_name, email, password_hash, role, phone, address, created_at
                FROM users WHERE email = :email
            """),
            {"email": payload.email.lower().strip()},
        ).fetchone()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(
        user_id=user.user_id,
        email=user.email,
        secret=state.settings.jwt_secret,
        expire_hours=state.settings.jwt_expire_hours,
    )

    created_at_val = user.created_at.isoformat() if isinstance(user.created_at, datetime) else str(user.created_at)

    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": state.settings.jwt_expire_hours * 3600,
        "user": {
            "id": user.user_id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "phone": user.phone,
            "address": user.address,
            "created_at": created_at_val,
        },
    }


@app.get("/api/users/me")
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    global state
    with state.engine.connect() as conn:
        user = conn.execute(
            text("""
                SELECT user_id, full_name, email, role, phone, address, created_at
                FROM users WHERE user_id = :uid
            """),
            {"uid": current_user["id"]},
        ).fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    created_at_val = user.created_at.isoformat() if isinstance(user.created_at, datetime) else str(user.created_at)

    return {
        "id": user.user_id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "phone": user.phone,
        "address": user.address,
        "created_at": created_at_val,
    }


@app.put("/api/users/me")
async def update_me(
    payload: ProfileUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    global state
    updates = {}
    if payload.full_name is not None:
        updates["full_name"] = payload.full_name.strip()
    if payload.role is not None:
        updates["role"] = payload.role.value if isinstance(payload.role, RoleEnum) else str(payload.role)
    if payload.phone is not None:
        updates["phone"] = payload.phone.strip()
    if payload.address is not None:
        updates["address"] = payload.address.strip()

    if updates:
        set_clause = ", ".join(f"{k} = :{k}" for k in updates.keys())
        params = dict(updates)
        params["uid"] = current_user["id"]
        with state.engine.begin() as conn:
            conn.execute(text(f"UPDATE users SET {set_clause} WHERE user_id = :uid"), params)

    return await get_me(current_user)


@app.delete("/api/users/me")
async def delete_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    global state
    with state.engine.begin() as conn:
        conn.execute(
            text("DELETE FROM users WHERE user_id = :uid"),
            {"uid": current_user["id"]},
        )
    return {"detail": "User deleted successfully"}


@app.put("/api/users/me/password")
async def change_password(
    payload: PasswordChange,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    global state
    with state.engine.connect() as conn:
        user = conn.execute(
            text("SELECT password_hash FROM users WHERE user_id = :uid"),
            {"uid": current_user["id"]},
        ).fetchone()

    if not user or not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    new_hash = hash_password(payload.new_password)
    with state.engine.begin() as conn:
        conn.execute(
            text("UPDATE users SET password_hash = :hash WHERE user_id = :uid"),
            {"hash": new_hash, "uid": current_user["id"]},
        )
    return {"detail": "Password updated successfully"}


@app.post("/api/predict")
async def predict_endpoint(
    payload: PredictInput,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    global state
    if not state or not state.model_service.bundle:
        raise HTTPException(status_code=500, detail="Model service unavailable")

    t0 = time.monotonic()
    prediction = state.model_service.predict(payload.model_dump())
    latency_ms = int((time.monotonic() - t0) * 1000)

    # Compute summary outcome and confidence using the single shared function
    recid_prob_val = float(prediction.get("recidivism", {}).get("pWillReoffend", 0.0)) / 100.0
    outcome, confidence = derive_outcome_and_confidence(recid_prob_val)
    prediction["summary"]["outcome"] = outcome
    prediction["summary"]["confidence"] = confidence

    # Atomically save case + 3 predictions. If failed, raise 500 (never return unstored prediction)
    try:
        case_id = state.history_service.save_prediction(
            user_id=current_user["id"],
            input_payload=payload.model_dump(),
            prediction=prediction,
            latency_ms=latency_ms,
        )
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save prediction record to database",
        ) from exc

    response_data = dict(prediction)
    response_data["caseId"] = case_id
    return response_data


@app.get("/api/history")
async def list_history(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    global state
    return state.history_service.fetch_history(
        user_id=current_user["id"],
        page=page,
        page_size=page_size,
    )


@app.get("/api/history/{case_id}")
async def get_history_case(
    case_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    global state
    case = state.history_service.get_case(case_id, current_user["id"])
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@app.delete("/api/history/{case_id}")
async def delete_history_case(
    case_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    global state
    res = state.history_service.delete_case(case_id, current_user["id"])
    if res == "not_found":
        raise HTTPException(status_code=404, detail="Case not found")
    elif res == "forbidden":
        raise HTTPException(status_code=403, detail="Forbidden")
    return {"detail": "Case deleted successfully"}


@app.get("/api/analytics/summary")
async def analytics_summary(current_user: Dict[str, Any] = Depends(get_current_user)):
    global state
    uid = current_user["id"]

    # 1. Stored procedure call
    raw_conn = state.engine.raw_connection()
    user_summary = {"total_cases": 0, "avg_recid_risk": 0.0, "last_prediction": None}
    try:
        cursor = raw_conn.cursor()
        cursor.callproc("sp_user_summary", [uid])
        row = cursor.fetchone()
        if row:
            total_cases = row[0] or 0
            avg_risk = float(row[1]) if row[1] is not None else 0.0
            last_pred = row[2].isoformat() if isinstance(row[2], datetime) else str(row[2]) if row[2] else None
            user_summary = {
                "total_cases": total_cases,
                "avg_recid_risk": round(avg_risk, 3),
                "last_prediction": last_pred,
            }
        cursor.close()
    finally:
        raw_conn.close()

    # 2. Recidivism by age band & 3. Task latency
    with state.engine.connect() as conn:
        age_band_rows = conn.execute(
            text("""
                SELECT CASE WHEN c.age < 25 THEN '<25' WHEN c.age < 40 THEN '25-39' ELSE '40+' END AS band,
                       ROUND(AVG(p.probability), 3) AS avg_risk,
                       COUNT(*) AS n
                FROM cases c JOIN predictions p USING (case_id)
                WHERE p.task = 'recidivism'
                GROUP BY band
            """)
        ).fetchall()

        latency_rows = conn.execute(
            text("""
                SELECT task,
                       ROUND(AVG(latency_ms), 1) AS avg_ms,
                       MAX(latency_ms) AS max_ms
                FROM predictions
                GROUP BY task
            """)
        ).fetchall()

    return {
        "user_summary": user_summary,
        "recidivism_by_age_band": [
            {"band": r.band, "avg_risk": float(r.avg_risk or 0.0), "count": int(r.n)}
            for r in age_band_rows
        ],
        "latency_by_task": [
            {"task": r.task, "avg_ms": float(r.avg_ms or 0.0), "max_ms": int(r.max_ms or 0)}
            for r in latency_rows
        ],
    }


@app.get("/api/model-info")
async def model_info():
    global state
    if not state or not state.model_service.bundle:
        return {"status": "starting"}
    return {"modelInfo": state.model_service.model_info()}
