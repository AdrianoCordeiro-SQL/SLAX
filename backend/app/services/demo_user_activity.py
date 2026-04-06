import random
from datetime import datetime, timedelta, timezone

from sqlmodel import Session

from ..models import APILog, RevenueMetric
from ..payment_demo_constants import (
    PAYMENT_DEMO_ACTIONS,
    PAYMENT_DEMO_STATUSES,
    PAYMENT_DEMO_STATUS_WEIGHTS,
)

# Insere APILog e RevenueMetric fictícios para povoar métricas ao criar um cliente (demo).

_VOLUME_RANGES: dict[str, tuple[tuple[int, int], tuple[int, int]]] = {
    "light": ((15, 30), (5, 10)),
    "medium": ((40, 70), (12, 20)),
    "heavy": ((100, 160), (25, 30)),
}


def _random_timestamp_in_window(now: datetime, start: datetime) -> datetime:
    delta_sec = int((now - start).total_seconds())
    if delta_sec <= 0:
        return now
    offset = random.randint(0, delta_sec)
    return start + timedelta(seconds=offset)


def insert_demo_activity(session: Session, account_id: int, user_id: int, volume: str) -> None:
    """Adiciona à sessão (sem commit) logs e métricas de receita nos últimos 30 dias."""

    now = datetime.now(timezone.utc)
    window_start = now - timedelta(days=30)

    ranges = _VOLUME_RANGES.get(volume, _VOLUME_RANGES["medium"])
    (log_lo, log_hi), (rev_lo, rev_hi) = ranges
    n_logs = random.randint(log_lo, log_hi)
    n_revenue = random.randint(rev_lo, rev_hi)

    for _ in range(n_logs):
        ts = _random_timestamp_in_window(now, window_start)
        action = random.choice(PAYMENT_DEMO_ACTIONS)
        status = random.choices(PAYMENT_DEMO_STATUSES, weights=PAYMENT_DEMO_STATUS_WEIGHTS, k=1)[0]
        session.add(
            APILog(
                account_id=account_id,
                user_id=user_id,
                action=action,
                status=status,
                timestamp=ts,
            )
        )

    for _ in range(n_revenue):
        ts = _random_timestamp_in_window(now, window_start)
        value = round(random.uniform(50.0, 650.0), 2)
        session.add(RevenueMetric(account_id=account_id, value=value, recorded_at=ts))
