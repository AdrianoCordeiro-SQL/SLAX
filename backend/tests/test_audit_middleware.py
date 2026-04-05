"""Request audit middleware: persiste APILog quando REQUEST_AUDIT_LOG está ligado."""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, col, func, select

from app.models import APILog


def _register_and_token(client: TestClient) -> tuple[dict[str, str], int]:
    email = f"audit_{uuid.uuid4().hex[:12]}@example.com"
    client.post(
        "/auth/register",
        json={"name": "Audit", "email": email, "password": "pw123456"},
    )
    login = client.post(
        "/auth/login",
        json={"email": email, "password": "pw123456"},
    )
    assert login.status_code == 200
    data = login.json()
    return {"Authorization": f"Bearer {data['access_token']}"}, data["account"]["id"]


def test_audit_middleware_inserts_apilog_on_authenticated_request(
    client: TestClient,
    session: Session,
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setenv("REQUEST_AUDIT_LOG", "true")

    headers, aid = _register_and_token(client)

    n_before = session.exec(
        select(func.count(col(APILog.id))).where(APILog.account_id == aid)
    ).one()

    r = client.get("/stats", headers=headers)
    assert r.status_code == 200

    session.expire_all()
    n_after = session.exec(
        select(func.count(col(APILog.id))).where(APILog.account_id == aid)
    ).one()

    assert n_after == n_before + 1

    log = session.exec(
        select(APILog)
        .where(APILog.account_id == aid)
        .order_by(col(APILog.id).desc())
    ).first()
    assert log is not None
    assert log.action == "GET /stats"
    assert log.status == "Success"
    assert log.user_id is None


def test_audit_middleware_skipped_when_disabled(
    client: TestClient,
    session: Session,
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setenv("REQUEST_AUDIT_LOG", "false")

    headers, aid = _register_and_token(client)

    n_before = session.exec(
        select(func.count(col(APILog.id))).where(APILog.account_id == aid)
    ).one()

    r = client.get("/stats", headers=headers)
    assert r.status_code == 200

    session.expire_all()
    n_after = session.exec(
        select(func.count(col(APILog.id))).where(APILog.account_id == aid)
    ).one()

    assert n_after == n_before
