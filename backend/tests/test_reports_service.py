"""Testes de agregações e relatórios (services.reports)."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlmodel import Session

from app.models import APILog, Account, RevenueMetric, User
from app.services.reports import (
    build_logs_paginated,
    build_report_summary,
    build_revenue_trend,
    build_status_breakdown,
    build_top_actions,
    build_top_users,
)
from app.utils import pct_change

# Período atual 10 dias; período anterior com a mesma duração (espelha build_report_summary).
START = "2024-01-01T00:00:00+00:00"
END = "2024-01-11T00:00:00+00:00"

# Dentro do período atual [2024-01-01, 2024-01-11)
T0 = datetime(2024, 1, 2, 12, 0, 0, tzinfo=timezone.utc)
T1 = datetime(2024, 1, 5, 12, 0, 0, tzinfo=timezone.utc)
# Período anterior [2023-12-22, 2024-01-01)
P0 = datetime(2023, 12, 25, 12, 0, 0, tzinfo=timezone.utc)
P1 = datetime(2023, 12, 30, 12, 0, 0, tzinfo=timezone.utc)


def _seed_account_and_users(session: Session) -> tuple[int, int, int]:
    """Devolve (account_id, user_a_id, user_b_id)."""

    acc = Account(email="rep@example.com", hashed_password="x", name="R")
    session.add(acc)
    session.commit()
    session.refresh(acc)
    ua = User(account_id=acc.id, name="Alice")
    ub = User(account_id=acc.id, name="Bob")
    session.add(ua)
    session.add(ub)
    session.commit()
    session.refresh(ua)
    session.refresh(ub)
    return acc.id, ua.id, ub.id


def test_build_report_summary_contagens_e_variacoes(session: Session):
    """Resumo com logs e receita no período atual vs anterior; taxa de sucesso e pct_change."""

    aid, ua_id, ub_id = _seed_account_and_users(session)
    # Atual: 4 pedidos, 3 Success
    for ts, st in [(T0, "Success"), (T1, "Success"), (T1, "Success"), (T1, "Error")]:
        session.add(
            APILog(account_id=aid, user_id=ua_id, action="x", status=st, timestamp=ts)
        )
    session.add(
        APILog(account_id=aid, user_id=ub_id, action="y", status="Success", timestamp=T1)
    )
    # Anterior: 2 pedidos, 1 Success
    session.add(
        APILog(account_id=aid, user_id=ua_id, action="x", status="Success", timestamp=P0)
    )
    session.add(
        APILog(account_id=aid, user_id=ua_id, action="x", status="Error", timestamp=P1)
    )
    session.add(
        RevenueMetric(account_id=aid, value=100.0, recorded_at=T0)
    )
    session.add(
        RevenueMetric(account_id=aid, value=50.0, recorded_at=T1)
    )
    session.add(
        RevenueMetric(account_id=aid, value=30.0, recorded_at=P0)
    )
    session.commit()

    out = build_report_summary(session, aid, START, END)
    assert out["total_requests"] == 5
    assert out["success_rate"] == 80.0  # 4/5
    assert out["total_revenue"] == 150.0
    # Distinct user_id no período: 2
    assert out["active_users"] == 2
    assert out["requests_change"] == pct_change(5, 2)
    assert out["revenue_change"] == pct_change(150.0, 30.0)
    assert out["active_users_change"] == pct_change(2, 1)


def test_build_report_summary_sem_pedidos_taxa_zero(session: Session):
    """Sem logs no período, total_requests 0 e success_rate 0."""

    acc = Account(email="empty@example.com", hashed_password="x", name="E")
    session.add(acc)
    session.commit()
    session.refresh(acc)
    out = build_report_summary(session, acc.id, START, END)
    assert out["total_requests"] == 0
    assert out["success_rate"] == 0.0


def test_build_logs_paginated_filtros_e_pagina(session: Session):
    """Filtros status/action/user_id, total, páginas e ordem por timestamp desc."""

    aid, ua_id, ub_id = _seed_account_and_users(session)
    t_new = datetime(2024, 1, 10, 0, 0, 0, tzinfo=timezone.utc)
    t_old = datetime(2024, 1, 3, 0, 0, 0, tzinfo=timezone.utc)
    session.add(
        APILog(account_id=aid, user_id=ua_id, action="A", status="Success", timestamp=t_old)
    )
    session.add(
        APILog(account_id=aid, user_id=ub_id, action="B", status="Error", timestamp=t_new)
    )
    session.add(
        APILog(account_id=aid, user_id=ua_id, action="A", status="Success", timestamp=T1)
    )
    session.commit()

    out = build_logs_paginated(
        session, aid, START, END, status="Success", action=None, user_id=None, page=1, per_page=10
    )
    assert out["total"] == 2
    assert out["pages"] == 1
    assert len(out["items"]) == 2
    assert out["items"][0]["timestamp"] >= out["items"][1]["timestamp"]

    filtered = build_logs_paginated(
        session, aid, START, END, status=None, action="B", user_id=None, page=1, per_page=10
    )
    assert filtered["total"] == 1
    assert filtered["items"][0]["action"] == "B"

    partial = build_logs_paginated(
        session, aid, START, END, status=None, action="a", user_id=None, page=1, per_page=10
    )
    assert partial["total"] == 2

    by_user = build_logs_paginated(
        session, aid, START, END, status=None, action=None, user_id=ua_id, page=1, per_page=10
    )
    assert by_user["total"] == 2


def test_build_top_users_nome_e_unknown(session: Session):
    """Ranking por contagens; utilizador órfão mostra Unknown se inserção for permitida."""

    aid, ua_id, _ = _seed_account_and_users(session)
    session.add(
        APILog(account_id=aid, user_id=ua_id, action="p", status="Success", timestamp=T1)
    )
    session.add(
        APILog(account_id=aid, user_id=ua_id, action="p", status="Success", timestamp=T1)
    )
    log_orf = APILog(
        account_id=aid,
        user_id=999_999,
        action="p",
        status="Success",
        timestamp=T1,
    )
    session.add(log_orf)
    try:
        session.commit()
    except Exception:
        session.rollback()
        rows = build_top_users(session, aid, START, END)
        assert len(rows) == 1
        assert rows[0]["name"] == "Alice"
        assert rows[0]["count"] == 2
        return
    rows = build_top_users(session, aid, START, END)
    assert any(r["name"] == "Alice" for r in rows)
    assert any(r["name"] == "Unknown" for r in rows)


def test_smoke_status_breakdown_top_actions_revenue_trend(session: Session):
    """Smoke: breakdown, top_actions e tendência de receita com poucos dados."""

    aid, ua_id, _ = _seed_account_and_users(session)
    session.add(
        APILog(account_id=aid, user_id=ua_id, action="act", status="ok", timestamp=T1)
    )
    session.add(
        RevenueMetric(account_id=aid, value=10.0, recorded_at=T0)
    )
    session.commit()

    br = build_status_breakdown(session, aid, START, END)
    assert isinstance(br, list) and len(br) >= 1

    ta = build_top_actions(session, aid, START, END)
    assert any(x["action"] == "act" for x in ta)

    rt = build_revenue_trend(session, aid, START, END)
    assert isinstance(rt, list)
    assert any(d["date"] == "2024-01-02" for d in rt)
