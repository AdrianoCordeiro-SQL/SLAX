from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session

from ..auth import get_current_account
from ..database import get_session
from ..models import Account
from ..schemas import ActivityItem, UserCreate, UserOut, UserUpdate
from ..services.users import create_user, delete_user, list_user_activity, list_users
from ..services.users import update_user as update_user_svc

# Rotas HTTP do prefixo /users: listagem e CRUD de usuários do tenant autenticado.

router = APIRouter(prefix="/users", tags=["users"])

SessionDep = Annotated[Session, Depends(get_session)]
CurrentAccount = Annotated[Account, Depends(get_current_account)]


@router.get("/", response_model=list[UserOut])
def list_users_route(session: SessionDep, account: CurrentAccount):
    return list_users(session, account.id)


@router.post("/", status_code=201, response_model=UserOut)
def create_user_route(
    payload: UserCreate, session: SessionDep, account: CurrentAccount
):
    return create_user(session, account.id, payload)


@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int, payload: UserUpdate, session: SessionDep, account: CurrentAccount
):
    return update_user_svc(session, account.id, user_id, payload)


@router.delete("/{user_id}", status_code=204)
def delete_user_route(user_id: int, session: SessionDep, account: CurrentAccount):
    delete_user(session, account.id, user_id)


@router.get("/{user_id}/activity", response_model=list[ActivityItem])
def list_user_activity_route(
    user_id: int, session: SessionDep, account: CurrentAccount
):
    return list_user_activity(session, account.id, user_id)
