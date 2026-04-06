"""Integração HTTP das rotas de dashboard (raiz e /stats…) e /reports com JWT."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models import APILog

PROTECTED_PATHS = [
    "/stats",
    "/stats/sparklines",
    "/performance",
    "/activity",
    "/reports/summary",
    "/reports/status-breakdown",
    "/reports/top-actions",
    "/reports/top-users",
    "/reports/revenue-trend",
    "/reports/logs",
]


def _register_and_token(client: TestClient) -> tuple[dict[str, str], int]:
    """Regista conta, faz login e devolve (headers Authorization, account_id)."""

    email = f"http_{uuid.uuid4().hex[:12]}@example.com"
    client.post(
        "/auth/register",
        json={"name": "Http", "email": email, "password": "pw123456"},
    )
    login = client.post(
        "/auth/login",
        json={"email": email, "password": "pw123456"},
    )
    assert login.status_code == 200
    data = login.json()
    token = data["access_token"]
    aid = data["account"]["id"]
    return {"Authorization": f"Bearer {token}"}, aid


def test_get_raiz_health_sem_auth_200(client: TestClient):
    """GET / devolve estado online sem Bearer."""

    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "Online"
    assert "SLAX Pay API (demo)" in body["message"]


@pytest.mark.parametrize("path", PROTECTED_PATHS)
def test_rotas_protegidas_sem_bearer_401(client: TestClient, path: str):
    """Dashboard e reports exigem JWT."""

    r = client.get(path)
    assert r.status_code == 401


def test_get_stats_com_bearer_estrutura_200(client: TestClient):
    """GET /stats com JWT devolve campos de StatsResponse."""

    headers, _ = _register_and_token(client)
    r = client.get("/stats", headers=headers)
    assert r.status_code == 200
    d = r.json()
    for key in (
        "total_users",
        "users_change",
        "api_requests",
        "requests_change",
        "db_health",
        "db_health_change",
        "revenue",
        "revenue_change",
    ):
        assert key in d


def test_get_sparklines_com_bearer_estrutura_200(client: TestClient):
    """GET /stats/sparklines devolve quatro séries com 7 pontos."""

    headers, _ = _register_and_token(client)
    r = client.get("/stats/sparklines", headers=headers)
    assert r.status_code == 200
    d = r.json()
    for key in ("users", "requests", "revenue", "health"):
        assert key in d
        assert len(d[key]) == 7


def test_get_performance_com_bearer_lista_200(client: TestClient):
    """GET /performance devolve 30 pontos."""

    headers, _ = _register_and_token(client)
    r = client.get("/performance", headers=headers)
    assert r.status_code == 200
    lst = r.json()
    assert isinstance(lst, list)
    assert len(lst) == 30
    assert all("day" in p and "date" in p and "requests" in p and "latency" in p for p in lst)


def test_get_activity_com_bearer_lista_200(client: TestClient):
    """GET /activity devolve lista (pode estar vazia)."""

    headers, _ = _register_and_token(client)
    r = client.get("/activity", headers=headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_reports_summary_com_bearer_e_query_start_end_200(client: TestClient):
    """GET /reports/summary aceita start/end e devolve chaves do resumo."""

    headers, _ = _register_and_token(client)
    r = client.get(
        "/reports/summary",
        headers=headers,
        params={
            "start": "2024-01-01T00:00:00+00:00",
            "end": "2024-02-01T00:00:00+00:00",
        },
    )
    assert r.status_code == 200
    d = r.json()
    for key in (
        "total_requests",
        "requests_change",
        "success_rate",
        "success_rate_change",
        "total_revenue",
        "revenue_change",
        "active_users",
        "active_users_change",
    ):
        assert key in d


def test_reports_listas_com_bearer_200(client: TestClient):
    """Endpoints de relatório em lista respondem 200."""

    headers, _ = _register_and_token(client)
    for path in (
        "/reports/status-breakdown",
        "/reports/top-actions",
        "/reports/top-users",
        "/reports/revenue-trend",
    ):
        r = client.get(path, headers=headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


def test_reports_logs_com_bearer_estrutura_200(client: TestClient):
    """GET /reports/logs devolve objeto paginado."""

    headers, _ = _register_and_token(client)
    r = client.get("/reports/logs", headers=headers)
    assert r.status_code == 200
    d = r.json()
    for key in ("items", "total", "page", "per_page", "pages"):
        assert key in d


def test_reports_logs_paginacao_com_seed(
    session: Session,
    client: TestClient,
):
    """Com dois logs no período, page=2 e per_page=1 devolve total=2 e uma página extra."""

    reg = client.post(
        "/auth/register",
        json={"name": "Pag", "email": "paglogs@example.com", "password": "pw123456"},
    )
    assert reg.status_code == 201
    aid = reg.json()["account"]["id"]
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    start_s = "2024-01-01T00:00:00+00:00"
    end_s = "2024-02-01T00:00:00+00:00"
    t1 = datetime(2024, 1, 10, 10, 0, 0, tzinfo=timezone.utc)
    t2 = datetime(2024, 1, 20, 10, 0, 0, tzinfo=timezone.utc)
    session.add(
        APILog(account_id=aid, user_id=None, action="A", status="Success", timestamp=t1)
    )
    session.add(
        APILog(account_id=aid, user_id=None, action="B", status="Success", timestamp=t2)
    )
    session.commit()

    r = client.get(
        "/reports/logs",
        headers=headers,
        params={"start": start_s, "end": end_s, "page": 2, "per_page": 1},
    )
    assert r.status_code == 200
    d = r.json()
    assert d["total"] == 2
    assert d["page"] == 2
    assert d["per_page"] == 1
    assert d["pages"] == 2
    assert len(d["items"]) == 1
    # Ordem desc por timestamp: página 2 é o mais antigo (t1)
    assert d["items"][0]["action"] == "A"
