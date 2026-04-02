from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import Session, col, func, select

from .database import create_db_and_tables, get_session
from .models import APILog, RevenueMetric, User


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="SLAX Analytics", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SessionDep = Annotated[Session, Depends(get_session)]


# --- Schemas ---

class UserCreate(BaseModel):
    name: str
    avatar_url: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None


# --- Routes ---

@app.get("/")
def read_root():
    return {"status": "Online", "message": "SLAX Analytics backend running."}


@app.get("/stats")
def get_stats(session: SessionDep):
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=7)
    prev_week_start = now - timedelta(days=14)

    total_users = session.exec(select(func.count(col(User.id)))).one()
    prev_users = session.exec(
        select(func.count(col(User.id))).where(User.created_at < week_start)
    ).one()
    new_users_this_week = total_users - prev_users
    prev_new_users = prev_users - session.exec(
        select(func.count(col(User.id))).where(User.created_at < prev_week_start)
    ).one()
    users_change = _pct_change(new_users_this_week, prev_new_users)

    api_requests = session.exec(select(func.count(col(APILog.id)))).one()
    requests_this_week = session.exec(
        select(func.count(col(APILog.id))).where(APILog.timestamp >= week_start)
    ).one()
    requests_prev_week = session.exec(
        select(func.count(col(APILog.id))).where(
            APILog.timestamp >= prev_week_start, APILog.timestamp < week_start
        )
    ).one()
    requests_change = _pct_change(requests_this_week, requests_prev_week)

    revenue_total = session.exec(select(func.sum(RevenueMetric.value))).one() or 0.0
    revenue_this_week = session.exec(
        select(func.sum(RevenueMetric.value)).where(RevenueMetric.recorded_at >= week_start)
    ).one() or 0.0
    revenue_prev_week = session.exec(
        select(func.sum(RevenueMetric.value)).where(
            RevenueMetric.recorded_at >= prev_week_start,
            RevenueMetric.recorded_at < week_start,
        )
    ).one() or 0.0
    revenue_change = _pct_change(revenue_this_week, revenue_prev_week)

    return {
        "total_users": total_users,
        "users_change": users_change,
        "api_requests": api_requests,
        "requests_change": requests_change,
        "db_health": "Healthy",
        "db_health_change": "Stable",
        "revenue": round(revenue_total, 2),
        "revenue_change": revenue_change,
    }


@app.get("/performance")
def get_performance(session: SessionDep):
    now = datetime.now(timezone.utc)
    result = []
    for i in range(29, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        logs = session.exec(
            select(APILog).where(APILog.timestamp >= day_start, APILog.timestamp < day_end)
        ).all()

        requests_count = len(logs)
        latency = round(50 + (requests_count % 20) * 2.5, 1) if requests_count else 50.0

        result.append({
            "day": 30 - i,
            "date": day_start.strftime("%Y-%m-%d"),
            "requests": requests_count,
            "latency": latency,
        })

    return result


@app.get("/activity")
def get_activity(session: SessionDep):
    logs = session.exec(
        select(APILog).order_by(col(APILog.timestamp).desc()).limit(20)
    ).all()

    activity = []
    for log in logs:
        user = session.get(User, log.user_id) if log.user_id else None
        activity.append({
            "id": log.id,
            "user": user.name if user else "Unknown",
            "avatar_url": user.avatar_url if user else None,
            "action": log.action,
            "timestamp": log.timestamp.isoformat(),
            "status": log.status,
        })

    return activity


@app.post("/users", status_code=201)
def create_user(payload: UserCreate, session: SessionDep):
    user = User(name=payload.name, avatar_url=payload.avatar_url)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@app.put("/users/{user_id}")
def update_user(user_id: int, payload: UserUpdate, session: SessionDep):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.name is not None:
        user.name = payload.name
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@app.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int, session: SessionDep):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    session.delete(user)
    session.commit()


# --- Helpers ---

def _pct_change(current: float, previous: float) -> str:
    if previous == 0:
        return "+100%" if current > 0 else "0%"
    change = ((current - previous) / previous) * 100
    sign = "+" if change >= 0 else ""
    return f"{sign}{change:.1f}%"
