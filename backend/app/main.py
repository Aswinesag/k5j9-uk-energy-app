"""FastAPI Application entrypoint for the UK Energy Day-Ahead Purchasing Analytics Platform."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import health, energy
from app.services.elexon import elexon_service

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("reint_energy_api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan event: warms up cache on startup."""
    logger.info("Initializing %s v%s...", settings.APP_NAME, settings.APP_VERSION)
    logger.info("Target Data Scope: Elexon BMRS January 2026 (FUELHH & WINDFOR)")
    # Pre-warm January 2026 dataset
    try:
        await elexon_service.get_january_2026_data("all")
        logger.info("January 2026 Elexon dataset initialized and cached successfully.")
    except Exception as exc:
        logger.error("Error pre-warming Elexon dataset: %s", exc)
    yield
    logger.info("Shutting down %s...", settings.APP_NAME)


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Production-grade UK Energy Day-Ahead Power Purchasing Analytics API. "
        "Provides Elexon BMRS wind generation actuals vs. forecasts, quantitative error "
        "evaluations (MAE, RMSE, Bias), and residual thermal demand / deficit calculations for January 2026."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(energy.router)


@app.get("/")
async def root():
    """Root endpoint welcoming clients and linking to documentation."""
    return JSONResponse({
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "documentation": "/docs",
        "endpoints": {
            "health": "/api/health",
            "energyOverview": "/api/energy/overview?date=2026-01-15",
            "accuracyMetrics": "/api/energy/metrics?date=2026-01-15",
            "thermalDeficits": "/api/energy/deficits?date=2026-01-15",
            "datesList": "/api/energy/dates",
            "monthlySummary": "/api/energy/monthly-summary"
        }
    })

