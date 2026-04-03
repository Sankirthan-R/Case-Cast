from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    username: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class PredictInput(BaseModel):
    age: float
    sex: str
    priorOffenses: float
    juvenileFelonyCount: float
    juvenileMisdemeanorCount: float
    juvenileOtherCount: float
    daysBetweenArrestAndScreening: float
    daysFromOffenseToScreen: float
    jailDurationDays: float


class InteractionMetadata(BaseModel):
    model_used: Optional[str] = None
    latency_ms: Optional[int] = None
    tokens: Optional[int] = None


class HistoryQuery(BaseModel):
    page: int = 1
    page_size: int = 20
    model_used: Optional[str] = None
    from_ts: Optional[datetime] = None
    to_ts: Optional[datetime] = None


class HistoryRecord(BaseModel):
    id: str
    user_id: str
    input_payload: Dict[str, Any]
    output_payload: Dict[str, Any]
    metadata: Dict[str, Any]
    source: str
    outcome: str
    confidence: float
    created_at: datetime
