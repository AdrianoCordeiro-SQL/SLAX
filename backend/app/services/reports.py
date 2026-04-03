import math
from typing import Optional

from sqlmodel import Session, col, func, select

from ..models import APILog, RevenueMetric, User
from ..utils import parse_period, pct_change
from .log_items import serialize_api_log_row


def build_report_summary(
    session: Session,
    account_id: int,
    start: Optional[str],
    end: Optional[str],
) -> dict:
    period_start, period_end = parse_period(start, end)
    period_len = period_end - period_start
    prev_start = period_start - period_len
    prev_end = period_start
    aid = account_id

    total_requests = session.exec(
        select(func.count(col(APILog.id))).where(
            APILog.account_id == aid, APILog.timestamp >= period_start, APILog.timestamp < period_end
        )
    ).one()
    prev_requests = session.exec(
        select(func.count(col(APILog.id))).where(
            APILog.account_id == aid, APILog.timestamp >= prev_start, APILog.timestamp < prev_end
        )
    ).one()

    success_count = session.exec(
        select(func.count(col(APILog.id))).where(
            APILog.account_id == aid,
            APILog.timestamp >= period_start,
            APILog.timestamp < period_end,
            APILog.status == "Success",
        )
    ).one()
    prev_success = session.exec(
        select(func.count(col(APILog.id))).where(
            APILog.account_id == aid,
            APILog.timestamp >= prev_start,
            APILog.timestamp < prev_end,
            APILog.status == "Success",
        )
    ).one()
    success_rate = round(success_count / total_requests * 100, 1) if total_requests else 0.0
    prev_success_rate = round(prev_success / prev_requests * 100, 1) if prev_requests else 0.0

    total_revenue = session.exec(
        select(func.sum(RevenueMetric.value)).where(
            RevenueMetric.account_id == aid,
            RevenueMetric.recorded_at >= period_start,
            RevenueMetric.recorded_at < period_end,
        )
    ).one() or 0.0
    prev_revenue = session.exec(
        select(func.sum(RevenueMetric.value)).where(
            RevenueMetric.account_id == aid,
            RevenueMetric.recorded_at >= prev_start,
            RevenueMetric.recorded_at < prev_end,
        )
    ).one() or 0.0

    active_users = session.exec(
        select(func.count(func.distinct(APILog.user_id))).where(
            APILog.account_id == aid, APILog.timestamp >= period_start, APILog.timestamp < period_end
        )
    ).one()
    prev_active = session.exec(
        select(func.count(func.distinct(APILog.user_id))).where(
            APILog.account_id == aid, APILog.timestamp >= prev_start, APILog.timestamp < prev_end
        )
    ).one()

    return {
        "total_requests": total_requests,
        "requests_change": pct_change(total_requests, prev_requests),
        "success_rate": success_rate,
        "success_rate_change": pct_change(success_rate, prev_success_rate),
        "total_revenue": round(total_revenue, 2),
        "revenue_change": pct_change(total_revenue, prev_revenue),
        "active_users": active_users,
        "active_users_change": pct_change(active_users, prev_active),
    }


def build_status_breakdown(
    session: Session,
    account_id: int,
    start: Optional[str],
    end: Optional[str],
) -> list[dict]:
    period_start, period_end = parse_period(start, end)
    rows = session.exec(
        select(APILog.status, func.count(col(APILog.id)))
        .where(APILog.account_id == account_id, APILog.timestamp >= period_start, APILog.timestamp < period_end)
        .group_by(APILog.status)
    ).all()
    return [{"status": status, "count": count} for status, count in rows]


def build_top_actions(
    session: Session,
    account_id: int,
    start: Optional[str],
    end: Optional[str],
) -> list[dict]:
    period_start, period_end = parse_period(start, end)
    rows = session.exec(
        select(APILog.action, func.count(col(APILog.id)))
        .where(APILog.account_id == account_id, APILog.timestamp >= period_start, APILog.timestamp < period_end)
        .group_by(APILog.action)
        .order_by(func.count(col(APILog.id)).desc())
        .limit(10)
    ).all()
    return [{"action": action, "count": count} for action, count in rows]


def build_top_users(
    session: Session,
    account_id: int,
    start: Optional[str],
    end: Optional[str],
) -> list[dict]:
    period_start, period_end = parse_period(start, end)
    rows = session.exec(
        select(APILog.user_id, func.count(col(APILog.id)))
        .where(
            APILog.account_id == account_id,
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


def build_revenue_trend(
    session: Session,
    account_id: int,
    start: Optional[str],
    end: Optional[str],
) -> list[dict]:
    period_start, period_end = parse_period(start, end)
    metrics = session.exec(
        select(RevenueMetric)
        .where(
            RevenueMetric.account_id == account_id,
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


def build_logs_paginated(
    session: Session,
    account_id: int,
    start: Optional[str],
    end: Optional[str],
    status: Optional[str],
    action: Optional[str],
    user_id: Optional[int],
    page: int,
    per_page: int,
) -> dict:
    period_start, period_end = parse_period(start, end)
    aid = account_id
    base = select(APILog).where(
        APILog.account_id == aid, APILog.timestamp >= period_start, APILog.timestamp < period_end
    )
    count_q = select(func.count(col(APILog.id))).where(
        APILog.account_id == aid, APILog.timestamp >= period_start, APILog.timestamp < period_end
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

    items = [serialize_api_log_row(session, log) for log in logs]

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages,
    }
