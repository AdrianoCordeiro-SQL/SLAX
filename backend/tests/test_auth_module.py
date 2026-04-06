"""Hash de senha, authenticate e resolução do Bearer em GET /auth/me."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.auth import authenticate, hash_password, verify_password
from app.auth_tokens import ALGORITHM, SECRET_KEY
from app.schemas import RegisterRequest
from app.services.account import register_account


def test_hash_and_verify_round_trip():
    """hash_password e verify_password: aceitam a correta e rejeitam a errada."""

    h = hash_password("correct-password")
    assert verify_password("correct-password", h) is True
    assert verify_password("wrong-password", h) is False


def test_authenticate_success(session: Session):
    """authenticate deve devolver a conta quando e-mail e senha estão corretos."""

    acc = register_account(
        session, RegisterRequest(name="N", email="ok@example.com", password="pw123456")
    )
    found = authenticate("ok@example.com", "pw123456", session)
    assert found is not None and found.id == acc.id


def test_authenticate_wrong_password(session: Session):
    """authenticate deve devolver None quando a senha está errada."""

    register_account(
        session, RegisterRequest(name="N", email="ok2@example.com", password="pw123456")
    )
    assert authenticate("ok2@example.com", "bad", session) is None


@pytest.mark.integration
def test_get_me_without_bearer_returns_401(client: TestClient):
    """GET /auth/me sem Authorization deve responder 401."""

    r = client.get("/auth/me")
    assert r.status_code == 401


@pytest.mark.integration
def test_get_me_invalid_token_401(client: TestClient):
    """GET /auth/me com token inválido deve responder 401 com detalhe esperado."""

    r = client.get("/auth/me", headers={"Authorization": "Bearer invalid"})
    assert r.status_code == 401
    assert r.json()["detail"] == "Invalid token"


@pytest.mark.integration
def test_get_me_expired_token_401(client: TestClient):
    """GET /auth/me com JWT expirado deve responder 401."""

    token = jwt.encode(
        {"sub": "1", "email": "a@b.c", "exp": datetime.now(UTC) - timedelta(minutes=1)},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401
    assert r.json()["detail"] == "Token expired"


@pytest.mark.integration
def test_get_me_unknown_account_id_401(session: Session, client: TestClient):
    """GET /auth/me com sub apontando para conta inexistente deve responder 401."""

    token = jwt.encode(
        {
            "sub": "99999",
            "email": "ghost@example.com",
            "exp": datetime.now(UTC) + timedelta(hours=1),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401
    assert r.json()["detail"] == "Account not found"


@pytest.mark.integration
def test_get_me_deleted_account_401(session: Session, client: TestClient):
    """GET /auth/me após eliminar a conta na BD deve responder 401."""

    acc = register_account(
        session,
        RegisterRequest(name="Del", email="del@example.com", password="pw123456"),
    )
    token = jwt.encode(
        {
            "sub": str(acc.id),
            "email": acc.email,
            "exp": datetime.now(UTC) + timedelta(hours=1),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    session.delete(acc)
    session.commit()
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401
    assert r.json()["detail"] == "Account not found"


@pytest.mark.integration
def test_get_me_valid_token_200(session: Session, client: TestClient):
    """GET /auth/me com JWT válido e conta existente deve responder 200."""

    acc = register_account(
        session,
        RegisterRequest(name="Ok", email="valid@example.com", password="pw123456"),
    )
    token = jwt.encode(
        {
            "sub": str(acc.id),
            "email": acc.email,
            "exp": datetime.now(UTC) + timedelta(hours=1),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == acc.email
