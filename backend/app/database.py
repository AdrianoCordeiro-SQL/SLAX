import os

from sqlmodel import Session, SQLModel, create_engine

# O host 'db' vem do nome do serviço no seu docker-compose
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://user:password@db:5432/portfolio_db"
)

engine = create_engine(DATABASE_URL, echo=True)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    # Injeção de dependência para as rotas do FastAPI
    with Session(engine) as session:
        yield session
