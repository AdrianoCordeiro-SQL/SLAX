"""JWT: claims, expiração e assinatura."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import jwt
import pytest

from app.auth_tokens import (
    ALGORITHM,
    SECRET_KEY,
    create_access_token,
    decode_access_token,
)


def test_create_and_decode_round_trip():
    """create_access_token e decode_access_token devem preservar sub, email e exp."""

    token = create_access_token(42, "user@example.com")
    payload = decode_access_token(token)
    assert payload["sub"] == "42"
    assert payload["email"] == "user@example.com"
    assert "exp" in payload


def test_decode_rejects_wrong_secret():
    """decode_access_token falha se a assinatura não corresponde à chave da app."""

    token = jwt.encode(
        {"sub": "1", "email": "a@b.c", "exp": datetime.now(UTC) + timedelta(hours=1)},
        "wrong-secret-key-not-the-same-as-app-secret-32b",
        algorithm=ALGORITHM,
    )
    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(token)


def test_decode_rejects_expired_token():
    """decode_access_token deve levantar ExpiredSignatureError para token expirado."""

    token = jwt.encode(
        {"sub": "1", "email": "a@b.c", "exp": datetime.now(UTC) - timedelta(minutes=1)},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    with pytest.raises(jwt.ExpiredSignatureError):
        decode_access_token(token)


def test_decode_rejects_garbage_token():
    """decode_access_token deve rejeitar string que não é um JWT válido."""

    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token("not-a-jwt")
