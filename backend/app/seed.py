import os

from sqlmodel import Session, select

from .auth import hash_password
from .database import create_db_and_tables, engine
from .models import Account

# Garante uma conta administrativa inicial (sem massa de dados sintéticos).

SEED_ADMIN_EMAIL = os.getenv("SEED_ADMIN_EMAIL", "admin@slax.com").strip() or "admin@slax.com"
SEED_ADMIN_PASSWORD = os.getenv("SEED_ADMIN_PASSWORD", "admin123")


def seed():
    print("[seed] Garantindo conta administrativa inicial...")
    with Session(engine) as session:
        admin = session.exec(
            select(Account).where(Account.email == SEED_ADMIN_EMAIL)
        ).first()
        if not admin:
            admin = Account(
                email=SEED_ADMIN_EMAIL,
                hashed_password=hash_password(SEED_ADMIN_PASSWORD),
                name="Admin",
            )
            session.add(admin)
            session.commit()
            session.refresh(admin)
            print(f"[seed] Conta criada: {SEED_ADMIN_EMAIL}")
        else:
            print(f"[seed] Conta já existe: {SEED_ADMIN_EMAIL}")
        print("[seed] Pronto. Nenhuma massa de usuários/logs foi inserida.")


if __name__ == "__main__":
    create_db_and_tables()
    seed()
