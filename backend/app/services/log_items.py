from collections.abc import Mapping

from sqlmodel import Session

from ..models import APILog, User

# Converte um registro APILog em dicionário para respostas da API (nome e avatar do
# usuário).


def serialize_api_log_row(
    session: Session,
    log: APILog,
    users_by_id: Mapping[int, User] | None = None,
) -> dict:
    user: User | None
    if users_by_id is not None and log.user_id is not None:
        user = users_by_id.get(log.user_id)
    else:
        user = session.get(User, log.user_id) if log.user_id else None
    return {
        "id": log.id,
        "user": user.name if user else "Unknown",
        "avatar_url": user.avatar_url if user else None,
        "action": log.action,
        "timestamp": log.timestamp.isoformat(),
        "status": log.status,
    }
