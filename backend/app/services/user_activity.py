import random
from datetime import UTC, datetime, timedelta

from sqlmodel import Session, col, func, select

from ..models import APILog, RevenueMetric

# Geração de atividade sintética de plataforma e registro de receita/eventos para
# usuários recém-criados, sem acoplar essa responsabilidade ao CRUD de usuários.

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
    "Ar Condicionado Split Inverter": (2200.0, 5500.0),
    "Aspirador de Pó Robô": (800.0, 6000.0),
    "Drone 4K com GPS": (2500.0, 15000.0),
    "Gimbal para Smartphone": (500.0, 1800.0),
    "Headset Gamer Wireless": (450.0, 2500.0),
    "Home Theater Soundbar": (900.0, 8000.0),
    "Impressora Tanque de Tinta": (800.0, 2400.0),
    "Kindle Paperwhite": (700.0, 1500.0),
    "Lente Fotográfica 50mm": (800.0, 4500.0),
    "Memória RAM DDR5 32GB": (800.0, 2200.0),
    "Monitor Ultrawide 34": (2200.0, 7500.0),
    "Nobreak Senoidal": (900.0, 3500.0),
    "Placa-Mãe High-End": (1800.0, 6000.0),
    "Processador i9 / Ryzen 9": (3000.0, 6500.0),
    "SSD NVMe 4TB Gen4": (1500.0, 4800.0),
}


def _random_timestamp_within_days(days: int) -> datetime:
    now = datetime.now(UTC)
    start = now - timedelta(days=days)
    total_seconds = int((now - start).total_seconds())
    return start + timedelta(seconds=random.randint(0, total_seconds))


def _price_for_product(product_name: str) -> float:
    min_price, max_price = ELECTRONIC_PRODUCT_PRICE_RANGES[product_name]
    return round(min(random.uniform(min_price, max_price), 20_000.0), 2)


class RevenueRecorder:
    @staticmethod
    def record_purchase(
        session: Session, account_id: int, user_id: int, amount: float, when: datetime | None = None
    ) -> None:
        metric_data = {
            "account_id": account_id,
            "user_id": user_id,
            "value": amount,
        }
        if when is not None:
            metric_data["recorded_at"] = when
        session.add(RevenueMetric(**metric_data))

    @staticmethod
    def record_return(
        session: Session, account_id: int, user_id: int, amount: float, when: datetime
    ) -> None:
        session.add(
            RevenueMetric(
                account_id=account_id,
                user_id=user_id,
                value=-amount,
                recorded_at=when,
            )
        )


class UserActivityGenerator:
    @staticmethod
    def add_initial_purchase_log(
        session: Session, account_id: int, user_id: int, product: str
    ) -> None:
        session.add(
            APILog(
                account_id=account_id,
                user_id=user_id,
                action=f"Comprou {product}",
                status="Success",
            )
        )

    @staticmethod
    def add_platform_activity(
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
                    col(APILog.action).ilike("Produto % devolvido pelo cliente %")
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
            timestamp = _random_timestamp_within_days(30 if index == 0 else 365)
            product_name = random.choice(product_names)

            if event_type == "comment":
                action = f"Adicionou um comentário ao produto {product_name}"
            elif event_type == "cart":
                action = f"Adicionou {product_name} ao carrinho"
            elif event_type == "return":
                action = f"Produto {product_name} devolvido pelo cliente {user_name}"
                RevenueRecorder.record_return(
                    session,
                    account_id=account_id,
                    user_id=user_id,
                    amount=_price_for_product(product_name),
                    when=timestamp,
                )
            else:
                action = f"Comprou {product_name}"
                RevenueRecorder.record_purchase(
                    session,
                    account_id=account_id,
                    user_id=user_id,
                    amount=_price_for_product(product_name),
                    when=timestamp,
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
