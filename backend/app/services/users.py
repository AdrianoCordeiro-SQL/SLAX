from sqlmodel import Session, col, select

from ..exceptions import UserNotFoundForAccount
from ..models import User
from ..schemas import UserCreate, UserUpdate

# Operações de CRUD em User restritas ao account_id do tenant autenticado.


def list_users(session: Session, account_id: int) -> list[User]:
    return session.exec(
        select(User).where(User.account_id == account_id).order_by(col(User.created_at).desc())
    ).all()


def create_user(session: Session, account_id: int, payload: UserCreate) -> User:
    full_name = (
        f"{payload.first_name} {payload.last_name}".strip() if payload.last_name else payload.first_name
    )
    user = User(
        name=full_name,
        last_name=payload.last_name,
        email=payload.email,
        avatar_url=payload.avatar_url,
        account_id=account_id,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def update_user(session: Session, account_id: int, user_id: int, payload: UserUpdate) -> User:
    user = session.get(User, user_id)
    if not user or user.account_id != account_id:
        raise UserNotFoundForAccount
    if payload.first_name is not None:
        user.name = (
            f"{payload.first_name} {payload.last_name}".strip()
            if payload.last_name
            else payload.first_name
        )
    if payload.last_name is not None:
        user.last_name = payload.last_name
    if payload.email is not None:
        user.email = payload.email
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def delete_user(session: Session, account_id: int, user_id: int) -> None:
    user = session.get(User, user_id)
    if not user or user.account_id != account_id:
        raise UserNotFoundForAccount
    session.delete(user)
    session.commit()
