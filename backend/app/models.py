from datetime import UTC, datetime

from sqlmodel import Field, SQLModel

# Modelos ORM (conta, usuários do tenant, logs de API e métricas de receita).


class Account(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    name: str
    avatar_url: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="account.id", index=True)
    name: str
    last_name: str | None = None
    email: str | None = None
    avatar_url: str | None = None
    product: str | None = None
    product_value: float | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class APILog(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="account.id", index=True)
    user_id: int | None = Field(default=None, foreign_key="user.id")
    action: str
    status: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))


class RevenueMetric(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="account.id", index=True)
    user_id: int | None = Field(default=None, foreign_key="user.id", index=True)
    value: float
    recorded_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class AlertRule(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="account.id", index=True)
    rule_type: str = Field(index=True)
    params_json: str = Field(default="{}")
    enabled: bool = Field(default=True)
    cooldown_hours: int = Field(default=24)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class AlertFiring(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="account.id", index=True)
    rule_id: int = Field(foreign_key="alertrule.id", index=True)
    fired_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    message: str
    snapshot_json: str = Field(default="{}")
    notified: bool = Field(default=False)
