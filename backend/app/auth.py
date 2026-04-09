from datetime import UTC, datetime
from functools import lru_cache
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from sqlmodel import Session, select

from .auth_tokens import decode_access_token
from .database import get_session
from .models import Account

# Senhas com bcrypt, login por e-mail/senha e dependency que resolve a conta a partir do
# Bearer JWT.

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()


@lru_cache(maxsize=2048)
def _decode_access_token_cached(token: str) -> tuple[int, int | None]:
    payload = decode_access_token(token)
    account_id = int(payload["sub"])
    exp = payload.get("exp")
    if isinstance(exp, datetime):
        exp_ts = int(exp.timestamp())
    elif isinstance(exp, (int, float)):
        exp_ts = int(exp)
    else:
        exp_ts = None
    return account_id, exp_ts


def _resolve_account_id_from_token(token: str) -> int:
    account_id, exp_ts = _decode_access_token_cached(token)
    # Protege contra aceitação de token expirado após acerto em cache.
    if exp_ts is not None and int(datetime.now(UTC).timestamp()) >= exp_ts:
        _decode_access_token_cached.cache_clear()
        raise jwt.ExpiredSignatureError("Token expired")
    return account_id


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def get_current_account(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    session: Annotated[Session, Depends(get_session)],
) -> Account:
    try:
        account_id = _resolve_account_id_from_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired"
        ) from None
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from None
    account = session.get(Account, account_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Account not found"
        )
    return account


def authenticate(email: str, password: str, session: Session) -> Account | None:
    account = session.exec(select(Account).where(Account.email == email)).first()
    if not account or not verify_password(password, account.hashed_password):
        return None
    return account
