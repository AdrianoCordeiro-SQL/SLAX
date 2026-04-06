from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from ..auth import get_current_account
from ..database import get_session
from ..models import Account
from ..schemas import (
    LogsResponse,
    ReportSummaryResponse,
    RevenueTrendPoint,
    StatusBreakdownItem,
    TopActionItem,
    TopUserItem,
)
from ..services.reports import (
    build_logs_paginated,
    build_report_summary,
    build_revenue_trend,
    build_status_breakdown,
    build_top_actions,
    build_top_users,
)

# Rotas HTTP do prefixo /reports: resumos, gráficos agregados e listagem paginada de
# logs.

router = APIRouter(prefix="/reports", tags=["reports"])

SessionDep = Annotated[Session, Depends(get_session)]
CurrentAccount = Annotated[Account, Depends(get_current_account)]


@router.get("/summary", response_model=ReportSummaryResponse)
def report_summary(
    session: SessionDep,
    account: CurrentAccount,
    start: str | None = Query(None),
    end: str | None = Query(None),
):
    return build_report_summary(session, account.id, start, end)


@router.get("/status-breakdown", response_model=list[StatusBreakdownItem])
def report_status_breakdown(
    session: SessionDep,
    account: CurrentAccount,
    start: str | None = Query(None),
    end: str | None = Query(None),
):
    return build_status_breakdown(session, account.id, start, end)


@router.get("/top-actions", response_model=list[TopActionItem])
def report_top_actions(
    session: SessionDep,
    account: CurrentAccount,
    start: str | None = Query(None),
    end: str | None = Query(None),
):
    return build_top_actions(session, account.id, start, end)


@router.get("/top-users", response_model=list[TopUserItem])
def report_top_users(
    session: SessionDep,
    account: CurrentAccount,
    start: str | None = Query(None),
    end: str | None = Query(None),
):
    return build_top_users(session, account.id, start, end)


@router.get("/revenue-trend", response_model=list[RevenueTrendPoint])
def report_revenue_trend(
    session: SessionDep,
    account: CurrentAccount,
    start: str | None = Query(None),
    end: str | None = Query(None),
):
    return build_revenue_trend(session, account.id, start, end)


@router.get("/logs", response_model=LogsResponse)
def report_logs(
    session: SessionDep,
    account: CurrentAccount,
    start: str | None = Query(None),
    end: str | None = Query(None),
    status: str | None = Query(None),
    action: str | None = Query(None),
    user_id: int | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    transaction_kind: str | None = Query(
        None,
        description="completed=Compras (Comprou …); return=Devoluções",
    ),
):
    if transaction_kind is not None and transaction_kind not in ("completed", "return"):
        raise HTTPException(
            status_code=422, detail="transaction_kind must be 'completed' or 'return'"
        )
    return build_logs_paginated(
        session,
        account.id,
        start,
        end,
        status,
        action,
        user_id,
        page,
        per_page,
        transaction_kind,
    )
