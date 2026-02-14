import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.database import create_tables
from app.api.router import api_router
from app.services.seed_service import seed_case_data

logger = logging.getLogger(__name__)

# Resolve paths relative to this file
BASE_DIR = Path(__file__).resolve().parent.parent.parent
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"
IMAGES_DIR = BASE_DIR / "images"


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("BASE_DIR = %s", BASE_DIR)
    logger.info("FRONTEND_DIST = %s (exists: %s)", FRONTEND_DIST, FRONTEND_DIST.exists())
    logger.info("IMAGES_DIR = %s (exists: %s)", IMAGES_DIR, IMAGES_DIR.exists())
    await create_tables()
    await seed_case_data()
    yield


app = FastAPI(title="Detective AI", lifespan=lifespan, redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. API routes
app.include_router(api_router, prefix="/api")

# 2. Static images
if IMAGES_DIR.exists():
    app.mount("/images", StaticFiles(directory=str(IMAGES_DIR)), name="images")

# 3. Frontend static assets (js, css, etc.)
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="frontend-assets")


# 4. SPA fallback via 404 handler
#    - /api/* 404s stay as JSON errors
#    - everything else gets index.html (React Router handles it)
@app.exception_handler(StarletteHTTPException)
async def spa_fallback(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404 and not request.url.path.startswith("/api"):
        index = FRONTEND_DIST / "index.html"
        if index.exists():
            return FileResponse(index)
    return JSONResponse(
        {"detail": exc.detail},
        status_code=exc.status_code,
    )
