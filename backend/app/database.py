import os

from sqlalchemy import inspect, text
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

# Engine SQLModel/PostgreSQL, criação de tabelas e gerador de sessão usado pelo Depends do FastAPI.

# O host 'db' vem do nome do serviço no seu docker-compose
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://user:password@db:5432/portfolio_db"
)

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )
else:
    engine = create_engine(DATABASE_URL, echo=True)


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
            conn.execute(text('ALTER TABLE "user" ADD COLUMN product_value DOUBLE PRECISION'))


def get_session():
    # Injeção de dependência para as rotas do FastAPI
    with Session(engine) as session:
        yield session
