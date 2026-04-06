"""Testes das funções puras em app.utils (períodos e variação percentual)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from freezegun import freeze_time

from app.utils import parse_period, pct_change


def test_parse_period_start_end_fixos_utc():
    """Com start e end ISO, o intervalo e o fuso UTC estão corretos."""

    start, end = parse_period(
        "2024-01-01T10:00:00+00:00",
        "2024-01-11T10:00:00+00:00",
    )
    assert start.tzinfo == UTC
    assert end.tzinfo == UTC
    assert end - start == timedelta(days=10)


@freeze_time("2024-06-15T12:00:00+00:00")
def test_parse_period_so_end_usa_agora_como_limite_e_retrocede_30_dias():
    """Sem start, period_end é 'agora' e period_start é 30 dias antes."""

    period_start, period_end = parse_period(None, "2024-06-15T18:00:00+00:00")
    assert period_end == datetime(2024, 6, 15, 18, 0, 0, tzinfo=UTC)
    assert period_start == period_end - timedelta(days=30)


@freeze_time("2024-06-15T12:00:00+00:00")
def test_parse_period_so_start_usa_agora_como_fim():
    """Sem end, period_end é o instante atual (UTC)."""

    period_start, period_end = parse_period("2024-05-01T00:00:00+00:00", None)
    assert period_end == datetime(2024, 6, 15, 12, 0, 0, tzinfo=UTC)
    assert period_start == datetime(2024, 5, 1, 0, 0, 0, tzinfo=UTC)


def test_parse_period_end_date_inclui_dia_final():
    """Quando end vem como YYYY-MM-DD, inclui o dia inteiro na janela."""

    period_start, period_end = parse_period("2024-01-01", "2024-01-11")
    assert period_start == datetime(2024, 1, 1, 0, 0, 0, tzinfo=UTC)
    assert period_end == datetime(2024, 1, 12, 0, 0, 0, tzinfo=UTC)


def test_pct_change_previous_zero_current_positivo():
    """Quando previous é 0 e current > 0, retorna +100%."""

    assert pct_change(10, 0) == "+100%"


def test_pct_change_ambos_zero():
    """Quando ambos são 0, retorna 0%."""

    assert pct_change(0, 0) == "0%"


def test_pct_change_positivo_e_negativo():
    """Formata uma casa decimal com sinal + ou -."""

    assert pct_change(150, 100) == "+50.0%"
    assert pct_change(75, 100) == "-25.0%"


def test_pct_change_current_zero_previous_positivo():
    """Queda total para zero."""

    assert pct_change(0, 40) == "-100.0%"
