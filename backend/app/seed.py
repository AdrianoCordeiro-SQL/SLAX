import random
import os
from datetime import datetime, timedelta, timezone

from sqlmodel import Session, select

from .auth import hash_password
from .database import create_db_and_tables, engine
from .models import Account, APILog, RevenueMetric, User
from .payment_demo_constants import (
    PAYMENT_DEMO_ACTIONS,
    PAYMENT_DEMO_STATUS_WEIGHTS,
    PAYMENT_DEMO_STATUSES,
)

# Script para popular o banco com conta de demonstração, usuários, logs e métricas sintéticas.

USERS = [
    ("Carlos Martins", "https://i.pravatar.cc/150?img=1"),
    ("Bruno Costa", "https://i.pravatar.cc/150?img=2"),
    ("Fernando Souza", "https://i.pravatar.cc/150?img=3"),
    ("Diego Ferreira", "https://i.pravatar.cc/150?img=4"),
    ("Elena Rocha", "https://i.pravatar.cc/150?img=5"),
    ("Felipe Nunes", "https://i.pravatar.cc/150?img=6"),
    ("Gabriel Lima", "https://i.pravatar.cc/150?img=7"),
    ("Hugo Mendes", "https://i.pravatar.cc/150?img=8"),
    ("Isabela Torres", "https://i.pravatar.cc/150?img=9"),
    ("Joana Pereira", "https://i.pravatar.cc/150?img=10"),
]

DEMO_ACCOUNT_EMAIL = os.getenv("DEMO_LOGIN_EMAIL", "admin@slax.com").strip() or "admin@slax.com"
DEMO_ACCOUNT_PASSWORD = os.getenv("DEMO_LOGIN_PASSWORD", "admin123")


def seed():
    print("[seed] Iniciando seed de demonstração...")
    with Session(engine) as session:
        admin = session.exec(
            select(Account).where(Account.email == DEMO_ACCOUNT_EMAIL)
        ).first()
        if not admin:
            admin = Account(
                email=DEMO_ACCOUNT_EMAIL,
                hashed_password=hash_password(DEMO_ACCOUNT_PASSWORD),
                name="Admin",
            )
            session.add(admin)
            session.commit()
            session.refresh(admin)
            print(f"[seed] Conta demo criada: {DEMO_ACCOUNT_EMAIL}")
        else:
            print(f"[seed] Conta demo já existe: {DEMO_ACCOUNT_EMAIL}")

        if session.exec(select(User)).first():
            print("[seed] Banco já possui usuários. Seed de massa demo ignorado.")
            return

        now = datetime.now(timezone.utc)

        users = []
        for i, (name, avatar_url) in enumerate(USERS):
            days_ago = random.randint(5, 60)
            created_at = now - timedelta(days=days_ago, hours=random.randint(0, 23))
            user = User(
                name=name,
                avatar_url=avatar_url,
                created_at=created_at,
                account_id=admin.id,
            )
            session.add(user)
            users.append(user)

        session.flush()

        for day_offset in range(29, -1, -1):
            day_start = (now - timedelta(days=day_offset)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            num_logs = random.randint(5, 15)
            for _ in range(num_logs):
                user = random.choice(users)
                action = random.choice(PAYMENT_DEMO_ACTIONS)
                status = random.choices(
                    PAYMENT_DEMO_STATUSES, weights=PAYMENT_DEMO_STATUS_WEIGHTS, k=1
                )[0]
                timestamp = day_start + timedelta(
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59),
                    seconds=random.randint(0, 59),
                )
                log = APILog(
                    user_id=user.id,
                    account_id=admin.id,
                    action=action,
                    status=status,
                    timestamp=timestamp,
                )
                session.add(log)

        for day_offset in range(29, -1, -1):
            recorded_at = (now - timedelta(days=day_offset)).replace(
                hour=12, minute=0, second=0, microsecond=0
            )
            value = round(random.uniform(200.0, 900.0), 2)
            metric = RevenueMetric(
                value=value, recorded_at=recorded_at, account_id=admin.id
            )
            session.add(metric)

        session.commit()
        print(
            f"[seed] Seed concluído: {len(users)} usuários, logs e métricas de receita inseridos."
        )


if __name__ == "__main__":
    create_db_and_tables()
    seed()
