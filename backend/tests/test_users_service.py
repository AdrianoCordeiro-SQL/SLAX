"""Isolamento por tenant no CRUD de utilizadores (serviço)."""

from __future__ import annotations

import pytest
from sqlmodel import Session, select

from app.exceptions import UserNotFoundForAccount
from app.models import APILog, RevenueMetric, User
from app.schemas import RegisterRequest, UserCreate, UserUpdate
from app.services.account import register_account
from app.services.users import create_user, delete_user, update_user


def test_update_user_other_tenant_raises(session: Session):
    """Atualizar utilizador de outro tenant deve levantar UserNotFoundForAccount."""

    a = register_account(
        session, RegisterRequest(name="A", email="ta@example.com", password="pw123456")
    )
    b = register_account(
        session, RegisterRequest(name="B", email="tb@example.com", password="pw123456")
    )
    u_b = create_user(session, b.id, UserCreate(first_name="Other", product="Plano A", value=100))
    with pytest.raises(UserNotFoundForAccount):
        update_user(session, a.id, u_b.id, UserUpdate(first_name="Hack"))


def test_delete_user_other_tenant_raises(session: Session):
    """Eliminar utilizador de outro tenant deve levantar UserNotFoundForAccount."""

    a = register_account(
        session, RegisterRequest(name="A", email="da@example.com", password="pw123456")
    )
    b = register_account(
        session, RegisterRequest(name="B", email="db@example.com", password="pw123456")
    )
    u_b = create_user(session, b.id, UserCreate(first_name="Victim", product="Plano B", value=80))
    with pytest.raises(UserNotFoundForAccount):
        delete_user(session, a.id, u_b.id)


def test_delete_user_removes_dependent_api_logs(session: Session):
    """Eliminar utilizador remove APILog dependentes para não violar FK."""

    account = register_account(
        session, RegisterRequest(name="A", email="del@example.com", password="pw123456")
    )
    user = create_user(
        session,
        account.id,
        UserCreate(first_name="WithLogs", product="Plano C", value=55),
    )
    session.add(
        APILog(
            account_id=account.id,
            user_id=user.id,
            action="GET /users",
            status="Success",
        )
    )
    session.commit()

    delete_user(session, account.id, user.id)

    user_after = session.get(User, user.id)
    logs_after = session.exec(select(APILog).where(APILog.user_id == user.id)).all()
    assert user_after is None
    assert logs_after == []


def test_create_user_persists_product_value_and_history(session: Session):
    """Criar utilizador grava product/value e gera log + receita."""

    account = register_account(
        session, RegisterRequest(name="A", email="buy@example.com", password="pw123456")
    )
    user = create_user(
        session,
        account.id,
        UserCreate(first_name="Buyer", product="Notebook", value=1999.9),
    )

    stored = session.get(User, user.id)
    assert stored is not None
    assert stored.product == "Notebook"
    assert stored.product_value == pytest.approx(1999.9)

    logs = session.exec(select(APILog).where(APILog.user_id == user.id)).all()
    assert len(logs) == 1
    assert "purchase: Notebook" in logs[0].action

    metrics = session.exec(
        select(RevenueMetric).where(RevenueMetric.account_id == account.id)
    ).all()
    assert len(metrics) == 1
    assert metrics[0].value == pytest.approx(1999.9)
