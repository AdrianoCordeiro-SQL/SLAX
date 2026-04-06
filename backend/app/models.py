from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel

# Modelos ORM (conta, usuários do tenant, logs de API e métricas de receita).


class Account(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    name: str
    avatar_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="account.id", index=True)
    name: str
    last_name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    product: Optional[str] = None
    product_value: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class APILog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="account.id", index=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    action: str
    status: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class RevenueMetric(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="account.id", index=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", index=True)
    value: float
    recorded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AlertRule(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="account.id", index=True)
    rule_type: str = Field(index=True)
    params_json: str = Field(default="{}")
    enabled: bool = Field(default=True)
    cooldown_hours: int = Field(default=24)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AlertFiring(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="account.id", index=True)
    rule_id: int = Field(foreign_key="alertrule.id", index=True)
    fired_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    message: str
    snapshot_json: str = Field(default="{}")
    notified: bool = Field(default=False)
