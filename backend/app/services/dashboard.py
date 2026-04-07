from datetime import UTC, datetime, timedelta

from sqlmodel import Session, col, func, select

from ..models import APILog, RevenueMetric, User
from ..utils import pct_change
from .log_items import serialize_api_log_row

# Agregações SQL e montagem de dados para o dashboard (stats, sparklines, performance,
# atividade).

DASHBOARD_INTERNAL_ACTIONS = {
    "GET /stats",
    "GET /stats/sparklines",
    "GET /performance",
    "GET /activity",
    "GET /auth/me",
}


def _external_action_filter():
    return col(APILog.action).notin_(DASHBOARD_INTERNAL_ACTIONS)


def _as_day_key(value: object) -> str:
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d")
    return str(value)


def build_stats(session: Session, account_id: int) -> dict:
    now = datetime.now(UTC)
    week_start = now - timedelta(days=7)
    prev_week_start = now - timedelta(days=14)
    aid = account_id

    total_users = session.exec(
        select(func.count(col(User.id))).where(User.account_id == aid)
    ).one()
    prev_users = session.exec(
        select(func.count(col(User.id))).where(
            User.account_id == aid, User.created_at < week_start
        )
    ).one()
    new_users_this_week = total_users - prev_users
    prev_new_users = (
        prev_users
        - session.exec(
            select(func.count(col(User.id))).where(
                User.account_id == aid, User.created_at < prev_week_start
            )
        ).one()
    )
    users_change = pct_change(new_users_this_week, prev_new_users)

    api_requests = session.exec(
        select(func.count(col(APILog.id))).where(
            APILog.account_id == aid, _external_action_filter()
        )
    ).one()
    requests_this_week = session.exec(
        select(func.count(col(APILog.id))).where(
            APILog.account_id == aid,
            APILog.timestamp >= week_start,
            _external_action_filter(),
        )
    ).one()
    requests_prev_week = session.exec(
        select(func.count(col(APILog.id))).where(
            APILog.account_id == aid,
            APILog.timestamp >= prev_week_start,
            APILog.timestamp < week_start,
            _external_action_filter(),
        )
    ).one()
    requests_change = pct_change(requests_this_week, requests_prev_week)

    revenue_total = (
        session.exec(
            select(func.sum(RevenueMetric.value)).where(RevenueMetric.account_id == aid)
        ).one()
        or 0.0
    )
    revenue_this_week = (
        session.exec(
            select(func.sum(RevenueMetric.value)).where(
                RevenueMetric.account_id == aid, RevenueMetric.recorded_at >= week_start
            )
        ).one()
        or 0.0
    )
    revenue_prev_week = (
        session.exec(
            select(func.sum(RevenueMetric.value)).where(
                RevenueMetric.account_id == aid,
                RevenueMetric.recorded_at >= prev_week_start,
                RevenueMetric.recorded_at < week_start,
            )
        ).one()
        or 0.0
    )
    revenue_change = pct_change(revenue_this_week, revenue_prev_week)

    returns_count = session.exec(
        select(func.count(col(APILog.id))).where(
            APILog.account_id == aid,
            APILog.action.ilike("Produto % devolvido pelo cliente %"),
        )
    ).one()
    returns_lost_value = (
        session.exec(
            select(func.sum(RevenueMetric.value)).where(
                RevenueMetric.account_id == aid,
                RevenueMetric.value < 0,
            )
        ).one()
        or 0.0
    )

    return {
        "total_users": total_users,
        "users_change": users_change,
        "api_requests": api_requests,
        "requests_change": requests_change,
        "revenue": round(revenue_total, 2),
        "revenue_change": revenue_change,
        "returns_count": returns_count,
        "returns_lost_value": round(abs(returns_lost_value), 2),
    }


def build_sparklines(session: Session, account_id: int) -> dict:
    now = datetime.now(UTC)
    aid = account_id
    window_start = (now - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
    window_end = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    users_series: list[dict] = []
    requests_series: list[dict] = []
    revenue_series: list[dict] = []
    health_series: list[dict] = []

    users_by_day = {
        _as_day_key(day): count
        for day, count in session.exec(
            select(func.date(User.created_at), func.count(col(User.id)))
            .where(
                User.account_id == aid,
                User.created_at >= window_start,
                User.created_at < window_end,
            )
            .group_by(func.date(User.created_at))
        ).all()
    }
    requests_by_day = {
        _as_day_key(day): count
        for day, count in session.exec(
            select(func.date(APILog.timestamp), func.count(col(APILog.id)))
            .where(
                APILog.account_id == aid,
                APILog.timestamp >= window_start,
                APILog.timestamp < window_end,
            )
            .group_by(func.date(APILog.timestamp))
        ).all()
    }
    success_by_day = {
        _as_day_key(day): count
        for day, count in session.exec(
            select(func.date(APILog.timestamp), func.count(col(APILog.id)))
            .where(
                APILog.account_id == aid,
                APILog.timestamp >= window_start,
                APILog.timestamp < window_end,
                APILog.status == "Success",
            )
            .group_by(func.date(APILog.timestamp))
        ).all()
    }
    revenue_by_day = {
        _as_day_key(day): round(total or 0.0, 2)
        for day, total in session.exec(
            select(func.date(RevenueMetric.recorded_at), func.sum(RevenueMetric.value))
            .where(
                RevenueMetric.account_id == aid,
                RevenueMetric.recorded_at >= window_start,
                RevenueMetric.recorded_at < window_end,
            )
            .group_by(func.date(RevenueMetric.recorded_at))
        ).all()
    }

    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        day_key = day_start.strftime("%Y-%m-%d")

        new_users = users_by_day.get(day_key, 0)
        users_series.append(
            {"date": day_key, "value": new_users}
        )

        total_logs = requests_by_day.get(day_key, 0)
        requests_series.append(
            {"date": day_key, "value": total_logs}
        )

        revenue_series.append(
            {"date": day_key, "value": revenue_by_day.get(day_key, 0.0)}
        )

        success_logs = success_by_day.get(day_key, 0)
        health_pct = round(success_logs / total_logs * 100, 1) if total_logs else 100.0
        health_series.append(
            {"date": day_key, "value": health_pct}
        )

    return {
        "users": users_series,
        "requests": requests_series,
        "revenue": revenue_series,
        "health": health_series,
    }


def build_performance_series(session: Session, account_id: int) -> list[dict]:
    now = datetime.now(UTC)
    aid = account_id
    window_start = (now - timedelta(days=29)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    window_end = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    requests_by_day = {
        _as_day_key(day): count
        for day, count in session.exec(
            select(func.date(APILog.timestamp), func.count(col(APILog.id)))
            .where(
                APILog.account_id == aid,
                APILog.timestamp >= window_start,
                APILog.timestamp < window_end,
            )
            .group_by(func.date(APILog.timestamp))
        ).all()
    }
    result = []
    for i in range(29, -1, -1):
        day_start = (now - timedelta(days=i)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        day_key = day_start.strftime("%Y-%m-%d")
        requests_count = requests_by_day.get(day_key, 0)
        latency = round(50 + (requests_count % 20) * 2.5, 1) if requests_count else 50.0

        result.append(
            {
                "day": 30 - i,
                "date": day_key,
                "requests": requests_count,
                "latency": latency,
            }
        )

    return result


def build_activity_feed_paginated(
    session: Session,
    account_id: int,
    page: int = 1,
    per_page: int = 20,
) -> dict:
    total = session.exec(
        select(func.count(col(APILog.id))).where(APILog.account_id == account_id)
    ).one()
    pages = max(1, (total + per_page - 1) // per_page)
    page = min(page, pages)

    logs = session.exec(
        select(APILog)
        .where(APILog.account_id == account_id)
        .order_by(col(APILog.timestamp).desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    ).all()

    return {
        "items": [serialize_api_log_row(session, log) for log in logs],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages,
    }
