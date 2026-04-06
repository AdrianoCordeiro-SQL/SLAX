"""Fluxos HTTP do prefixo /auth."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.schemas import RegisterRequest
from app.services.account import register_account


def test_register_201(client: TestClient):
    """POST /auth/register deve criar conta e devolver token (201)."""

    r = client.post(
        "/auth/register",
        json={"name": "Reg", "email": "reg@example.com", "password": "pw123456"},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["token_type"] == "bearer"
    assert "access_token" in data
    assert data["account"]["email"] == "reg@example.com"


def test_login_invalid_401(client: TestClient):
    """POST /auth/login com credenciais inexistentes deve responder 401."""

    r = client.post(
        "/auth/login",
        json={"email": "nobody@example.com", "password": "pw123456"},
    )
    assert r.status_code == 401


def test_me_with_bearer_200(session: Session, client: TestClient):
    """GET /auth/me com Bearer obtido por login deve devolver o perfil (200)."""

    register_account(
        session, RegisterRequest(name="M", email="me@example.com", password="pw123456")
    )
    login = client.post(
        "/auth/login",
        json={"email": "me@example.com", "password": "pw123456"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == "me@example.com"


def test_patch_me_and_change_password(session: Session, client: TestClient):
    """PATCH /auth/me, troca de senha com atual errada (400) e correta (204)."""

    register_account(
        session, RegisterRequest(name="M", email="patch@example.com", password="oldpass123")
    )
    login = client.post(
        "/auth/login",
        json={"email": "patch@example.com", "password": "oldpass123"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    r = client.patch("/auth/me", headers=headers, json={"name": "Patched"})
    assert r.status_code == 200
    assert r.json()["name"] == "Patched"

    bad = client.post(
        "/auth/change-password",
        headers=headers,
        json={"current_password": "wrong", "new_password": "newpass123"},
    )
    assert bad.status_code == 400

    ok = client.post(
        "/auth/change-password",
        headers=headers,
        json={"current_password": "oldpass123", "new_password": "newpass123"},
    )
    assert ok.status_code == 204


def test_demo_login_503_when_not_configured(client: TestClient, monkeypatch: pytest.MonkeyPatch):
    """POST /auth/demo sem DEMO_LOGIN_* deve responder 503."""

    monkeypatch.delenv("DEMO_LOGIN_EMAIL", raising=False)
    monkeypatch.delenv("DEMO_LOGIN_PASSWORD", raising=False)
    r = client.post("/auth/demo")
    assert r.status_code == 503
    assert r.json()["detail"] == "Demo login is not configured"


def test_demo_login_200(session: Session, client: TestClient, monkeypatch: pytest.MonkeyPatch):
    """POST /auth/demo com env e conta existente devolve token como /login."""

    monkeypatch.setenv("DEMO_LOGIN_EMAIL", "visitor@example.com")
    monkeypatch.setenv("DEMO_LOGIN_PASSWORD", "demopass123")
    register_account(
        session,
        RegisterRequest(name="Visitor", email="visitor@example.com", password="demopass123"),
    )
    r = client.post("/auth/demo")
    assert r.status_code == 200
    data = r.json()
    assert data["token_type"] == "bearer"
    assert "access_token" in data
    assert data["account"]["email"] == "visitor@example.com"


def test_demo_login_401_when_credentials_invalid(client: TestClient, monkeypatch: pytest.MonkeyPatch):
    """POST /auth/demo com env que não autentica deve responder 401."""

    monkeypatch.setenv("DEMO_LOGIN_EMAIL", "ghost@example.com")
    monkeypatch.setenv("DEMO_LOGIN_PASSWORD", "wrong")
    r = client.post("/auth/demo")
    assert r.status_code == 401
    assert r.json()["detail"] == "Invalid email or password"
