from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict

# Modelos Pydantic de entrada e saída (corpos de requisição e respostas JSON da API).


# --- Request Schemas ---


class UserCreate(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    seed_demo_activity: bool = False
    demo_volume: Literal["light", "medium", "heavy"] = "medium"


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
    created_at: datetime


class HealthResponse(BaseModel):
    status: str
    message: str


class StatsResponse(BaseModel):
    total_users: int
    users_change: str
    api_requests: int
    requests_change: str
    db_health: str
    db_health_change: str
    revenue: float
    revenue_change: str


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
