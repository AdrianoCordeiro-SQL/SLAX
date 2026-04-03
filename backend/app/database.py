import os

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


def get_session():
    # Injeção de dependência para as rotas do FastAPI
    with Session(engine) as session:
        yield session
