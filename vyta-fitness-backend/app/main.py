import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles

from app.api.v1 import router as v1_router
from app.core.database import init_db
from app.core.storage import storage


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await storage.ensure_bucket()
    yield


app = FastAPI(
    title="Vyta Fitness Marketplace API",
    description="Phase 1 MVP — Marketplace Core, Booking & Consultation, Financial Ledger",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/uploads/{filename:path}")
async def serve_upload(filename: str):
    data = storage.get_file(filename)
    if data is None:
        raise HTTPException(status_code=404, detail="File not found")
    content_type = "application/pdf" if filename.endswith(".pdf") else "application/octet-stream"
    return Response(content=data, media_type=content_type)


app.include_router(v1_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "healthy"}
