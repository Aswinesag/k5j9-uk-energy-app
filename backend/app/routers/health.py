"""Health check and service status endpoints."""

from datetime import datetime, timezone
from fastapi import APIRouter
from app.config import settings

router = APIRouter(prefix="/api/health", tags=["Health"])


@router.get("")
@router.get("/")
async def health_check():
    """Verify application operational status, environment, and timestamp."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "timestampUtc": datetime.now(timezone.utc).isoformat(),
        "dataSource": "Elexon BMRS API (FUELHH / WINDFOR)",
        "targetPeriod": "January 2026"
    }

