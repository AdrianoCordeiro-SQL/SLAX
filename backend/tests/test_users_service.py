"""Tenant isolation in user CRUD."""

from __future__ import annotations

import pytest
from sqlmodel import Session

from app.exceptions import UserNotFoundForAccount
from app.schemas import RegisterRequest, UserCreate, UserUpdate
from app.services.account import register_account
from app.services.users import create_user, delete_user, update_user


def test_update_user_other_tenant_raises(session: Session):
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
    a = register_account(
        session, RegisterRequest(name="A", email="da@example.com", password="pw123456")
    )
    b = register_account(
        session, RegisterRequest(name="B", email="db@example.com", password="pw123456")
    )
    u_b = create_user(session, b.id, UserCreate(first_name="Victim"))
    with pytest.raises(UserNotFoundForAccount):
        delete_user(session, a.id, u_b.id)
