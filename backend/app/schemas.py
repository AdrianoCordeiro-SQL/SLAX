from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

# Modelos Pydantic de entrada e saída (corpos de requisição e respostas JSON da API).


# --- Request Schemas ---


class UserCreate(BaseModel):
    first_name: str
    product: str
    value: float = Field(gt=0)
    generate_platform_activity: bool = False
    last_name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


# --- Response Schemas ---


class AccountOut(BaseModel):
    id: int
    email: str
    name: str
    avatar_url: Optional[str] = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    account: AccountOut


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    account_id: int
    name: str
    last_name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    product: Optional[str] = None
    product_value: Optional[float] = None
    created_at: datetime


class HealthResponse(BaseModel):
    status: str
    message: str


class StatsResponse(BaseModel):
    total_users: int
    users_change: str
    api_requests: int
    requests_change: str
    revenue: float
    revenue_change: str
    returns_count: int
    returns_lost_value: float


class SparklinePoint(BaseModel):
    date: str
    value: float


class SparklineResponse(BaseModel):
    users: list[SparklinePoint]
    requests: list[SparklinePoint]
    revenue: list[SparklinePoint]
    health: list[SparklinePoint]


class PerformancePoint(BaseModel):
    day: int
    date: str
    requests: int
    latency: float


class ActivityItem(BaseModel):
    id: int
    user: str
    avatar_url: Optional[str] = None
    action: str
    timestamp: str
    status: str


class ReportSummaryResponse(BaseModel):
    total_requests: int
    requests_change: str
    success_rate: float
    success_rate_change: str
    total_revenue: float
    revenue_change: str
    active_users: int
    active_users_change: str
    returns_count: int
    returns_lost_value: float


class StatusBreakdownItem(BaseModel):
    status: str
    count: int


class TopActionItem(BaseModel):
    action: str
    count: int


class TopUserItem(BaseModel):
    user_id: int
    name: str
    avatar_url: Optional[str] = None
    count: int


class RevenueTrendPoint(BaseModel):
    date: str
    value: float


class LogItem(BaseModel):
    id: int
    user: str
    avatar_url: Optional[str] = None
    action: str
    timestamp: str
    status: str


class LogsResponse(BaseModel):
    items: list[LogItem]
    total: int
    page: int
    per_page: int
    pages: int


# --- Alertas operacionais ---


class AlertRuleCreate(BaseModel):
    rule_type: str
    params: dict[str, Any] = Field(default_factory=dict)
    enabled: bool = True
    cooldown_hours: int = Field(default=24, ge=1, le=168)


class AlertRuleUpdate(BaseModel):
    rule_type: Optional[str] = None
    params: Optional[dict[str, Any]] = None
    enabled: Optional[bool] = None
    cooldown_hours: Optional[int] = Field(default=None, ge=1, le=168)


class AlertRuleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    account_id: int
    rule_type: str
    params: dict[str, Any]
    enabled: bool
    cooldown_hours: int
    created_at: datetime
    updated_at: datetime


class AlertEvaluateItem(BaseModel):
    rule_id: int
    firing_id: int
    message: str


class AlertEvaluateResponse(BaseModel):
    fired: list[AlertEvaluateItem]


class AlertFiringOut(BaseModel):
    id: int
    rule_id: int
    fired_at: str
    message: str
    snapshot: dict[str, Any]
    notified: bool


class AlertFiringsResponse(BaseModel):
    items: list[AlertFiringOut]
    total: int
    page: int
    per_page: int
    pages: int
