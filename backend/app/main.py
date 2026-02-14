from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_tables
from app.api.router import api_router
from app.services.seed_service import seed_case_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    await seed_case_data()
    yield


app = FastAPI(title="Detective AI", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. API routes (checked FIRST — before any mounts)
app.include_router(api_router, prefix="/api")

# 2. Static images
images_path = Path(__file__).parent.parent.parent / "images"
if images_path.exists():
    app.mount("/images", StaticFiles(directory=str(images_path)), name="images")

# 3. Frontend SPA (checked LAST — after API routes)
#    html=True makes it serve index.html for any path without a matching file,
#    which is exactly what SPA routing needs.
frontend_dist = Path(__file__).parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="spa")
