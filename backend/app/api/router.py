from fastapi import APIRouter
from app.api import auth, cases, game, evidence, interrogation, accusation, admin, payments

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(cases.router, prefix="/cases", tags=["cases"])
api_router.include_router(game.router, prefix="/game", tags=["game"])
api_router.include_router(evidence.router, prefix="/game", tags=["evidence"])
api_router.include_router(interrogation.router, prefix="/game", tags=["interrogation"])
api_router.include_router(accusation.router, prefix="/game", tags=["accusation"])
api_router.include_router(admin.router)
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
