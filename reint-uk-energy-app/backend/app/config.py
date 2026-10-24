"""Application configuration settings for the UK Energy Analytics platform."""

from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="APP_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "UK Energy Day-Ahead Purchasing Analytics"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "production"
    DEBUG: Union[bool, str] = False

    # Elexon BMRS API Settings
    ELEXON_API_BASE_URL: str = "https://data.elexon.co.uk/bmrs/api/v1"
    ELEXON_API_KEY: str = ""
    ELEXON_TIMEOUT_SECONDS: float = 3.0
    ENABLE_LIVE_ELEXON_FETCH: bool = False  # Set to True in production with live network & credentials

    # Grid & Demand Simulation Parameters (UK Winter 2026 Reference)
    NOMINAL_WIND_CAPACITY_MW: float = 30500.0  # Projected UK offshore + onshore wind 2026
    BASE_DEMAND_MIN_MW: float = 22000.0        # Overnight winter trough
    BASE_DEMAND_MAX_MW: float = 44500.0        # Winter peak demand (17:30 - 19:00)

    # Day-Ahead Gate Closure Cutoff (UTC hour on D-1, typically 11:00 or 12:00)
    DAY_AHEAD_GATE_CUTOFF_HOUR: int = 11

    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug_value(cls, v):
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes", "on", "debug")
        return False


settings = Settings()
