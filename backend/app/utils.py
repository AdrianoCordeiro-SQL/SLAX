from datetime import UTC, datetime, timedelta

# Funções puras auxiliares: intervalo de datas para relatórios e formatação de variação
# percentual.


def parse_period(start: str | None, end: str | None) -> tuple[datetime, datetime]:
    now = datetime.now(UTC)

    def _parse_iso(value: str) -> datetime:
        parsed = datetime.fromisoformat(value)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=UTC)
        else:
            parsed = parsed.astimezone(UTC)
        return parsed

    if end:
        period_end = _parse_iso(end)
        if len(end) == 10:
            # Date-only: include the whole day; queries still use "< period_end".
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
