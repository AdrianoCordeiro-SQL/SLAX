from datetime import datetime, timedelta, timezone
from typing import Optional

# Funções puras auxiliares: intervalo de datas para relatórios e formatação de variação percentual.


def parse_period(
    start: Optional[str], end: Optional[str]
) -> tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)

    def _parse_iso(value: str) -> datetime:
        parsed = datetime.fromisoformat(value)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        else:
            parsed = parsed.astimezone(timezone.utc)
        return parsed

    if end:
        period_end = _parse_iso(end)
        if len(end) == 10:
            # Date-only filter should include the whole day while keeping "< period_end" queries.
            period_end = period_end + timedelta(days=1)
    else:
        period_end = now
    if start:
        period_start = _parse_iso(start)
    else:
        period_start = period_end - timedelta(days=30)
    return period_start, period_end


def pct_change(current: float, previous: float) -> str:
    if previous == 0:
        return "+100%" if current > 0 else "0%"
    change = ((current - previous) / previous) * 100
    sign = "+" if change >= 0 else ""
    return f"{sign}{change:.1f}%"
