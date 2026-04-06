"""Testes de agregações do dashboard (stats e sparklines) com tempo fixo."""

from __future__ import annotations

from datetime import UTC, datetime

from freezegun import freeze_time
from sqlmodel import Session

from app.models import Account, APILog, RevenueMetric, User
from app.services.dashboard import build_activity_feed, build_sparklines, build_stats
from app.utils import pct_change


def _acc(session: Session) -> Account:
    a = Account(email="dash@example.com", hashed_password="x", name="D")
    session.add(a)
    session.commit()
    session.refresh(a)
    return a


@freeze_time("2024-06-15T12:00:00+00:00")
def test_build_stats_janelas_e_pct_change(session: Session):
    """Stats usam últimos 7 dias vs semana anterior; totais e strings de variação."""

    a = _acc(session)
    # User novo na semana atual vs user antigo
    u_old = User(
        account_id=a.id,
        name="Old",
        created_at=datetime(2024, 5, 1, 0, 0, 0, tzinfo=UTC),
    )
    u_new = User(
        account_id=a.id,
        name="New",
        created_at=datetime(2024, 6, 10, 0, 0, 0, tzinfo=UTC),
    )
    session.add(u_old)
    session.add(u_new)
    session.commit()
    session.refresh(u_old)
    session.refresh(u_new)

    session.add(
        APILog(
            account_id=a.id,
            user_id=u_new.id,
            action="a",
            status="Success",
            timestamp=datetime(2024, 6, 10, 12, 0, 0, tzinfo=UTC),
        )
    )
    session.add(
        APILog(
            account_id=a.id,
            user_id=u_new.id,
            action="Produto iPhone 15 devolvido pelo cliente New",
            status="Success",
            timestamp=datetime(2024, 6, 5, 12, 0, 0, tzinfo=UTC),
        )
    )
    # Chamada interna do dashboard não deve influenciar métrica de API Requests.
    session.add(
        APILog(
            account_id=a.id,
            user_id=u_new.id,
            action="GET /stats",
            status="Success",
            timestamp=datetime(2024, 6, 10, 12, 5, 0, tzinfo=timezone.utc),
        )
    )
    session.add(
        RevenueMetric(
            account_id=a.id,
            value=10.0,
            recorded_at=datetime(2024, 6, 10, 12, 0, 0, tzinfo=UTC),
        )
    )
    session.add(
        RevenueMetric(
            account_id=a.id,
            value=-20.0,
            recorded_at=datetime(2024, 6, 5, 12, 0, 0, tzinfo=UTC),
        )
    )
    session.commit()

    out = build_stats(session, a.id)
    assert out["total_users"] == 2
    assert out["api_requests"] == 2
    assert out["requests_change"] == pct_change(1, 1)
    assert out["revenue"] == -10.0
    assert out["revenue_change"] == pct_change(10.0, -20.0)
    assert out["returns_count"] == 1
    assert out["returns_lost_value"] == 20.0
    assert out["users_change"] == pct_change(1, 0)


@freeze_time("2024-06-15T12:00:00+00:00")
def test_build_sparklines_sete_dias_e_valores(session: Session):
    """Sparklines: 7 pontos por série, datas YYYY-MM-DD, contagens por dia."""

    a = _acc(session)
    u = User(
        account_id=a.id, name="U", created_at=datetime(2024, 6, 10, 0, 0, 0, tzinfo=UTC)
    )
    session.add(u)
    session.commit()
    session.refresh(u)
    # Um dia com 2 logs e outro sem (dentro da janela de 7 dias do loop)
    session.add(
        APILog(
            account_id=a.id,
            user_id=u.id,
            action="x",
            status="Success",
            timestamp=datetime(2024, 6, 10, 15, 0, 0, tzinfo=UTC),
        )
    )
    session.add(
        APILog(
            account_id=a.id,
            user_id=u.id,
            action="x",
            status="Error",
            timestamp=datetime(2024, 6, 10, 16, 0, 0, tzinfo=UTC),
        )
    )
    session.add(
        RevenueMetric(
            account_id=a.id,
            value=5.0,
            recorded_at=datetime(2024, 6, 12, 12, 0, 0, tzinfo=UTC),
        )
    )
    session.commit()

    sp = build_sparklines(session, a.id)
    assert len(sp["users"]) == 7
    assert len(sp["requests"]) == 7
    assert len(sp["revenue"]) == 7
    assert len(sp["health"]) == 7
    dates = {p["date"] for p in sp["requests"]}
    assert "2024-06-10" in dates
    day_610 = next(p for p in sp["requests"] if p["date"] == "2024-06-10")
    assert day_610["value"] == 2
    day_612 = next(p for p in sp["revenue"] if p["date"] == "2024-06-12")
    assert day_612["value"] == 5.0


def test_build_activity_feed_smoke(session: Session):
    """Smoke: feed de atividade devolve itens serializados."""

    a = _acc(session)
    log = APILog(
        account_id=a.id,
        user_id=None,
        action="ping",
        status="Success",
        timestamp=datetime(2024, 1, 1, 12, 0, 0, tzinfo=UTC),
    )
    session.add(log)
    session.commit()
    session.refresh(log)
    feed = build_activity_feed(session, a.id, limit=5)
    assert len(feed) == 1
    assert feed[0]["action"] == "ping"
    assert feed[0]["user"] == "Unknown"
