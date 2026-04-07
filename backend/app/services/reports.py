import math
import re
from collections import Counter
from datetime import timedelta

from sqlmodel import Session, col, func, select

from ..models import APILog, RevenueMetric, User
from ..utils import parse_period, pct_change
from .log_items import serialize_api_log_row

# Consultas e agregações para relatórios (resumo, breakdowns, tendências e logs
# paginados).

_LEGACY_PURCHASE_RE = re.compile(
    r"^POST /users \(purchase: (?P<product>.+?) - \$\d+(?:\.\d{1,2})?\)$"
)


def _extract_purchased_product(action: str) -> str | None:
    if action.startswith("Comprou "):
        product = action.removeprefix("Comprou ").strip()
        return product or None

    legacy_match = _LEGACY_PURCHASE_RE.match(action)
    if legacy_match:
        product = legacy_match.group("product").strip()
        return product or None

    return None


def build_report_summary(
    session: Session,
    account_id: int,
    start: str | None,
    end: str | None,
) -> dict:
    period_start, period_end = parse_period(start, end)
    period_len = period_end - period_start
    prev_start = period_start - period_len
    prev_end = period_start
    aid = account_id

    total_requests = session.exec(
        select(func.count(col(APILog.id))).where(
            APILog.account_id == aid,
            APILog.timestamp >= period_start,
            APILog.timestamp < period_end,
        )
    ).one()
    prev_requests = session.exec(
        select(func.count(col(APILog.id))).where(
            APILog.account_id == aid,
            APILog.timestamp >= prev_start,
            APILog.timestamp < prev_end,
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
    success_rate = (
        round(success_count / total_requests * 100, 1) if total_requests else 0.0
    )
    prev_success_rate = (
        round(prev_success / prev_requests * 100, 1) if prev_requests else 0.0
    )

    total_revenue = (
        session.exec(
            select(func.sum(RevenueMetric.value)).where(
                RevenueMetric.account_id == aid,
                RevenueMetric.recorded_at >= period_start,
                RevenueMetric.recorded_at < period_end,
                RevenueMetric.value > 0,
            )
        ).one()
        or 0.0
    )
    loss_value = (
        session.exec(
            select(func.sum(RevenueMetric.value)).where(
                RevenueMetric.account_id == aid,
                RevenueMetric.recorded_at >= period_start,
                RevenueMetric.recorded_at < period_end,
                RevenueMetric.value < 0,
            )
        ).one()
        or 0.0
    )
    prev_revenue = (
        session.exec(
            select(func.sum(RevenueMetric.value)).where(
                RevenueMetric.account_id == aid,
                RevenueMetric.recorded_at >= prev_start,
                RevenueMetric.recorded_at < prev_end,
                RevenueMetric.value > 0,
            )
        ).one()
        or 0.0
    )

    active_users = session.exec(
        select(func.count(func.distinct(APILog.user_id))).where(
            APILog.account_id == aid,
            APILog.timestamp >= period_start,
            APILog.timestamp < period_end,
        )
    ).one()
    prev_active = session.exec(
        select(func.count(func.distinct(APILog.user_id))).where(
            APILog.account_id == aid,
            APILog.timestamp >= prev_start,
            APILog.timestamp < prev_end,
        )
    ).one()
    returns_count = session.exec(
        select(func.count(col(APILog.id))).where(
            APILog.account_id == aid,
            APILog.timestamp >= period_start,
            APILog.timestamp < period_end,
            APILog.action.ilike("Produto % devolvido pelo cliente %"),
        )
    ).one()
    returns_lost_value = loss_value
    profit = total_revenue - abs(loss_value)
    rolling_window_start = period_end - timedelta(days=365)
    rolling_profit_sum = (
        session.exec(
            select(func.sum(RevenueMetric.value)).where(
                RevenueMetric.account_id == aid,
                RevenueMetric.recorded_at >= rolling_window_start,
                RevenueMetric.recorded_at < period_end,
            )
        ).one()
        or 0.0
    )
    monthly_avg_profit = rolling_profit_sum / 12

    return {
        "total_requests": total_requests,
        "requests_change": pct_change(total_requests, prev_requests),
        "success_rate": success_rate,
        "success_rate_change": pct_change(success_rate, prev_success_rate),
        "total_revenue": round(total_revenue, 2),
        "revenue_change": pct_change(total_revenue, prev_revenue),
        "active_users": active_users,
        "active_users_change": pct_change(active_users, prev_active),
        "returns_count": returns_count,
        "returns_lost_value": round(abs(returns_lost_value), 2),
        "profit": round(profit, 2),
        "monthly_avg_profit": round(monthly_avg_profit, 2),
    }


def build_status_breakdown(
    session: Session,
    account_id: int,
    start: str | None,
    end: str | None,
) -> list[dict]:
    period_start, period_end = parse_period(start, end)
    sales_count = session.exec(
        select(func.count(col(APILog.id))).where(
            APILog.account_id == account_id,
            APILog.timestamp >= period_start,
            APILog.timestamp < period_end,
            APILog.action.startswith("Comprou "),
        )
    ).one()
    returns_count = session.exec(
        select(func.count(col(APILog.id))).where(
            APILog.account_id == account_id,
            APILog.timestamp >= period_start,
            APILog.timestamp < period_end,
            APILog.action.ilike("Produto % devolvido pelo cliente %"),
        )
    ).one()
    return [
        {"status": "Vendas Realizadas", "count": sales_count},
        {"status": "Devoluções", "count": returns_count},
    ]


def build_top_actions(
    session: Session,
    account_id: int,
    start: str | None,
    end: str | None,
) -> list[dict]:
    period_start, period_end = parse_period(start, end)
    logs = session.exec(
        select(APILog).where(
            APILog.account_id == account_id,
            APILog.timestamp >= period_start,
            APILog.timestamp < period_end,
        )
    ).all()

    sold_products = [
        product
        for log in logs
        if (product := _extract_purchased_product(log.action)) is not None
    ]
    counts = Counter(sold_products)
    top_products = sorted(counts.items(), key=lambda item: (-item[1], item[0]))[:10]
    return [{"action": product, "count": count} for product, count in top_products]


def build_top_users(
    session: Session,
    account_id: int,
    start: str | None,
    end: str | None,
) -> list[dict]:
    period_start, period_end = parse_period(start, end)
    rows = session.exec(
        select(
            APILog.user_id,
            func.count(col(APILog.id)),
            User.name,
            User.avatar_url,
        )
        .select_from(APILog)
        .join(User, User.id == APILog.user_id, isouter=True)
        .where(
            APILog.account_id == account_id,
            APILog.timestamp >= period_start,
            APILog.timestamp < period_end,
            col(APILog.user_id).is_not(None),
        )
        .group_by(APILog.user_id, User.name, User.avatar_url)
        .order_by(func.count(col(APILog.id)).desc())
        .limit(10)
    ).all()

    return [
        {
            "user_id": user_id,
            "name": name if name else "Unknown",
            "avatar_url": avatar_url,
            "count": count,
        }
        for user_id, count, name, avatar_url in rows
    ]


def build_revenue_trend(
    session: Session,
    account_id: int,
    start: str | None,
    end: str | None,
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


_RETURN_ACTION_PATTERN = "Produto % devolvido pelo cliente %"


def build_logs_paginated(
    session: Session,
    account_id: int,
    start: str | None,
    end: str | None,
    status: str | None,
    action: str | None,
    user_id: int | None,
    page: int,
    per_page: int,
    transaction_kind: str | None = None,
) -> dict:
    period_start, period_end = parse_period(start, end)
    aid = account_id
    base = select(APILog).where(
        APILog.account_id == aid,
        APILog.timestamp >= period_start,
        APILog.timestamp < period_end,
    )
    count_q = select(func.count(col(APILog.id))).where(
        APILog.account_id == aid,
        APILog.timestamp >= period_start,
        APILog.timestamp < period_end,
    )

    if transaction_kind == "completed":
        purchase = APILog.action.startswith("Comprou ")
        base = base.where(purchase)
        count_q = count_q.where(purchase)
    elif transaction_kind == "return":
        ret = APILog.action.ilike(_RETURN_ACTION_PATTERN)
        base = base.where(ret)
        count_q = count_q.where(ret)
    elif status:
        base = base.where(APILog.status == status)
        count_q = count_q.where(APILog.status == status)
    if action:
        like_expr = f"%{action}%"
        base = base.where(APILog.action.ilike(like_expr))
        count_q = count_q.where(APILog.action.ilike(like_expr))
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

    user_ids = {log.user_id for log in logs if log.user_id is not None}
    users_by_id: dict[int, User] = {}
    if user_ids:
        users = session.exec(select(User).where(col(User.id).in_(user_ids))).all()
        users_by_id = {user.id: user for user in users}

    items = [serialize_api_log_row(session, log, users_by_id) for log in logs]

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages,
    }
