# Regras de alerta operacional: métricas, avaliação e histórico de disparos.

from __future__ import annotations

import json
import math
from datetime import UTC, datetime, timedelta
from typing import Any

from pydantic import BaseModel, Field
from sqlalchemy import delete
from sqlmodel import Session, col, func, select

from ..models import AlertFiring, AlertRule, APILog, RevenueMetric

RULE_TYPES = frozenset({"returns_rate_above", "revenue_drop", "days_without_purchase"})
MAX_RULES_PER_ACCOUNT = 10


class ReturnsRateParams(BaseModel):
    window_days: int = Field(default=7, ge=1, le=365)
    max_percent: float = Field(ge=0, le=100)
    min_events: int = Field(default=5, ge=1, le=10_000)


class RevenueDropParams(BaseModel):
    window_days: int = Field(default=7, ge=1, le=365)
    drop_percent: float = Field(default=20, ge=0, le=100)


class DaysWithoutPurchaseParams(BaseModel):
    min_days: int = Field(default=7, ge=1, le=365)


def _parse_params(rule_type: str, raw: str) -> dict[str, Any]:
    try:
        data = json.loads(raw) if raw else {}
    except json.JSONDecodeError as e:
        raise ValueError("params_json inválido") from e
    if rule_type == "returns_rate_above":
        return ReturnsRateParams.model_validate(data).model_dump()
    if rule_type == "revenue_drop":
        return RevenueDropParams.model_validate(data).model_dump()
    if rule_type == "days_without_purchase":
        return DaysWithoutPurchaseParams.model_validate(data).model_dump()
    raise ValueError("Tipo de regra desconhecido")


def _pct_change_numeric(current: float, previous: float) -> float:
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return ((current - previous) / previous) * 100.0


def _now_utc() -> datetime:
    return datetime.now(UTC)


def _unwrap_scalar(val: datetime | tuple[Any, ...] | Any | None) -> datetime | None:
    """Extrai um único valor de .first()/.one() (escalar ou Row de uma coluna)."""
    if val is None:
        return None
    if isinstance(val, datetime):
        return val
    try:
        return val[0]  # type: ignore[index]
    except (TypeError, KeyError, IndexError):
        return None


def _scalar_int(val: Any) -> int:
    if isinstance(val, tuple):
        return int(val[0])
    return int(val)


def _metric_returns_rate(
    session: Session, account_id: int, window_days: int, min_events: int
) -> tuple[float | None, dict[str, Any]]:
    end = _now_utc()
    start = end - timedelta(days=window_days)
    aid = account_id
    purchases = _scalar_int(
        session.exec(
            select(func.count(col(APILog.id))).where(
                APILog.account_id == aid,
                APILog.timestamp >= start,
                APILog.timestamp < end,
                APILog.action.startswith("Comprou "),
            )
        ).one()
    )
    returns_count = _scalar_int(
        session.exec(
            select(func.count(col(APILog.id))).where(
                APILog.account_id == aid,
                APILog.timestamp >= start,
                APILog.timestamp < end,
                APILog.action.ilike("Produto % devolvido pelo cliente %"),
            )
        ).one()
    )
    denom = purchases + returns_count
    if denom < min_events:
        return None, {
            "purchases": purchases,
            "returns": returns_count,
            "denominator": denom,
            "min_events": min_events,
            "reason": "denominador_menor_que_minimo",
        }
    rate = (returns_count / denom) * 100.0
    return rate, {
        "purchases": purchases,
        "returns": returns_count,
        "denominator": denom,
        "returns_rate_percent": round(rate, 2),
        "window_days": window_days,
    }


def _metric_revenue_drop(
    session: Session, account_id: int, window_days: int
) -> tuple[float | None, float | None, dict[str, Any]]:
    end = _now_utc()
    cur_start = end - timedelta(days=window_days)
    prev_end = cur_start
    prev_start = prev_end - timedelta(days=window_days)
    aid = account_id

    cur_rev = session.exec(
        select(func.sum(RevenueMetric.value)).where(
            RevenueMetric.account_id == aid,
            RevenueMetric.recorded_at >= cur_start,
            RevenueMetric.recorded_at < end,
        )
    ).one()
    cur_rev = float(cur_rev or 0.0)

    prev_rev = session.exec(
        select(func.sum(RevenueMetric.value)).where(
            RevenueMetric.account_id == aid,
            RevenueMetric.recorded_at >= prev_start,
            RevenueMetric.recorded_at < prev_end,
        )
    ).one()
    prev_rev = float(prev_rev or 0.0)

    snap = {
        "current_revenue": round(cur_rev, 2),
        "previous_revenue": round(prev_rev, 2),
        "window_days": window_days,
        "current_start": cur_start.isoformat(),
        "previous_start": prev_start.isoformat(),
    }

    if prev_rev == 0 and cur_rev == 0:
        return None, None, {**snap, "reason": "sem_receita_nas_janelas"}
    if prev_rev == 0:
        return None, None, {**snap, "reason": "sem_receita_janela_anterior"}

    pct = _pct_change_numeric(cur_rev, prev_rev)
    return cur_rev, pct, {**snap, "pct_change": round(pct, 2)}


def _last_purchase_moment(session: Session, account_id: int) -> datetime | None:
    aid = account_id
    log_ts = _unwrap_scalar(
        session.exec(
            select(func.max(APILog.timestamp)).where(
                APILog.account_id == aid,
                APILog.action.startswith("Comprou "),
            )
        ).first()
    )

    metric_ts = _unwrap_scalar(
        session.exec(
            select(func.max(RevenueMetric.recorded_at)).where(
                RevenueMetric.account_id == aid,
                RevenueMetric.value > 0,
            )
        ).first()
    )

    candidates = [t for t in (log_ts, metric_ts) if t is not None]
    if not candidates:
        return None
    return max(candidates)


def _metric_days_without_purchase(
    session: Session, account_id: int
) -> tuple[int | None, dict[str, Any]]:
    last = _last_purchase_moment(session, account_id)
    if last is None:
        return None, {"last_purchase_at": None, "reason": "nunca_houve_compra"}
    now = _now_utc()
    if last.tzinfo is None:
        last = last.replace(tzinfo=UTC)
    else:
        last = last.astimezone(UTC)
    delta = now - last
    days = max(0, int(delta.total_seconds() // 86400))
    return days, {
        "last_purchase_at": last.isoformat(),
        "days_without_purchase": days,
    }


def _cooldown_ok(session: Session, rule_id: int, cooldown_hours: int) -> bool:
    if cooldown_hours <= 0:
        return True
    last = session.exec(
        select(AlertFiring.fired_at)
        .where(AlertFiring.rule_id == rule_id)
        .order_by(col(AlertFiring.fired_at).desc())
        .limit(1)
    ).first()
    if last is None:
        return True
    fired_at = last[0] if isinstance(last, tuple) else last
    if fired_at.tzinfo is None:
        fired_at = fired_at.replace(tzinfo=UTC)
    else:
        fired_at = fired_at.astimezone(UTC)
    return (fired_at + timedelta(hours=cooldown_hours)) <= _now_utc()


def evaluate_rule(session: Session, rule: AlertRule) -> dict[str, Any] | None:
    """Retorna dict com message e snapshot se a regra disparar; senão None."""
    if not rule.enabled:
        return None
    if rule.id is None:
        return None
    if not _cooldown_ok(session, rule.id, rule.cooldown_hours):
        return None

    params = _parse_params(rule.rule_type, rule.params_json)
    aid = rule.account_id

    if rule.rule_type == "returns_rate_above":
        rate, snap = _metric_returns_rate(
            session, aid, int(params["window_days"]), int(params["min_events"])
        )
        if rate is None:
            return None
        max_p = float(params["max_percent"])
        if rate <= max_p:
            return None
        msg = (
            f"Taxa de devoluções ({rate:.1f}%) acima do limite ({max_p}%) "
            f"nos últimos {params['window_days']} dias."
        )
        return {"message": msg, "snapshot": snap}

    if rule.rule_type == "revenue_drop":
        _, pct, snap = _metric_revenue_drop(session, aid, int(params["window_days"]))
        if pct is None:
            return None
        drop_p = float(params["drop_percent"])
        if pct >= -drop_p:
            return None
        msg = (
            f"Queda de receita de {abs(pct):.1f}% comparado ao período anterior "
            f"(limite: {drop_p}%)."
        )
        return {"message": msg, "snapshot": snap}

    if rule.rule_type == "days_without_purchase":
        days, snap = _metric_days_without_purchase(session, aid)
        if days is None:
            return None
        min_d = int(params["min_days"])
        if days < min_d:
            return None
        msg = f"Sem compras há {days} dias (limite: {min_d})."
        return {"message": msg, "snapshot": snap}

    return None


def evaluate_all_enabled(session: Session, account_id: int) -> list[dict[str, Any]]:
    rules = session.exec(
        select(AlertRule).where(AlertRule.account_id == account_id, AlertRule.enabled)
    ).all()
    fired: list[dict[str, Any]] = []
    for rule in rules:
        if rule.id is None:
            continue
        res = evaluate_rule(session, rule)
        if res is None:
            continue
        snap_str = json.dumps(res["snapshot"], ensure_ascii=False)
        firing = AlertFiring(
            account_id=account_id,
            rule_id=rule.id,
            message=res["message"],
            snapshot_json=snap_str,
            notified=False,
        )
        session.add(firing)
        session.commit()
        session.refresh(firing)
        fired.append(
            {
                "rule_id": rule.id,
                "firing_id": firing.id,
                "message": res["message"],
            }
        )
    return fired


def count_rules(session: Session, account_id: int) -> int:
    return _scalar_int(
        session.exec(
            select(func.count(col(AlertRule.id))).where(
                AlertRule.account_id == account_id
            )
        ).one()
    )


def create_rule(
    session: Session,
    account_id: int,
    rule_type: str,
    params: dict[str, Any],
    enabled: bool,
    cooldown_hours: int,
) -> AlertRule:
    if rule_type not in RULE_TYPES:
        raise ValueError("Tipo de regra inválido")
    if count_rules(session, account_id) >= MAX_RULES_PER_ACCOUNT:
        raise ValueError(f"Máximo de {MAX_RULES_PER_ACCOUNT} regras por conta")
    parsed = _parse_params(rule_type, json.dumps(params))
    now = _now_utc()
    rule = AlertRule(
        account_id=account_id,
        rule_type=rule_type,
        params_json=json.dumps(parsed, ensure_ascii=False),
        enabled=enabled,
        cooldown_hours=max(1, min(168, cooldown_hours)),
        created_at=now,
        updated_at=now,
    )
    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule


def update_rule(
    session: Session,
    account_id: int,
    rule_id: int,
    *,
    rule_type: str | None = None,
    params: dict[str, Any] | None = None,
    enabled: bool | None = None,
    cooldown_hours: int | None = None,
) -> AlertRule:
    rule = session.get(AlertRule, rule_id)
    if not rule or rule.account_id != account_id:
        raise LookupError("Regra não encontrada")
    if rule_type is not None:
        if rule_type not in RULE_TYPES:
            raise ValueError("Tipo de regra inválido")
        rule.rule_type = rule_type
    if params is not None:
        rule.params_json = json.dumps(
            _parse_params(rule.rule_type, json.dumps(params)), ensure_ascii=False
        )
    elif rule_type is not None:
        rule.params_json = json.dumps(
            _parse_params(rule.rule_type, rule.params_json), ensure_ascii=False
        )
    if enabled is not None:
        rule.enabled = enabled
    if cooldown_hours is not None:
        rule.cooldown_hours = max(1, min(168, cooldown_hours))
    rule.updated_at = _now_utc()
    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule


def delete_rule(session: Session, account_id: int, rule_id: int) -> None:
    rule = session.get(AlertRule, rule_id)
    if not rule or rule.account_id != account_id:
        raise LookupError("Regra não encontrada")
    session.exec(delete(AlertFiring).where(AlertFiring.rule_id == rule_id))
    session.delete(rule)
    session.commit()


def list_rules(session: Session, account_id: int) -> list[AlertRule]:
    return session.exec(
        select(AlertRule)
        .where(AlertRule.account_id == account_id)
        .order_by(col(AlertRule.id))
    ).all()


def list_firings(
    session: Session, account_id: int, page: int, per_page: int
) -> dict[str, Any]:
    page = max(1, page)
    per_page = min(100, max(1, per_page))
    total = _scalar_int(
        session.exec(
            select(func.count(col(AlertFiring.id))).where(
                AlertFiring.account_id == account_id
            )
        ).one()
    )
    pages = max(1, math.ceil(total / per_page))
    rows = session.exec(
        select(AlertFiring)
        .where(AlertFiring.account_id == account_id)
        .order_by(col(AlertFiring.fired_at).desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    ).all()
    items = []
    for r in rows:
        items.append(
            {
                "id": r.id,
                "rule_id": r.rule_id,
                "fired_at": r.fired_at.isoformat(),
                "message": r.message,
                "snapshot_json": r.snapshot_json,
                "notified": r.notified,
            }
        )
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages,
    }
