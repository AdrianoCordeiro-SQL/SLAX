from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    avatar_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class APILog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    action: str
    status: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class RevenueMetric(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    value: float
    recorded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
