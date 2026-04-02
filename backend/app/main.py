from contextlib import asynccontextmanager

from fastapi import FastAPI

from .database import create_db_and_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="SLAX Analytics", lifespan=lifespan)


@app.get("/")
def read_root():
    return {"status": "Online", "message": "SLAX Analytics backend running."}
