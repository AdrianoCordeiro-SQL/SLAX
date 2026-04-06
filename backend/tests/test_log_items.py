"""Testes de serialização de linhas de log de API."""

from __future__ import annotations

from datetime import UTC, datetime

import pytest
from sqlmodel import Session

from app.models import Account, APILog, User
from app.services.log_items import serialize_api_log_row


def _account(session: Session) -> Account:
    a = Account(email="log@example.com", hashed_password="x", name="Acc")
    session.add(a)
    session.commit()
    session.refresh(a)
    return a


def test_serialize_sem_user_id_mostra_unknown(session: Session):
    """user_id None deve mapear nome para Unknown e avatar None."""

    a = _account(session)
    log = APILog(
        account_id=a.id,
        user_id=None,
        action="GET",
        status="Success",
        timestamp=datetime(2024, 1, 1, 12, 0, 0, tzinfo=UTC),
    )
    session.add(log)
    session.commit()
    session.refresh(log)
    row = serialize_api_log_row(session, log)
    assert row["user"] == "Unknown"
    assert row["avatar_url"] is None
    assert row["action"] == "GET"
    assert row["status"] == "Success"


def test_serialize_com_utilizador_existente(session: Session):
    """Com User existente, nome e avatar vêm do registo."""

    a = _account(session)
    u = User(
        account_id=a.id,
        name="Maria",
        avatar_url="https://example.com/a.png",
    )
    session.add(u)
    session.commit()
    session.refresh(u)
    log = APILog(
        account_id=a.id,
        user_id=u.id,
        action="POST",
        status="Success",
        timestamp=datetime(2024, 1, 2, 12, 0, 0, tzinfo=UTC),
    )
    session.add(log)
    session.commit()
    session.refresh(log)
    row = serialize_api_log_row(session, log)
    assert row["user"] == "Maria"
    assert row["avatar_url"] == "https://example.com/a.png"


def test_serialize_user_id_sem_linha_user_unknown(session: Session):
    """Se user_id não resolve (órfão), nome é Unknown (se a FK permitir inserir)."""

    a = _account(session)
    log = APILog(
        account_id=a.id,
        user_id=999_999,
        action="DEL",
        status="Error",
        timestamp=datetime(2024, 1, 3, 12, 0, 0, tzinfo=UTC),
    )
    session.add(log)
    try:
        session.commit()
    except Exception:
        session.rollback()
        pytest.skip(
            "SQLite/ORM impediu user_id órfão; ramo Unknown coberto sem user_id."
        )
    session.refresh(log)
    row = serialize_api_log_row(session, log)
    assert row["user"] == "Unknown"
    assert row["avatar_url"] is None
