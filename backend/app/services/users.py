import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete
from sqlmodel import Session, col, func, select

from ..exceptions import UserNotFoundForAccount
from ..models import APILog, RevenueMetric, User
from ..schemas import UserCreate, UserUpdate

# Operações de CRUD em User restritas ao account_id do tenant autenticado.

ELECTRONIC_PRODUCT_PRICE_RANGES = {
    "iPhone 15": (4500.0, 12000.0),
    "Smartphone Galaxy S24": (3200.0, 9500.0),
    "Notebook Gamer RTX": (7000.0, 20000.0),
    "Notebook Ultrafino": (3500.0, 12000.0),
    "Smart TV 55 OLED": (3800.0, 11000.0),
    "Monitor 27 4K": (1400.0, 5500.0),
    "Fone Bluetooth ANC": (180.0, 600.0),
    "Mouse Gamer RGB": (120.0, 500.0),
    "Teclado Mecânico": (220.0, 900.0),
    "Caixa de Som Bluetooth": (200.0, 1200.0),
    "Smartwatch Pro": (900.0, 4200.0),
    "PS5": (2500.0, 6000.0),
    "Xbox Series X": (2500.0, 6000.0),
    "Nintendo Switch": (2500.0, 6000.0),
    "Tablet Premium": (2800.0, 9000.0),
    "Placa de Vídeo High-End": (4500.0, 15000.0),
    "Câmera Mirrorless vlogger": (3500.0, 12000.0),
    "Projetor Smart Portátil": (1500.0, 6000.0),
    "Microfone Condensador USB": (350.0, 2200.0),
    "SSD Externo 2TB": (800.0, 2500.0),
    "Roteador Mesh Wi-Fi 6": (400.0, 3000.0),
    "Webcam 4K Professional": (600.0, 1800.0),
    "Cadeira Gamer Ergonômica": (900.0, 4500.0),
    "E-reader": (450.0, 2800.0),
}


def _random_timestamp_within_days(days: int) -> datetime:
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=days)
    total_seconds = int((now - start).total_seconds())
    return start + timedelta(seconds=random.randint(0, total_seconds))


def _price_for_product(product_name: str) -> float:
    min_price, max_price = ELECTRONIC_PRODUCT_PRICE_RANGES[product_name]
    return round(min(random.uniform(min_price, max_price), 20_000.0), 2)


def _add_platform_activity(
    session: Session,
    account_id: int,
    user_id: int,
    user_name: str,
) -> None:
    product_names = list(ELECTRONIC_PRODUCT_PRICE_RANGES.keys())
    event_count = random.randint(5, 15)
    existing_totals = session.exec(
        select(
            func.count(col(APILog.id)),
            func.count(col(APILog.id)).filter(
                APILog.action.ilike("Produto % devolvido pelo cliente %")
            ),
        ).where(APILog.account_id == account_id)
    ).one()
    existing_total_events = int(existing_totals[0] or 0)
    existing_returns = int(existing_totals[1] or 0)

    target_returns = round((existing_total_events + event_count) * 0.10)
    returns_to_generate = max(0, min(event_count, target_returns - existing_returns))
    event_types = ["return"] * returns_to_generate + [
        random.choice(["comment", "cart", "purchase"])
        for _ in range(event_count - returns_to_generate)
    ]
    random.shuffle(event_types)

    for index, event_type in enumerate(event_types):
        # Ensure at least one recent event to show up in default report windows.
        timestamp = _random_timestamp_within_days(30 if index == 0 else 365)
        product_name = random.choice(product_names)

        if event_type == "comment":
            action = f"Adicionou um comentário ao produto {product_name}"
        elif event_type == "cart":
            action = f"Adicionou {product_name} ao carrinho"
        elif event_type == "return":
            action = f"Produto {product_name} devolvido pelo cliente {user_name}"
            session.add(
                RevenueMetric(
                    account_id=account_id,
                    value=-_price_for_product(product_name),
                    recorded_at=timestamp,
                )
            )
        else:
            action = f"Comprou {product_name}"
            session.add(
                RevenueMetric(
                    account_id=account_id,
                    value=_price_for_product(product_name),
                    recorded_at=timestamp,
                )
            )

        session.add(
            APILog(
                account_id=account_id,
                user_id=user_id,
                action=action,
                status="Success",
                timestamp=timestamp,
            )
        )


def list_users(session: Session, account_id: int) -> list[User]:
    return session.exec(
        select(User)
        .where(User.account_id == account_id)
        .order_by(col(User.created_at).desc())
    ).all()


def create_user(session: Session, account_id: int, payload: UserCreate) -> User:
    full_name = (
        f"{payload.first_name} {payload.last_name}".strip()
        if payload.last_name
        else payload.first_name
    )
    user = User(
        name=full_name,
        last_name=payload.last_name,
        email=payload.email,
        avatar_url=payload.avatar_url,
        product=payload.product,
        product_value=payload.value,
        account_id=account_id,
    )
    session.add(user)
    session.flush()
    session.refresh(user)
    session.add(
        APILog(
            account_id=account_id,
            user_id=user.id,
            action=f"Comprou {payload.product}",
            status="Success",
        )
    )
    session.add(RevenueMetric(account_id=account_id, value=payload.value))
    if payload.generate_platform_activity:
        _add_platform_activity(session, account_id, user.id, user.name)
    session.commit()
    session.refresh(user)
    return user


def update_user(
    session: Session, account_id: int, user_id: int, payload: UserUpdate
) -> User:
    user = session.get(User, user_id)
    if not user or user.account_id != account_id:
        raise UserNotFoundForAccount
    if payload.first_name is not None:
        user.name = (
            f"{payload.first_name} {payload.last_name}".strip()
            if payload.last_name
            else payload.first_name
        )
    if payload.last_name is not None:
        user.last_name = payload.last_name
    if payload.email is not None:
        user.email = payload.email
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def delete_user(session: Session, account_id: int, user_id: int) -> None:
    user = session.get(User, user_id)
    if not user or user.account_id != account_id:
        raise UserNotFoundForAccount
    # Remove dependent API logs first to satisfy FK constraint in existing databases.
    session.exec(delete(APILog).where(APILog.user_id == user.id))
    session.delete(user)
    session.commit()
