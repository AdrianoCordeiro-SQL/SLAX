"""Account domain rules."""

from __future__ import annotations

import pytest
from sqlmodel import Session

from app.exceptions import EmailAlreadyRegistered, WrongCurrentPassword
from app.models import Account
from app.schemas import AccountUpdate, PasswordChange, RegisterRequest
from app.services.account import (
    change_account_password,
    register_account,
    update_account_profile,
)


def test_register_duplicate_email_raises(session: Session):
    register_account(
        session, RegisterRequest(name="A", email="dup@example.com", password="pw123456")
    )
    with pytest.raises(EmailAlreadyRegistered):
        register_account(
            session, RegisterRequest(name="B", email="dup@example.com", password="other")
        )


def test_change_password_wrong_current_raises(session: Session):
    acc = register_account(
        session, RegisterRequest(name="A", email="cp@example.com", password="pw123456")
    )
    with pytest.raises(WrongCurrentPassword):
        change_account_password(
            session,
            acc,
            PasswordChange(current_password="wrong", new_password="newpw123"),
        )


def test_update_profile_only_affects_passed_account(session: Session):
    a = register_account(
        session, RegisterRequest(name="A", email="a1@example.com", password="pw123456")
    )
    b = register_account(
        session, RegisterRequest(name="B", email="b1@example.com", password="pw123456")
    )
    update_account_profile(session, a, AccountUpdate(name="NewName"))
    session.refresh(a)
    session.refresh(b)
    assert a.name == "NewName"
    assert b.name == "B"
