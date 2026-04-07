import os

from sqlmodel import Session, select

from .auth import hash_password
from .database import create_db_and_tables, engine
from .models import Account

# Garante uma conta administrativa inicial (sem massa de dados sintéticos).

SEED_ADMIN_EMAIL = (
    os.getenv("SEED_ADMIN_EMAIL", "admin@slax.com").strip() or "admin@slax.com"
)
SEED_ADMIN_PASSWORD = os.getenv("SEED_ADMIN_PASSWORD", "admin123")
SEED_ADMIN_NAME = (os.getenv("SEED_ADMIN_NAME", "Admin").strip() or "Admin")


def ensure_admin_account(
    email: str = SEED_ADMIN_EMAIL,
    password: str = SEED_ADMIN_PASSWORD,
    name: str = SEED_ADMIN_NAME,
) -> Account:
    with Session(engine) as session:
        admin = session.exec(select(Account).where(Account.email == email)).first()
        if not admin:
            admin = Account(
                email=email,
                hashed_password=hash_password(password),
                name=name,
            )
            session.add(admin)
            session.commit()
            session.refresh(admin)
        return admin


def seed():
    print("[seed] Garantindo conta administrativa inicial...")
    admin = ensure_admin_account()
    print(f"[seed] Conta pronta: {admin.email}")
    print("[seed] Pronto. Nenhuma massa de usuários/logs foi inserida.")


if __name__ == "__main__":
    create_db_and_tables()
    seed()
