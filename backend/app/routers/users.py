from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, col, select

from ..auth import get_current_account
from ..database import get_session
from ..models import Account, User
from ..schemas import UserCreate, UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])

SessionDep = Annotated[Session, Depends(get_session)]
CurrentAccount = Annotated[Account, Depends(get_current_account)]


@router.get("/", response_model=list[UserOut])
def list_users(session: SessionDep, account: CurrentAccount):
    users = session.exec(
        select(User).where(User.account_id == account.id).order_by(col(User.created_at).desc())
    ).all()
    return users


@router.post("/", status_code=201, response_model=UserOut)
def create_user(payload: UserCreate, session: SessionDep, account: CurrentAccount):
    full_name = f"{payload.first_name} {payload.last_name}".strip() if payload.last_name else payload.first_name
    user = User(
        name=full_name,
        last_name=payload.last_name,
        email=payload.email,
        avatar_url=payload.avatar_url,
        account_id=account.id,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UserUpdate, session: SessionDep, account: CurrentAccount):
    user = session.get(User, user_id)
    if not user or user.account_id != account.id:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.first_name is not None:
        user.name = f"{payload.first_name} {payload.last_name}".strip() if payload.last_name else payload.first_name
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


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int, session: SessionDep, account: CurrentAccount):
    user = session.get(User, user_id)
    if not user or user.account_id != account.id:
        raise HTTPException(status_code=404, detail="User not found")
    session.delete(user)
    session.commit()
