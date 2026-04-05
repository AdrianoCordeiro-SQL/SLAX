import os
from datetime import datetime, timezone

import jwt
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from sqlmodel import Session

from ..auth_tokens import decode_access_token
from ..database import engine
from ..models import APILog

# Persiste cada request autenticada em APILog para alimentar dashboard e relatórios.

_PUBLIC_PATHS = frozenset(
    {
        "/",
        "/auth/register",
        "/auth/login",
        "/openapi.json",
        "/redoc",
        "/docs",
        "/favicon.ico",
    }
)


def request_audit_log_enabled() -> bool:
    """When unset, auditing is on (demo-friendly). Set REQUEST_AUDIT_LOG=false to disable."""
    raw = os.getenv("REQUEST_AUDIT_LOG")
    if raw is None or raw.strip() == "":
        return True
    return raw.strip().lower() in ("1", "true", "yes", "on")


def _should_skip_path(path: str) -> bool:
    if path in _PUBLIC_PATHS:
        return True
    if path.startswith("/docs"):
        return True
    return False


def _account_id_from_authorization(header: str | None) -> int | None:
    if not header or not header.startswith("Bearer "):
        return None
    token = header[7:].strip()
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        return int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError, TypeError):
        return None


def _persist_log(account_id: int, method: str, path: str, status_code: int) -> None:
    action = f"{method.upper()} {path}"
    status_label = "Success" if 200 <= status_code < 400 else "Failed"
    ts = datetime.now(timezone.utc)
    try:
        with Session(engine) as session:
            session.add(
                APILog(
                    account_id=account_id,
                    user_id=None,
                    action=action,
                    status=status_label,
                    timestamp=ts,
                )
            )
            session.commit()
    except Exception:
        pass


class AuditLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        if not request_audit_log_enabled():
            return await call_next(request)

        if request.method == "OPTIONS":
            return await call_next(request)

        path = request.url.path
        if _should_skip_path(path):
            return await call_next(request)

        response = await call_next(request)

        account_id = _account_id_from_authorization(request.headers.get("Authorization"))
        if account_id is None:
            return response

        _persist_log(account_id, request.method, path, response.status_code)
        return response
