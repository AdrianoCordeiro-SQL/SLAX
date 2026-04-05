"""Configuração dos testes: variáveis de ambiente antes de qualquer import de app."""

from __future__ import annotations

import os

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["JWT_SECRET"] = "test-jwt-secret-key-for-pytest-only"
os.environ["REQUEST_AUDIT_LOG"] = "false"

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel

from app.database import engine, get_session
from app.main import app


@pytest.fixture
def session() -> Session:
    """Recria o esquema e devolve uma sessão SQLModel partilhada pelo teste."""

    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        yield s


@pytest.fixture
def client(session: Session) -> TestClient:
    """TestClient com a mesma BD em memória via override de get_session."""

    def override_get_session():
        yield session

    app.dependency_overrides[get_session] = override_get_session
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
