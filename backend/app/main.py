from fastapi import Depends, FastAPI
from sqlmodel import Session

from .database import get_session, init_db
from .models import User

app = FastAPI(title="Meu Projeto Fullstack")


# Roda quando o container sobe
@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def read_root():
    return {"status": "Online", "message": "Backend FastAPI rodando no Docker!"}


# Exemplo de rota para testar o banco
@app.post("/users/")
def create_user(user: User, session: Session = Depends(get_session)):
    session.add(user)
    session.commit()
    session.refresh(user)
    return user
