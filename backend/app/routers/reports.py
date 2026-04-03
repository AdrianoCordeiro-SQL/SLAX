import math
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, col, func, select

from ..auth import get_current_account
from ..database import get_session
from ..models import Account, APILog, RevenueMetric, User
from ..schemas import (
    LogsResponse,
    ReportSummaryResponse,
    RevenueTrendPoint,
    StatusBreakdownItem,
    TopActionItem,
    TopUserItem,
)
from ..utils import parse_period, pct_change

router = APIRouter(prefix="/reports", tags=["reports"])

SessionDep = Annotated[Session, Depends(get_session)]
CurrentAccount = Annotated[Account, Depends(get_current_account)]


@router.get("/summary", response_model=ReportSummaryResponse)
def report_summary(
    session: SessionDep,
    account: CurrentAccount,
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
):
    period_start, period_end = parse_period(start, end)
    period_len = period_end - period_start
    prev_start = period_start - period_len
    prev_end = period_start
    aid = account.id

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


@router.get("/status-breakdown", response_model=list[StatusBreakdownItem])
def report_status_breakdown(
    session: SessionDep,
    account: CurrentAccount,
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
):
    period_start, period_end = parse_period(start, end)
    rows = session.exec(
        select(APILog.status, func.count(col(APILog.id)))
        .where(APILog.account_id == account.id, APILog.timestamp >= period_start, APILog.timestamp < period_end)
        .group_by(APILog.status)
    ).all()
    return [{"status": status, "count": count} for status, count in rows]


@router.get("/top-actions", response_model=list[TopActionItem])
def report_top_actions(
    session: SessionDep,
    account: CurrentAccount,
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
):
    period_start, period_end = parse_period(start, end)
    rows = session.exec(
        select(APILog.action, func.count(col(APILog.id)))
        .where(APILog.account_id == account.id, APILog.timestamp >= period_start, APILog.timestamp < period_end)
        .group_by(APILog.action)
        .order_by(func.count(col(APILog.id)).desc())
        .limit(10)
    ).all()
    return [{"action": action, "count": count} for action, count in rows]


@router.get("/top-users", response_model=list[TopUserItem])
def report_top_users(
    session: SessionDep,
    account: CurrentAccount,
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
):
    period_start, period_end = parse_period(start, end)
    rows = session.exec(
        select(APILog.user_id, func.count(col(APILog.id)))
        .where(
            APILog.account_id == account.id,
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


@router.get("/revenue-trend", response_model=list[RevenueTrendPoint])
def report_revenue_trend(
    session: SessionDep,
    account: CurrentAccount,
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
):
    period_start, period_end = parse_period(start, end)
    metrics = session.exec(
        select(RevenueMetric)
        .where(
            RevenueMetric.account_id == account.id,
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


@router.get("/logs", response_model=LogsResponse)
def report_logs(
    session: SessionDep,
    account: CurrentAccount,
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    period_start, period_end = parse_period(start, end)
    aid = account.id
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
