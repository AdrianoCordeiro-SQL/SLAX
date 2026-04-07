from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from ..auth import authenticate, get_current_account
from ..database import get_session
from ..models import Account
from ..schemas import (
    AccountOut,
    AccountUpdate,
    AuthResponse,
    LoginRequest,
    PasswordChange,
    RegisterRequest,
)
from ..services.account import (
    account_to_auth_dict,
    build_auth_response,
    register_account,
    update_account_profile,
)

# Rotas HTTP do prefixo /auth: registro, login, leitura/atualização de perfil e troca de
# senha.

router = APIRouter(prefix="/auth", tags=["auth"])

SessionDep = Annotated[Session, Depends(get_session)]
CurrentAccount = Annotated[Account, Depends(get_current_account)]


@router.post("/register", status_code=201, response_model=AuthResponse)
def register(payload: RegisterRequest, session: SessionDep):
    account = register_account(session, payload)
    return build_auth_response(account)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, session: SessionDep):
    account = authenticate(payload.email, payload.password, session)
    if not account:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return build_auth_response(account)


@router.get("/me", response_model=AccountOut)
def get_me(account: CurrentAccount):
    return account_to_auth_dict(account)


@router.patch("/me", response_model=AccountOut)
def update_me(payload: AccountUpdate, account: CurrentAccount, session: SessionDep):
    updated = update_account_profile(session, account, payload)
    return account_to_auth_dict(updated)


@router.post("/change-password", status_code=204)
def change_password(
    payload: PasswordChange, account: CurrentAccount, session: SessionDep
):
    raise HTTPException(status_code=403, detail="Função bloqueada temporariamente")
