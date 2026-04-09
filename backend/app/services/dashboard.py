from datetime import UTC, datetime, timedelta

from sqlalchemy import and_, case
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
RETURN_ACTION_PATTERN = "Produto % devolvido pelo cliente %"


def _external_action_filter():
    return col(APILog.action).notin_(DASHBOARD_INTERNAL_ACTIONS)


def _purchase_or_return_filter():
    purchase = APILog.action.startswith("Comprou ")
    returns = APILog.action.ilike(RETURN_ACTION_PATTERN)
    return purchase | returns


def _as_day_key(value: object) -> str:
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d")
    return str(value)


def build_stats(session: Session, account_id: int) -> dict:
    now = datetime.now(UTC)
    week_start = now - timedelta(days=7)
    prev_week_start = now - timedelta(days=14)
    rolling_window_start = now - timedelta(days=365)
    aid = account_id

    total_users, new_users_this_week, prev_new_users = session.exec(
        select(
            func.count(col(User.id)),
            func.sum(case((User.created_at >= week_start, 1), else_=0)),
            func.sum(
                case(
                    (
                        and_(
                            User.created_at >= prev_week_start,
                            User.created_at < week_start,
                        ),
                        1,
                    ),
                    else_=0,
                )
            ),
        ).where(User.account_id == aid)
    ).one()
    total_users = int(total_users or 0)
    new_users_this_week = int(new_users_this_week or 0)
    prev_new_users = int(prev_new_users or 0)
    users_change = pct_change(new_users_this_week, prev_new_users)

    purchase_or_return = _purchase_or_return_filter()
    api_requests, requests_this_week, requests_prev_week, returns_count = session.exec(
        select(
            func.sum(case((purchase_or_return, 1), else_=0)),
            func.sum(
                case(
                    (
                        and_(
                            APILog.timestamp >= week_start,
                            purchase_or_return,
                        ),
                        1,
                    ),
                    else_=0,
                )
            ),
            func.sum(
                case(
                    (
                        and_(
                            APILog.timestamp >= prev_week_start,
                            APILog.timestamp < week_start,
                            purchase_or_return,
                        ),
                        1,
                    ),
                    else_=0,
                )
            ),
            func.sum(case((APILog.action.ilike(RETURN_ACTION_PATTERN), 1), else_=0)),
        ).where(APILog.account_id == aid)
    ).one()
    api_requests = int(api_requests or 0)
    requests_this_week = int(requests_this_week or 0)
    requests_prev_week = int(requests_prev_week or 0)
    returns_count = int(returns_count or 0)
    requests_change = pct_change(requests_this_week, requests_prev_week)

    (
        revenue_total,
        loss_total,
        revenue_this_week,
        revenue_prev_week,
        rolling_profit_sum,
    ) = session.exec(
        select(
            func.sum(case((RevenueMetric.value > 0, RevenueMetric.value), else_=0.0)),
            func.sum(case((RevenueMetric.value < 0, RevenueMetric.value), else_=0.0)),
            func.sum(
                case(
                    (
                        and_(
                            RevenueMetric.recorded_at >= week_start,
                            RevenueMetric.value > 0,
                        ),
                        RevenueMetric.value,
                    ),
                    else_=0.0,
                )
            ),
            func.sum(
                case(
                    (
                        and_(
                            RevenueMetric.recorded_at >= prev_week_start,
                            RevenueMetric.recorded_at < week_start,
                            RevenueMetric.value > 0,
                        ),
                        RevenueMetric.value,
                    ),
                    else_=0.0,
                )
            ),
            func.sum(
                case(
                    (
                        and_(
                            RevenueMetric.recorded_at >= rolling_window_start,
                            RevenueMetric.recorded_at < now,
                        ),
                        RevenueMetric.value,
                    ),
                    else_=0.0,
                )
            ),
        ).where(RevenueMetric.account_id == aid)
    ).one()
    revenue_total = float(revenue_total or 0.0)
    loss_total = float(loss_total or 0.0)
    revenue_this_week = float(revenue_this_week or 0.0)
    revenue_prev_week = float(revenue_prev_week or 0.0)
    rolling_profit_sum = float(rolling_profit_sum or 0.0)
    revenue_change = pct_change(revenue_this_week, revenue_prev_week)
    returns_lost_value = loss_total
    profit = revenue_total - abs(loss_total)
    monthly_avg_profit = rolling_profit_sum / 12

    return {
        "total_users": total_users,
        "users_change": users_change,
        "api_requests": api_requests,
        "requests_change": requests_change,
        "revenue": round(revenue_total, 2),
        "revenue_change": revenue_change,
        "returns_count": returns_count,
        "returns_lost_value": round(abs(returns_lost_value), 2),
        "profit": round(profit, 2),
        "monthly_avg_profit": round(monthly_avg_profit, 2),
    }


def build_sparklines(session: Session, account_id: int) -> dict:
    now = datetime.now(UTC)
    aid = account_id
    window_start = (now - timedelta(days=6)).replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )
    window_end = now.replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    ) + timedelta(days=1)
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
        users_series.append({"date": day_key, "value": new_users})

        total_logs = requests_by_day.get(day_key, 0)
        requests_series.append({"date": day_key, "value": total_logs})

        revenue_series.append(
            {"date": day_key, "value": revenue_by_day.get(day_key, 0.0)}
        )

        success_logs = success_by_day.get(day_key, 0)
        health_pct = round(success_logs / total_logs * 100, 1) if total_logs else 100.0
        health_series.append({"date": day_key, "value": health_pct})

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
    window_end = now.replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    ) + timedelta(days=1)
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
    user_ids = {log.user_id for log in logs if log.user_id is not None}
    users_by_id: dict[int, User] = {}
    if user_ids:
        users = session.exec(select(User).where(col(User.id).in_(user_ids))).all()
        users_by_id = {user.id: user for user in users if user.id is not None}

    return {
        "items": [serialize_api_log_row(session, log, users_by_id) for log in logs],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages,
    }
