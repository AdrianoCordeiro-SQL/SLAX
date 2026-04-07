"""Smoke tests dos exception handlers globais (409, 404, 400)."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.schemas import RegisterRequest
from app.services.account import register_account


def test_handler_email_ja_registado_409(session: Session, client: TestClient):
    """EmailAlreadyRegistered deve responder 409 com detail fixo."""

    client.post(
        "/auth/register",
        json={"name": "A", "email": "dup409@example.com", "password": "pw123456"},
    )
    r = client.post(
        "/auth/register",
        json={"name": "B", "email": "dup409@example.com", "password": "other"},
    )
    assert r.status_code == 409
    assert r.json()["detail"] == "Email already registered"


def test_handler_user_nao_encontrado_404(session: Session, client: TestClient):
    """UserNotFoundForAccount deve responder 404."""

    register_account(
        session,
        RegisterRequest(name="A", email="n404@example.com", password="pw123456"),
    )
    login = client.post(
        "/auth/login",
        json={"email": "n404@example.com", "password": "pw123456"},
    )
    token = login.json()["access_token"]
    r = client.put(
        "/users/999999",
        headers={"Authorization": f"Bearer {token}"},
        json={"first_name": "X"},
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "User not found"


def test_handler_troca_de_senha_bloqueada_403(session: Session, client: TestClient):
    """Troca de senha bloqueada deve responder 403."""

    register_account(
        session,
        RegisterRequest(name="A", email="bad400@example.com", password="correct123"),
    )
    login = client.post(
        "/auth/login",
        json={"email": "bad400@example.com", "password": "correct123"},
    )
    token = login.json()["access_token"]
    r = client.post(
        "/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": "wrong", "new_password": "newpass123"},
    )
    assert r.status_code == 403
    assert r.json()["detail"] == "Função bloqueada temporariamente"
