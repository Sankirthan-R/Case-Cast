from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Literal, Optional, Union

from pydantic import BaseModel, EmailStr, Field


class RoleEnum(str, Enum):
    Citizen = "Citizen"
    Lawyer = "Lawyer"
    Judge = "Judge"
    Researcher = "Researcher"


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: Optional[str] = None
    username: Optional[str] = None  # backward compatibility alias
    role: RoleEnum = RoleEnum.Citizen


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[RoleEnum] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=6)
    new_password: str = Field(min_length=8)


class PredictInput(BaseModel):
    age: int = Field(..., ge=18, le=100, description="Defendant age in years (18 to 100, matches cases.age CHECK)")
    sex: Literal["M", "F"] = Field(..., description="Biological sex ('M' or 'F')")
    priorOffenses: int = Field(..., ge=0, le=100, description="Total prior offenses count (0 to 100)")
    juvenileFelonyCount: int = Field(0, ge=0, le=50, description="Juvenile felony offenses count (0 to 50)")
    juvenileMisdemeanorCount: int = Field(0, ge=0, le=50, description="Juvenile misdemeanor offenses count (0 to 50)")
    juvenileOtherCount: int = Field(0, ge=0, le=50, description="Juvenile other offenses count (0 to 50)")
    daysBetweenArrestAndScreening: int = Field(..., ge=-2000, le=2000, description="Days between arrest and screening")
    daysFromOffenseToScreen: int = Field(..., ge=-2000, le=2000, description="Days from offense to screening")
    jailDurationDays: int = Field(..., ge=0, le=36500, description="Jail custody duration in days (0 to 36500)")


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
    id: Union[int, str]
    user_id: Union[int, str]
    input_payload: Dict[str, Any]
    output_payload: Dict[str, Any]
    metadata: Dict[str, Any]
    source: str
    outcome: str
    confidence: float
    created_at: datetime


class SessionItem(BaseModel):
    session_id: str
    issued_at: str
    revoked_at: Optional[str] = None
    user_agent: Optional[str] = None
    is_current: bool
    is_active: bool
