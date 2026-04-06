from sqlmodel import Session, select

from .auth import hash_password
from .database import create_db_and_tables, engine
from .models import Account

# Script executável para criar uma conta administrativa inicial (uso local ou setup).


def create_admin(
    email: str = "admin@slax.com", password: str = "admin", name: str = "Admin"
) -> None:
    with Session(engine) as session:
        existing = session.exec(select(Account).where(Account.email == email)).first()
        if existing:
            print(f"Conta '{email}' já existe. Ignorando criação.")
            return
        session.add(
            Account(
                email=email,
                hashed_password=hash_password(password),
                name=name,
            )
        )
        session.commit()
        print(f"Conta administrativa criada: {email}")


if __name__ == "__main__":
    create_db_and_tables()
    create_admin()
