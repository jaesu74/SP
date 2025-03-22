from fastapi import APIRouter
from app.api.routes import sanctions, users

api_router = APIRouter()

api_router.include_router(sanctions.router, prefix="/sanctions", tags=["sanctions"])
api_router.include_router(users.router, prefix="/users", tags=["users"]) 