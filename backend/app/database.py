import os

from sqlalchemy import inspect, text
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from . import models  # noqa: F401 — registra todas as tabelas no metadata

# Engine SQLModel/PostgreSQL, criação de tabelas e gerador de sessão usado pelo
# Depends do FastAPI.

# O host 'db' vem do nome do serviço no seu docker-compose
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://user:password@db:5432/portfolio_db"
)
DB_ECHO_ENABLED = os.getenv("DB_ECHO", "").lower() in {"1", "true", "yes", "on"}

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )
else:
    engine = create_engine(DATABASE_URL, echo=DB_ECHO_ENABLED)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    # Lightweight migration for existing databases without alembic.
    if DATABASE_URL.startswith("sqlite"):
        return
    with engine.begin() as conn:
        inspector = inspect(conn)
        if "user" not in inspector.get_table_names():
            return
        existing_columns = {col["name"] for col in inspector.get_columns("user")}
        if "product" not in existing_columns:
            conn.execute(text('ALTER TABLE "user" ADD COLUMN product VARCHAR'))
        if "product_value" not in existing_columns:
            conn.execute(
                text('ALTER TABLE "user" ADD COLUMN product_value DOUBLE PRECISION')
            )

        tables = inspector.get_table_names()
        if "revenuemetric" in tables:
            rm_cols = {col["name"] for col in inspector.get_columns("revenuemetric")}
            if "user_id" not in rm_cols:
                conn.execute(
                    text("ALTER TABLE revenuemetric ADD COLUMN user_id INTEGER")
                )
                conn.execute(
                    text(
                        "ALTER TABLE revenuemetric ADD CONSTRAINT "
                        "revenuemetric_user_id_fkey FOREIGN KEY (user_id) "
                        'REFERENCES "user" (id)'
                    )
                )
                conn.execute(
                    text(
                        "CREATE INDEX IF NOT EXISTS ix_revenuemetric_user_id "
                        "ON revenuemetric (user_id)"
                    )
                )


def get_session():
    # Injeção de dependência para as rotas do FastAPI
    with Session(engine) as session:
        yield session
