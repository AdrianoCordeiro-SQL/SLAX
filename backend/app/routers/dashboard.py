from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session, col, func, select

from ..auth import get_current_account
from ..database import get_session
from ..models import Account, APILog, RevenueMetric, User
from ..schemas import (
    ActivityItem,
    HealthResponse,
    PerformancePoint,
    SparklineResponse,
    StatsResponse,
)
from ..utils import pct_change

router = APIRouter(tags=["dashboard"])

SessionDep = Annotated[Session, Depends(get_session)]
CurrentAccount = Annotated[Account, Depends(get_current_account)]


@router.get("/", response_model=HealthResponse, tags=["health"])
def read_root():
    return {"status": "Online", "message": "SLAX Analytics backend running."}


@router.get("/stats", response_model=StatsResponse)
def get_stats(session: SessionDep, account: CurrentAccount):
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=7)
    prev_week_start = now - timedelta(days=14)
    aid = account.id

    total_users = session.exec(
        select(func.count(col(User.id))).where(User.account_id == aid)
    ).one()
    prev_users = session.exec(
        select(func.count(col(User.id))).where(User.account_id == aid, User.created_at < week_start)
    ).one()
    new_users_this_week = total_users - prev_users
    prev_new_users = prev_users - session.exec(
        select(func.count(col(User.id))).where(User.account_id == aid, User.created_at < prev_week_start)
    ).one()
    users_change = pct_change(new_users_this_week, prev_new_users)

    api_requests = session.exec(
        select(func.count(col(APILog.id))).where(APILog.account_id == aid)
    ).one()
    requests_this_week = session.exec(
        select(func.count(col(APILog.id))).where(APILog.account_id == aid, APILog.timestamp >= week_start)
    ).one()
    requests_prev_week = session.exec(
        select(func.count(col(APILog.id))).where(
            APILog.account_id == aid, APILog.timestamp >= prev_week_start, APILog.timestamp < week_start
        )
    ).one()
    requests_change = pct_change(requests_this_week, requests_prev_week)

    revenue_total = session.exec(
        select(func.sum(RevenueMetric.value)).where(RevenueMetric.account_id == aid)
    ).one() or 0.0
    revenue_this_week = session.exec(
        select(func.sum(RevenueMetric.value)).where(
            RevenueMetric.account_id == aid, RevenueMetric.recorded_at >= week_start
        )
    ).one() or 0.0
    revenue_prev_week = session.exec(
        select(func.sum(RevenueMetric.value)).where(
            RevenueMetric.account_id == aid,
            RevenueMetric.recorded_at >= prev_week_start,
            RevenueMetric.recorded_at < week_start,
        )
    ).one() or 0.0
    revenue_change = pct_change(revenue_this_week, revenue_prev_week)

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


@router.get("/stats/sparklines", response_model=SparklineResponse)
def get_stats_sparklines(session: SessionDep, account: CurrentAccount):
    now = datetime.now(timezone.utc)
    aid = account.id
    users_series: list[dict] = []
    requests_series: list[dict] = []
    revenue_series: list[dict] = []
    health_series: list[dict] = []

    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        new_users = session.exec(
            select(func.count(col(User.id))).where(
                User.account_id == aid, User.created_at >= day_start, User.created_at < day_end
            )
        ).one()
        users_series.append({"date": day_start.strftime("%Y-%m-%d"), "value": new_users})

        total_logs = session.exec(
            select(func.count(col(APILog.id))).where(
                APILog.account_id == aid, APILog.timestamp >= day_start, APILog.timestamp < day_end
            )
        ).one()
        requests_series.append({"date": day_start.strftime("%Y-%m-%d"), "value": total_logs})

        day_revenue = session.exec(
            select(func.sum(RevenueMetric.value)).where(
                RevenueMetric.account_id == aid,
                RevenueMetric.recorded_at >= day_start,
                RevenueMetric.recorded_at < day_end,
            )
        ).one() or 0.0
        revenue_series.append({"date": day_start.strftime("%Y-%m-%d"), "value": round(day_revenue, 2)})

        success_logs = session.exec(
            select(func.count(col(APILog.id))).where(
                APILog.account_id == aid,
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


@router.get("/performance", response_model=list[PerformancePoint])
def get_performance(session: SessionDep, account: CurrentAccount):
    now = datetime.now(timezone.utc)
    aid = account.id
    result = []
    for i in range(29, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        logs = session.exec(
            select(APILog).where(
                APILog.account_id == aid, APILog.timestamp >= day_start, APILog.timestamp < day_end
            )
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


@router.get("/activity", response_model=list[ActivityItem])
def get_activity(session: SessionDep, account: CurrentAccount):
    logs = session.exec(
        select(APILog)
        .where(APILog.account_id == account.id)
        .order_by(col(APILog.timestamp).desc())
        .limit(20)
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
