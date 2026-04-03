from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session

from ..auth import get_current_account
from ..database import get_session
from ..models import Account
from ..schemas import (
    ActivityItem,
    HealthResponse,
    PerformancePoint,
    SparklineResponse,
    StatsResponse,
)
from ..services.dashboard import (
    build_activity_feed,
    build_performance_series,
    build_sparklines,
    build_stats,
)

# Rotas do dashboard: health, estatísticas, sparklines, série de performance e feed de atividade.

router = APIRouter(tags=["dashboard"])

SessionDep = Annotated[Session, Depends(get_session)]
CurrentAccount = Annotated[Account, Depends(get_current_account)]


@router.get("/", response_model=HealthResponse, tags=["health"])
def read_root():
    return {"status": "Online", "message": "SLAX Analytics backend running."}


@router.get("/stats", response_model=StatsResponse)
def get_stats(session: SessionDep, account: CurrentAccount):
    return build_stats(session, account.id)


@router.get("/stats/sparklines", response_model=SparklineResponse)
def get_stats_sparklines(session: SessionDep, account: CurrentAccount):
    return build_sparklines(session, account.id)


@router.get("/performance", response_model=list[PerformancePoint])
def get_performance(session: SessionDep, account: CurrentAccount):
    return build_performance_series(session, account.id)


@router.get("/activity", response_model=list[ActivityItem])
def get_activity(session: SessionDep, account: CurrentAccount):
    return build_activity_feed(session, account.id)
