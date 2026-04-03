"""Test configuration: env must be set before any import from app."""

from __future__ import annotations

import os

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["JWT_SECRET"] = "test-jwt-secret-key-for-pytest-only"

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel

from app.database import engine, get_session
from app.main import app


@pytest.fixture
def session() -> Session:
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        yield s


@pytest.fixture
def client(session: Session) -> TestClient:
    """TestClient with shared in-memory DB via overridden get_session."""

    def override_get_session():
        yield session

    app.dependency_overrides[get_session] = override_get_session
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
