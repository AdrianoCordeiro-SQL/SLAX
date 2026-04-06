from datetime import datetime, timedelta, timezone

from sqlmodel import Session, col, func, select

from ..models import APILog, RevenueMetric, User
from ..utils import pct_change
from .log_items import serialize_api_log_row

# Agregações SQL e montagem de dados para o dashboard (stats, sparklines, performance, atividade).


def build_stats(session: Session, account_id: int) -> dict:
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=7)
    prev_week_start = now - timedelta(days=14)
    aid = account_id

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
        "revenue": round(revenue_total, 2),
        "revenue_change": revenue_change,
    }


def build_sparklines(session: Session, account_id: int) -> dict:
    now = datetime.now(timezone.utc)
    aid = account_id
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


def build_performance_series(session: Session, account_id: int) -> list[dict]:
    now = datetime.now(timezone.utc)
    aid = account_id
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


def build_activity_feed(session: Session, account_id: int, limit: int = 20) -> list[dict]:
    logs = session.exec(
        select(APILog)
        .where(APILog.account_id == account_id)
        .order_by(col(APILog.timestamp).desc())
        .limit(limit)
    ).all()

    return [serialize_api_log_row(session, log) for log in logs]
