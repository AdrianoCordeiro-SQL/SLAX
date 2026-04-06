"""Isolamento por tenant no CRUD de utilizadores (serviço)."""

from __future__ import annotations

import pytest
from sqlmodel import Session, col, func, select

from app.exceptions import UserNotFoundForAccount
from app.models import APILog, RevenueMetric
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
    u_b = create_user(session, b.id, UserCreate(first_name="Other"))
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
    u_b = create_user(session, b.id, UserCreate(first_name="Victim"))
    with pytest.raises(UserNotFoundForAccount):
        delete_user(session, a.id, u_b.id)


def _count_logs_for_user(session: Session, user_id: int) -> int:
    return session.exec(select(func.count(col(APILog.id))).where(APILog.user_id == user_id)).one()


def _count_revenue_for_account(session: Session, account_id: int) -> int:
    return session.exec(
        select(func.count(col(RevenueMetric.id))).where(RevenueMetric.account_id == account_id)
    ).one()


def test_create_user_without_demo_no_api_logs(session: Session):
    """Sem seed_demo_activity não são criados APILog para o novo utilizador."""

    a = register_account(
        session, RegisterRequest(name="A", email="nodemo@example.com", password="pw123456")
    )
    u = create_user(session, a.id, UserCreate(first_name="Plain"))
    assert _count_logs_for_user(session, u.id) == 0


def test_create_user_with_demo_inserts_logs_and_revenue(session: Session):
    """Com seed_demo_activity gera APILog e RevenueMetric dentro dos intervalos do perfil light."""

    a = register_account(
        session, RegisterRequest(name="B", email="demo@example.com", password="pw123456")
    )
    assert _count_revenue_for_account(session, a.id) == 0

    u = create_user(
        session,
        a.id,
        UserCreate(first_name="Demo", seed_demo_activity=True, demo_volume="light"),
    )

    n_logs = _count_logs_for_user(session, u.id)
    assert 15 <= n_logs <= 30

    n_rev = _count_revenue_for_account(session, a.id)
    assert 5 <= n_rev <= 10

    sample = session.exec(select(APILog).where(APILog.user_id == u.id).limit(1)).first()
    assert sample is not None
    assert sample.account_id == a.id
    assert sample.action
    assert sample.status in ("Success", "Pending", "Failed")
