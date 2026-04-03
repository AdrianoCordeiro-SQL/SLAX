from sqlmodel import Session

from ..models import APILog, User


def serialize_api_log_row(session: Session, log: APILog) -> dict:
    user = session.get(User, log.user_id) if log.user_id else None
    return {
        "id": log.id,
        "user": user.name if user else "Unknown",
        "avatar_url": user.avatar_url if user else None,
        "action": log.action,
        "timestamp": log.timestamp.isoformat(),
        "status": log.status,
    }
