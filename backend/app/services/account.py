from sqlmodel import Session, select

from ..auth import hash_password, verify_password
from ..auth_tokens import create_access_token
from ..exceptions import EmailAlreadyRegistered, WrongCurrentPassword
from ..models import Account
from ..schemas import AccountUpdate, PasswordChange, RegisterRequest

# Regras de conta: registro, montagem da resposta de autenticação, perfil e alteração de senha.


def account_to_auth_dict(account: Account) -> dict:
    return {
        "id": account.id,
        "email": account.email,
        "name": account.name,
        "avatar_url": account.avatar_url,
    }


def build_auth_response(account: Account) -> dict:
    return {
        "access_token": create_access_token(account.id, account.email),
        "token_type": "bearer",
        "account": account_to_auth_dict(account),
    }


def register_account(session: Session, payload: RegisterRequest) -> Account:
    existing = session.exec(select(Account).where(Account.email == payload.email)).first()
    if existing:
        raise EmailAlreadyRegistered
    account = Account(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    session.add(account)
    session.commit()
    session.refresh(account)
    return account


def update_account_profile(session: Session, account: Account, payload: AccountUpdate) -> Account:
    if payload.name is not None:
        account.name = payload.name
    if payload.avatar_url is not None:
        account.avatar_url = payload.avatar_url
    session.add(account)
    session.commit()
    session.refresh(account)
    return account


def change_account_password(session: Session, account: Account, payload: PasswordChange) -> None:
    if not verify_password(payload.current_password, account.hashed_password):
        raise WrongCurrentPassword
    account.hashed_password = hash_password(payload.new_password)
    session.add(account)
    session.commit()
