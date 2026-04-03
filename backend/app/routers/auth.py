from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..auth import (
    authenticate,
    create_access_token,
    get_current_account,
    hash_password,
    verify_password,
)
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

router = APIRouter(prefix="/auth", tags=["auth"])

SessionDep = Annotated[Session, Depends(get_session)]
CurrentAccount = Annotated[Account, Depends(get_current_account)]


@router.post("/register", status_code=201, response_model=AuthResponse)
def register(payload: RegisterRequest, session: SessionDep):
    existing = session.exec(select(Account).where(Account.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    account = Account(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    session.add(account)
    session.commit()
    session.refresh(account)
    token = create_access_token(account.id, account.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "account": {
            "id": account.id,
            "email": account.email,
            "name": account.name,
            "avatar_url": account.avatar_url,
        },
    }


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, session: SessionDep):
    account = authenticate(payload.email, payload.password, session)
    if not account:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(account.id, account.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "account": {
            "id": account.id,
            "email": account.email,
            "name": account.name,
            "avatar_url": account.avatar_url,
        },
    }


@router.get("/me", response_model=AccountOut)
def get_me(account: CurrentAccount):
    return {
        "id": account.id,
        "email": account.email,
        "name": account.name,
        "avatar_url": account.avatar_url,
    }


@router.patch("/me", response_model=AccountOut)
def update_me(payload: AccountUpdate, account: CurrentAccount, session: SessionDep):
    if payload.name is not None:
        account.name = payload.name
    if payload.avatar_url is not None:
        account.avatar_url = payload.avatar_url
    session.add(account)
    session.commit()
    session.refresh(account)
    return {
        "id": account.id,
        "email": account.email,
        "name": account.name,
        "avatar_url": account.avatar_url,
    }


@router.post("/change-password", status_code=204)
def change_password(payload: PasswordChange, account: CurrentAccount, session: SessionDep):
    if not verify_password(payload.current_password, account.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    account.hashed_password = hash_password(payload.new_password)
    session.add(account)
    session.commit()
