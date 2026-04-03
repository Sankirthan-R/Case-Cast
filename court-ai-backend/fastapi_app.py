from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Dict

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from auth import AuthService, get_bearer_token
from history_service import HistoryService
from model_service import ModelService
from schemas import LoginRequest, PredictInput, SignupRequest
from settings import Settings, load_settings
from supabase_clients import SupabaseClients


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("casecast.api")


class AppState:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.supabase_clients = SupabaseClients(settings)
        self.auth_service = AuthService(self.supabase_clients)
        self.history_service = HistoryService(
            self.supabase_clients,
            table_name=settings.history_table,
            slow_query_ms=settings.slow_query_ms,
        )
        self.model_service = ModelService(artifact_path=settings.artifact_path)

    def boot_model(self) -> None:
        if self.settings.compas_csv_path.exists():
            self.model_service.load_or_train(self.settings.compas_csv_path)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = load_settings()
    state = AppState(settings)
    state.boot_model()
    app.state.state = state
    yield


app = FastAPI(title="CaseCast API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



def get_state() -> AppState:
    return app.state.state

def current_user(
    state: AppState = Depends(get_state),
    token: str = Depends(get_bearer_token),
) -> Dict[str, Any]:
    return state.auth_service.validate_access_token(token)


@app.get("/api/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/signup")
def signup(payload: SignupRequest, state: AppState = Depends(get_state)) -> Dict[str, Any]:
    return state.auth_service.signup(payload.email, payload.password, payload.username)


@app.post("/api/auth/login")
def login(payload: LoginRequest, state: AppState = Depends(get_state)) -> Dict[str, Any]:
    return state.auth_service.login(payload.email, payload.password)


@app.get("/api/auth/me")
def me(user: Dict[str, Any] = Depends(current_user)) -> Dict[str, Any]:
    return {
        "user": {
            "id": user["id"],
            "email": user["email"],
        }
    }


@app.post("/api/predict")
def predict(
    payload: PredictInput,
    background_tasks: BackgroundTasks,
    user: Dict[str, Any] = Depends(current_user),
    state: AppState = Depends(get_state),
) -> Dict[str, Any]:
    started = time.perf_counter()

    try:
        prediction = state.model_service.predict(payload.model_dump())
    except Exception as exc:
        logger.exception("predict.failed")
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    latency_ms = int((time.perf_counter() - started) * 1000)
    metadata = {
        "model_used": prediction.get("conviction", {}).get("bestModel", "unknown"),
        "latency_ms": latency_ms,
        "tokens": 0,
    }

    background_tasks.add_task(
        state.history_service.record_interaction,
        user_id=user["id"],
        input_payload=payload.model_dump(),
        output_payload=prediction,
        metadata=metadata,
        source=prediction.get("source", "model"),
    )

    prediction["metadata"] = metadata
    return prediction


@app.get("/api/history")
def history(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    model_used: str | None = Query(default=None),
    from_ts: datetime | None = Query(default=None),
    to_ts: datetime | None = Query(default=None),
    user: Dict[str, Any] = Depends(current_user),
    state: AppState = Depends(get_state),
) -> Dict[str, Any]:
    try:
        return state.history_service.fetch_history(
            user_id=user["id"],
            page=page,
            page_size=page_size,
            model_used=model_used,
            from_ts=from_ts,
            to_ts=to_ts,
        )
    except Exception as exc:
        logger.exception("history.fetch.failed")
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/model-info")
def model_info(
    user: Dict[str, Any] = Depends(current_user),
    state: AppState = Depends(get_state),
) -> Dict[str, Any]:
    _ = user
    return {"modelInfo": state.model_service.model_info()}
