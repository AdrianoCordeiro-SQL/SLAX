# Rotas HTTP do prefixo /alerts: regras, avaliação manual e histórico de disparos.

from __future__ import annotations

import json
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from ..auth import get_current_account
from ..database import get_session
from ..models import Account, AlertRule
from ..schemas import (
    AlertEvaluateItem,
    AlertEvaluateResponse,
    AlertFiringsResponse,
    AlertFiringOut,
    AlertRuleCreate,
    AlertRuleOut,
    AlertRuleUpdate,
)
from ..services import alerts as alerts_service

router = APIRouter(prefix="/alerts", tags=["alerts"])

SessionDep = Annotated[Session, Depends(get_session)]
CurrentAccount = Annotated[Account, Depends(get_current_account)]


def _rule_to_out(rule: AlertRule) -> AlertRuleOut:
    if rule.id is None:
        raise ValueError("Regra sem id")
    return AlertRuleOut(
        id=rule.id,
        account_id=rule.account_id,
        rule_type=rule.rule_type,
        params=json.loads(rule.params_json) if rule.params_json else {},
        enabled=rule.enabled,
        cooldown_hours=rule.cooldown_hours,
        created_at=rule.created_at,
        updated_at=rule.updated_at,
    )


@router.get("/rules", response_model=list[AlertRuleOut])
def get_alert_rules(session: SessionDep, account: CurrentAccount):
    rules = alerts_service.list_rules(session, account.id)
    return [_rule_to_out(r) for r in rules]


@router.post("/rules", response_model=AlertRuleOut, status_code=201)
def post_alert_rule(
    body: AlertRuleCreate,
    session: SessionDep,
    account: CurrentAccount,
):
    try:
        rule = alerts_service.create_rule(
            session,
            account.id,
            body.rule_type,
            body.params,
            body.enabled,
            body.cooldown_hours,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return _rule_to_out(rule)


@router.put("/rules/{rule_id}", response_model=AlertRuleOut)
def put_alert_rule(
    rule_id: int,
    body: AlertRuleUpdate,
    session: SessionDep,
    account: CurrentAccount,
):
    try:
        rule = alerts_service.update_rule(
            session,
            account.id,
            rule_id,
            rule_type=body.rule_type,
            params=body.params,
            enabled=body.enabled,
            cooldown_hours=body.cooldown_hours,
        )
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return _rule_to_out(rule)


@router.delete("/rules/{rule_id}", status_code=204)
def delete_alert_rule(
    rule_id: int,
    session: SessionDep,
    account: CurrentAccount,
):
    try:
        alerts_service.delete_rule(session, account.id, rule_id)
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.post("/evaluate", response_model=AlertEvaluateResponse)
def post_evaluate_alerts(session: SessionDep, account: CurrentAccount):
    fired = alerts_service.evaluate_all_enabled(session, account.id)
    return AlertEvaluateResponse(
        fired=[AlertEvaluateItem(**x) for x in fired]
    )


@router.get("/firings", response_model=AlertFiringsResponse)
def get_alert_firings(
    session: SessionDep,
    account: CurrentAccount,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    data = alerts_service.list_firings(session, account.id, page, per_page)
    items: list[AlertFiringOut] = []
    for it in data["items"]:
        snap_raw = it.get("snapshot_json") or "{}"
        try:
            snapshot = json.loads(snap_raw) if isinstance(snap_raw, str) else snap_raw
        except json.JSONDecodeError:
            snapshot = {}
        items.append(
            AlertFiringOut(
                id=it["id"],
                rule_id=it["rule_id"],
                fired_at=it["fired_at"],
                message=it["message"],
                snapshot=snapshot,
                notified=it["notified"],
            )
        )
    return AlertFiringsResponse(
        items=items,
        total=data["total"],
        page=data["page"],
        per_page=data["per_page"],
        pages=data["pages"],
    )
