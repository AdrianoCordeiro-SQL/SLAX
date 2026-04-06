"""Serviço e API HTTP de alertas operacionais."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models import AlertFiring, APILog, RevenueMetric, User
from app.schemas import RegisterRequest
from app.services import alerts as alerts_service
from app.services.account import register_account


def _seed_account(session: Session) -> int:
    acc = register_account(
        session,
        RegisterRequest(name="A", email="alerts@example.com", password="pw123456"),
    )
    return acc.id


def test_returns_rate_fires_when_above_threshold(session: Session):
    """Taxa de devoluções acima do limite dispara regra."""

    aid = _seed_account(session)
    u = User(account_id=aid, name="U", product="P", product_value=10.0)
    session.add(u)
    session.commit()
    session.refresh(u)
    now = datetime.now(UTC)
    for i in range(6):
        session.add(
            APILog(
                account_id=aid,
                user_id=u.id,
                action="Comprou Produto X",
                status="success",
                timestamp=now - timedelta(hours=i),
            )
        )
    for i in range(6):
        session.add(
            APILog(
                account_id=aid,
                user_id=u.id,
                action="Produto X devolvido pelo cliente Y",
                status="success",
                timestamp=now - timedelta(hours=10 + i),
            )
        )
    session.commit()

    rule = alerts_service.create_rule(
        session,
        aid,
        "returns_rate_above",
        {"window_days": 7, "max_percent": 40, "min_events": 5},
        True,
        1,
    )
    res = alerts_service.evaluate_rule(session, rule)
    assert res is not None
    assert "devoluções" in res["message"].lower() or "devolu" in res["message"].lower()


def test_cooldown_blocks_second_firing(session: Session):
    """Após disparo, não dispara de novo dentro do cooldown."""

    aid = _seed_account(session)
    u = User(account_id=aid, name="U", product="P", product_value=10.0)
    session.add(u)
    session.commit()
    session.refresh(u)
    now = datetime.now(UTC)
    for i in range(6):
        session.add(
            APILog(
                account_id=aid,
                user_id=u.id,
                action="Comprou Produto X",
                status="success",
                timestamp=now - timedelta(hours=i),
            )
        )
    for i in range(6):
        session.add(
            APILog(
                account_id=aid,
                user_id=u.id,
                action="Produto X devolvido pelo cliente Y",
                status="success",
                timestamp=now - timedelta(hours=10 + i),
            )
        )
    session.commit()

    rule = alerts_service.create_rule(
        session,
        aid,
        "returns_rate_above",
        {"window_days": 7, "max_percent": 40, "min_events": 5},
        True,
        24,
    )
    assert alerts_service.evaluate_rule(session, rule) is not None
    firing = AlertFiring(
        account_id=aid,
        rule_id=rule.id,
        message="test",
        snapshot_json="{}",
    )
    session.add(firing)
    session.commit()

    assert alerts_service.evaluate_rule(session, rule) is None


def test_evaluate_http_200(session: Session, client: TestClient):
    """POST /alerts/evaluate com JWT devolve 200 e lista fired."""

    register_account(
        session, RegisterRequest(name="E", email="ev@example.com", password="pw123456")
    )
    login = client.post(
        "/auth/login",
        json={"email": "ev@example.com", "password": "pw123456"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    r = client.post("/alerts/evaluate", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    data = r.json()
    assert "fired" in data
    assert isinstance(data["fired"], list)


def test_revenue_drop_fires(session: Session):
    """Queda de receita acima do limite dispara."""

    aid = _seed_account(session)
    now = datetime.now(UTC)
    cur_start = now - timedelta(days=3)
    prev_start = cur_start - timedelta(days=7)
    session.add(
        RevenueMetric(
            account_id=aid, value=100.0, recorded_at=cur_start + timedelta(days=1)
        )
    )
    session.add(
        RevenueMetric(
            account_id=aid, value=500.0, recorded_at=prev_start + timedelta(days=1)
        )
    )
    session.commit()

    rule = alerts_service.create_rule(
        session,
        aid,
        "revenue_drop",
        {"window_days": 7, "drop_percent": 20},
        True,
        1,
    )
    res = alerts_service.evaluate_rule(session, rule)
    assert res is not None
    assert "receita" in res["message"].lower()
