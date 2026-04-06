import os

from sqlmodel import Session, select

from .auth import hash_password
from .database import create_db_and_tables, engine
from .models import Account

# Script para garantir apenas a conta de demonstração (sem massa de dados).

DEMO_ACCOUNT_EMAIL = os.getenv("DEMO_LOGIN_EMAIL", "admin@slax.com").strip() or "admin@slax.com"
DEMO_ACCOUNT_PASSWORD = os.getenv("DEMO_LOGIN_PASSWORD", "admin123")


def seed():
    print("[seed] Garantindo conta de demonstração...")
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
        print("[seed] Pronto. Nenhuma massa de usuários/logs foi inserida.")


if __name__ == "__main__":
    create_db_and_tables()
    seed()
