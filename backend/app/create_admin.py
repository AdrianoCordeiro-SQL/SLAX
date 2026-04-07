from .database import create_db_and_tables
from .seed import ensure_admin_account

# Script executável para criar uma conta administrativa inicial (uso local ou setup).


def create_admin(
    email: str = "admin@slax.com", password: str = "admin", name: str = "Admin"
) -> None:
    account = ensure_admin_account(email=email, password=password, name=name)
    print(f"Conta administrativa pronta: {account.email}")


if __name__ == "__main__":
    create_db_and_tables()
    create_admin()
