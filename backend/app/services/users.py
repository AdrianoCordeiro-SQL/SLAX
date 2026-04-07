from sqlalchemy import delete
from sqlmodel import Session, col, select

from ..exceptions import UserNotFoundForAccount
from ..models import APILog, RevenueMetric, User
from ..schemas import UserCreate, UserUpdate
from .user_activity import RevenueRecorder, UserActivityGenerator

# Operações de CRUD em User restritas ao account_id do tenant autenticado.


def list_users(session: Session, account_id: int) -> list[User]:
    return list(
        session.exec(
        select(User)
        .where(User.account_id == account_id)
        .order_by(col(User.created_at).desc())
        ).all()
    )


def create_user(session: Session, account_id: int, payload: UserCreate) -> User:
    full_name = (
        f"{payload.first_name} {payload.last_name}".strip()
        if payload.last_name
        else payload.first_name
    )
    user = User(
        name=full_name,
        last_name=payload.last_name,
        email=payload.email,
        avatar_url=payload.avatar_url,
        product=payload.product,
        product_value=payload.value,
        account_id=account_id,
    )
    session.add(user)
    session.flush()
    session.refresh(user)
    if user.id is None:
        raise RuntimeError("Falha ao persistir usuário")
    user_id = user.id
    if payload.product:
        UserActivityGenerator.add_initial_purchase_log(
            session,
            account_id=account_id,
            user_id=user_id,
            product=payload.product,
        )
    if payload.value is not None:
        RevenueRecorder.record_purchase(
            session,
            account_id=account_id,
            user_id=user_id,
            amount=payload.value,
        )
    if payload.generate_platform_activity:
        UserActivityGenerator.add_platform_activity(
            session,
            account_id=account_id,
            user_id=user_id,
            user_name=user.name,
        )
    session.commit()
    session.refresh(user)
    return user


def update_user(
    session: Session, account_id: int, user_id: int, payload: UserUpdate
) -> User:
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
    if user.id is None:
        raise RuntimeError("Usuário inválido para remoção")
    uid = user.id
    # Remove dependent API logs first to satisfy FK constraint in existing databases.
    session.exec(delete(APILog).where(APILog.user_id == uid))
    session.exec(
        delete(RevenueMetric).where(
            RevenueMetric.account_id == account_id,
            RevenueMetric.user_id == uid,
        )
    )
    session.delete(user)
    session.commit()
