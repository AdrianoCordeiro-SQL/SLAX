from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .database import create_db_and_tables
from .exceptions import EmailAlreadyRegistered, UserNotFoundForAccount, WrongCurrentPassword
from .routers import auth, dashboard, reports, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="SLAX Analytics", lifespan=lifespan)


@app.exception_handler(EmailAlreadyRegistered)
async def handle_email_already_registered(request: Request, exc: EmailAlreadyRegistered):
    return JSONResponse(status_code=409, content={"detail": "Email already registered"})


@app.exception_handler(UserNotFoundForAccount)
async def handle_user_not_found(request: Request, exc: UserNotFoundForAccount):
    return JSONResponse(status_code=404, content={"detail": "User not found"})


@app.exception_handler(WrongCurrentPassword)
async def handle_wrong_current_password(request: Request, exc: WrongCurrentPassword):
    return JSONResponse(status_code=400, content={"detail": "Current password is incorrect"})


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(users.router)
app.include_router(reports.router)
