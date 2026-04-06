"""Acesso HTTP entre tenants no prefixo /users."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlmodel import Session, col, func, select

from app.models import APILog
from app.schemas import RegisterRequest, UserCreate
from app.services.account import register_account
from app.services.users import create_user


def test_cannot_modify_other_tenant_user_via_api(session: Session, client: TestClient):
    """Conta A não pode alterar nem apagar utilizador da conta B; B continua a gerir o seu."""

    register_account(
        session, RegisterRequest(name="A", email="ca@example.com", password="pw123456")
    )
    b = register_account(
        session, RegisterRequest(name="B", email="cb@example.com", password="pw123456")
    )
    u_b = create_user(session, b.id, UserCreate(first_name="OnlyB"))

    login_a = client.post(
        "/auth/login",
        json={"email": "ca@example.com", "password": "pw123456"},
    )
    assert login_a.status_code == 200
    token_a = login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    put = client.put(
        f"/users/{u_b.id}",
        headers=headers_a,
        json={"first_name": "X"},
    )
    assert put.status_code == 404

    delete = client.delete(f"/users/{u_b.id}", headers=headers_a)
    assert delete.status_code == 404

    login_b = client.post(
        "/auth/login",
        json={"email": "cb@example.com", "password": "pw123456"},
    )
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    lst = client.get("/users/", headers=headers_b)
    assert lst.status_code == 200
    ids = {u["id"] for u in lst.json()}
    assert u_b.id in ids
    rename = client.put(
        f"/users/{u_b.id}",
        headers=headers_b,
        json={"first_name": "StillB"},
    )
    assert rename.status_code == 200
    assert rename.json()["name"] == "StillB"


def test_post_users_with_demo_activity_creates_logs(client: TestClient, session: Session):
    """POST /users/ com seed_demo_activity persiste APILog para o novo utilizador."""

    register_account(
        session, RegisterRequest(name="DemoHttp", email="demopost@example.com", password="pw123456")
    )
    login = client.post(
        "/auth/login",
        json={"email": "demopost@example.com", "password": "pw123456"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    r = client.post(
        "/users/",
        headers=headers,
        json={
            "first_name": "HttpDemo",
            "seed_demo_activity": True,
            "demo_volume": "light",
        },
    )
    assert r.status_code == 201
    uid = r.json()["id"]

    n = session.exec(select(func.count(col(APILog.id))).where(APILog.user_id == uid)).one()
    assert 15 <= n <= 30
