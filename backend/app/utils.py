from datetime import datetime, timedelta, timezone
from typing import Optional

# Funções puras auxiliares: intervalo de datas para relatórios e formatação de variação percentual.


def parse_period(
    start: Optional[str], end: Optional[str]
) -> tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)
    if end:
        period_end = datetime.fromisoformat(end).replace(tzinfo=timezone.utc)
    else:
        period_end = now
    if start:
        period_start = datetime.fromisoformat(start).replace(tzinfo=timezone.utc)
    else:
        period_start = period_end - timedelta(days=30)
    return period_start, period_end


def pct_change(current: float, previous: float) -> str:
    if previous == 0:
        return "+100%" if current > 0 else "0%"
    change = ((current - previous) / previous) * 100
    sign = "+" if change >= 0 else ""
    return f"{sign}{change:.1f}%"
