import math
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import Session, col, func, select

from .auth import authenticate, create_access_token, get_current_account, hash_password, verify_password
from .database import create_db_and_tables, get_session
from .models import Account, APILog, RevenueMetric, User


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
    allow_credentials=True,
)

SessionDep = Annotated[Session, Depends(get_session)]


# --- Schemas ---

class UserCreate(BaseModel):
    name: str
    avatar_url: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
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


CurrentAccount = Annotated[Account, Depends(get_current_account)]


# --- Auth ---


@app.post("/auth/register", status_code=201)
def register(payload: RegisterRequest, session: SessionDep):
    existing = session.exec(select(Account).where(Account.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    account = Account(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    session.add(account)
    session.commit()
    session.refresh(account)
    token = create_access_token(account.id, account.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "account": {
            "id": account.id,
            "email": account.email,
            "name": account.name,
            "avatar_url": account.avatar_url,
        },
    }


@app.post("/auth/login")
def login(payload: LoginRequest, session: SessionDep):
    account = authenticate(payload.email, payload.password, session)
    if not account:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(account.id, account.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "account": {
            "id": account.id,
            "email": account.email,
            "name": account.name,
            "avatar_url": account.avatar_url,
        },
    }


@app.get("/auth/me")
def get_me(account: CurrentAccount):
    return {
        "id": account.id,
        "email": account.email,
        "name": account.name,
        "avatar_url": account.avatar_url,
    }


@app.patch("/auth/me")
def update_me(payload: AccountUpdate, account: CurrentAccount, session: SessionDep):
    if payload.name is not None:
        account.name = payload.name
    if payload.avatar_url is not None:
        account.avatar_url = payload.avatar_url
    session.add(account)
    session.commit()
    session.refresh(account)
    return {
        "id": account.id,
        "email": account.email,
        "name": account.name,
        "avatar_url": account.avatar_url,
    }


@app.post("/auth/change-password", status_code=204)
def change_password(payload: PasswordChange, account: CurrentAccount, session: SessionDep):
    if not verify_password(payload.current_password, account.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    account.hashed_password = hash_password(payload.new_password)
    session.add(account)
    session.commit()


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


@app.get("/stats/sparklines")
def get_stats_sparklines(session: SessionDep):
    now = datetime.now(timezone.utc)
    users_series = []
    requests_series = []
    revenue_series = []
    health_series = []

    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        new_users = session.exec(
            select(func.count(col(User.id))).where(
                User.created_at >= day_start, User.created_at < day_end
            )
        ).one()
        users_series.append({"date": day_start.strftime("%Y-%m-%d"), "value": new_users})

        total_logs = session.exec(
            select(func.count(col(APILog.id))).where(
                APILog.timestamp >= day_start, APILog.timestamp < day_end
            )
        ).one()
        requests_series.append({"date": day_start.strftime("%Y-%m-%d"), "value": total_logs})

        day_revenue = session.exec(
            select(func.sum(RevenueMetric.value)).where(
                RevenueMetric.recorded_at >= day_start,
                RevenueMetric.recorded_at < day_end,
            )
        ).one() or 0.0
        revenue_series.append({"date": day_start.strftime("%Y-%m-%d"), "value": round(day_revenue, 2)})

        success_logs = session.exec(
            select(func.count(col(APILog.id))).where(
                APILog.timestamp >= day_start,
                APILog.timestamp < day_end,
                APILog.status == "Success",
            )
        ).one()
        health_pct = round(success_logs / total_logs * 100, 1) if total_logs else 100.0
        health_series.append({"date": day_start.strftime("%Y-%m-%d"), "value": health_pct})

    return {
        "users": users_series,
        "requests": requests_series,
        "revenue": revenue_series,
        "health": health_series,
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


@app.get("/users")
def list_users(session: SessionDep):
    users = session.exec(select(User).order_by(col(User.created_at).desc())).all()
    return users


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


# --- Reports ---


@app.get("/reports/summary")
def report_summary(
    session: SessionDep,
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
):
    period_start, period_end = _parse_period(start, end)
    period_len = period_end - period_start
    prev_start = period_start - period_len
    prev_end = period_start

    total_requests = session.exec(
        select(func.count(col(APILog.id))).where(
            APILog.timestamp >= period_start, APILog.timestamp < period_end
        )
    ).one()
    prev_requests = session.exec(
        select(func.count(col(APILog.id))).where(
            APILog.timestamp >= prev_start, APILog.timestamp < prev_end
        )
    ).one()

    success_count = session.exec(
        select(func.count(col(APILog.id))).where(
            APILog.timestamp >= period_start,
            APILog.timestamp < period_end,
            APILog.status == "Success",
        )
    ).one()
    prev_success = session.exec(
        select(func.count(col(APILog.id))).where(
            APILog.timestamp >= prev_start,
            APILog.timestamp < prev_end,
            APILog.status == "Success",
        )
    ).one()
    success_rate = round(success_count / total_requests * 100, 1) if total_requests else 0.0
    prev_success_rate = round(prev_success / prev_requests * 100, 1) if prev_requests else 0.0

    total_revenue = session.exec(
        select(func.sum(RevenueMetric.value)).where(
            RevenueMetric.recorded_at >= period_start,
            RevenueMetric.recorded_at < period_end,
        )
    ).one() or 0.0
    prev_revenue = session.exec(
        select(func.sum(RevenueMetric.value)).where(
            RevenueMetric.recorded_at >= prev_start,
            RevenueMetric.recorded_at < prev_end,
        )
    ).one() or 0.0

    active_users = session.exec(
        select(func.count(func.distinct(APILog.user_id))).where(
            APILog.timestamp >= period_start, APILog.timestamp < period_end
        )
    ).one()
    prev_active = session.exec(
        select(func.count(func.distinct(APILog.user_id))).where(
            APILog.timestamp >= prev_start, APILog.timestamp < prev_end
        )
    ).one()

    return {
        "total_requests": total_requests,
        "requests_change": _pct_change(total_requests, prev_requests),
        "success_rate": success_rate,
        "success_rate_change": _pct_change(success_rate, prev_success_rate),
        "total_revenue": round(total_revenue, 2),
        "revenue_change": _pct_change(total_revenue, prev_revenue),
        "active_users": active_users,
        "active_users_change": _pct_change(active_users, prev_active),
    }


@app.get("/reports/status-breakdown")
def report_status_breakdown(
    session: SessionDep,
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
):
    period_start, period_end = _parse_period(start, end)
    rows = session.exec(
        select(APILog.status, func.count(col(APILog.id)))
        .where(APILog.timestamp >= period_start, APILog.timestamp < period_end)
        .group_by(APILog.status)
    ).all()
    return [{"status": status, "count": count} for status, count in rows]


@app.get("/reports/top-actions")
def report_top_actions(
    session: SessionDep,
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
):
    period_start, period_end = _parse_period(start, end)
    rows = session.exec(
        select(APILog.action, func.count(col(APILog.id)))
        .where(APILog.timestamp >= period_start, APILog.timestamp < period_end)
        .group_by(APILog.action)
        .order_by(func.count(col(APILog.id)).desc())
        .limit(10)
    ).all()
    return [{"action": action, "count": count} for action, count in rows]


@app.get("/reports/top-users")
def report_top_users(
    session: SessionDep,
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
):
    period_start, period_end = _parse_period(start, end)
    rows = session.exec(
        select(APILog.user_id, func.count(col(APILog.id)))
        .where(
            APILog.timestamp >= period_start,
            APILog.timestamp < period_end,
            col(APILog.user_id).is_not(None),
        )
        .group_by(col(APILog.user_id))
        .order_by(func.count(col(APILog.id)).desc())
        .limit(10)
    ).all()

    result = []
    for user_id, count in rows:
        user = session.get(User, user_id)
        result.append({
            "user_id": user_id,
            "name": user.name if user else "Unknown",
            "avatar_url": user.avatar_url if user else None,
            "count": count,
        })
    return result


@app.get("/reports/revenue-trend")
def report_revenue_trend(
    session: SessionDep,
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
):
    period_start, period_end = _parse_period(start, end)
    metrics = session.exec(
        select(RevenueMetric)
        .where(
            RevenueMetric.recorded_at >= period_start,
            RevenueMetric.recorded_at < period_end,
        )
        .order_by(col(RevenueMetric.recorded_at))
    ).all()

    buckets: dict[str, float] = {}
    for m in metrics:
        day_key = m.recorded_at.strftime("%Y-%m-%d")
        buckets[day_key] = buckets.get(day_key, 0.0) + m.value

    return [{"date": d, "value": round(v, 2)} for d, v in buckets.items()]


@app.get("/reports/logs")
def report_logs(
    session: SessionDep,
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    period_start, period_end = _parse_period(start, end)
    base = select(APILog).where(
        APILog.timestamp >= period_start, APILog.timestamp < period_end
    )
    count_q = select(func.count(col(APILog.id))).where(
        APILog.timestamp >= period_start, APILog.timestamp < period_end
    )

    if status:
        base = base.where(APILog.status == status)
        count_q = count_q.where(APILog.status == status)
    if action:
        base = base.where(APILog.action == action)
        count_q = count_q.where(APILog.action == action)
    if user_id is not None:
        base = base.where(APILog.user_id == user_id)
        count_q = count_q.where(APILog.user_id == user_id)

    total = session.exec(count_q).one()
    pages = max(1, math.ceil(total / per_page))

    logs = session.exec(
        base.order_by(col(APILog.timestamp).desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    ).all()

    items = []
    for log in logs:
        user = session.get(User, log.user_id) if log.user_id else None
        items.append({
            "id": log.id,
            "user": user.name if user else "Unknown",
            "avatar_url": user.avatar_url if user else None,
            "action": log.action,
            "timestamp": log.timestamp.isoformat(),
            "status": log.status,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages,
    }


# --- Helpers ---


def _parse_period(
    start: Optional[str], end: Optional[str]
) -> tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)
    if end:
        period_end = datetime.fromisoformat(end).replace(tzinfo=timezone.utc)
    else:
        period_end = now
    if start:
        period_start = datetime.fromisoformat(start).replace(tzinfo=timezone.utc)
    else:
        period_start = period_end - timedelta(days=30)
    return period_start, period_end


def _pct_change(current: float, previous: float) -> str:
    if previous == 0:
        return "+100%" if current > 0 else "0%"
    change = ((current - previous) / previous) * 100
    sign = "+" if change >= 0 else ""
    return f"{sign}{change:.1f}%"
