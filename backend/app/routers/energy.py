"""Energy market endpoints for day-ahead purchasing, forecast evaluation, and thermal deficits."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
import pandas as pd

from app.services.elexon import elexon_service
from app.services.analytics import analytics_service

router = APIRouter(prefix="/api/energy", tags=["Energy Analytics"])


def _validate_date_param(date_param: Optional[str]) -> Optional[str]:
    """Validate and clean target date parameter for January 2026."""
    if not date_param or date_param.lower() in ("all", "month", ""):
        return None
    cleaned = date_param.strip()
    if not cleaned.startswith("2026-01-"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date '{date_param}'. Data scope is restricted to January 2026 (format: 2026-01-01 to 2026-01-31, or 'all')."
        )
    try:
        day = int(cleaned.split("-")[2])
        if day < 1 or day > 31:
            raise ValueError()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid day '{cleaned}'. Must be between 2026-01-01 and 2026-01-31."
        )
    return cleaned


@router.get("/overview")
async def get_overview(
    date: Optional[str] = Query(None, description="Target settlement date (e.g. 2026-01-15 or 'all' for full month)")
) -> Dict[str, Any]:
    """Returns time-series pairing actual wind generation vs. latest available day-ahead forecast."""
    target_date = _validate_date_param(date)
    # Default to 2026-01-15 (representative winter day with ramp dynamics) if date is omitted entirely
    effective_date = target_date if target_date is not None else (None if date == "all" else "2026-01-15")

    raw_df = await elexon_service.get_january_2026_data(effective_date)
    if raw_df.empty:
        raise HTTPException(status_code=404, detail=f"No Elexon records found for date {effective_date}")

    enriched_df = analytics_service.prepare_enriched_dataframe(raw_df)

    records = []
    for _, r in enriched_df.iterrows():
        st_str = r["startTime"].strftime("%Y-%m-%dT%H:%M:%SZ") if hasattr(r["startTime"], "strftime") else str(r["startTime"])
        records.append({
            "startTime": st_str,
            "settlementDate": str(r["settlementDate"]),
            "settlementPeriod": int(r["settlementPeriod"]),
            "actualGenerationMW": round(float(r["actualGeneration"]), 1),
            "forecastGenerationMW": round(float(r["forecastGeneration"]), 1),
            "deltaMW": round(float(r["actualGeneration"] - r["forecastGeneration"]), 1),
            "errorMW": round(float(r["errorMW"]), 1),
            "demandMW": round(float(r["demandMW"]), 1),
            "actualResidualMW": round(float(r["actualResidualMW"]), 1),
            "plannedResidualMW": round(float(r["plannedResidualMW"]), 1),
            "procurementShortfallMW": round(float(r["procurementShortfallMW"]), 1),
            "publishTime": str(r.get("publishTime", "")),
            "weatherRegime": str(r.get("weatherRegime", "Standard")),
        })

    # Summary statistics for this selected slice
    actuals = enriched_df["actualGeneration"]
    forecasts = enriched_df["forecastGeneration"]
    errors = enriched_df["errorMW"]

    summary = {
        "selectedDate": effective_date if effective_date else "January 2026 (Full Month)",
        "settlementIntervals": len(enriched_df),
        "peakActualMW": round(float(actuals.max()), 1),
        "peakForecastMW": round(float(forecasts.max()), 1),
        "meanActualMW": round(float(actuals.mean()), 1),
        "meanForecastMW": round(float(forecasts.mean()), 1),
        "meanBiasMW": round(float(errors.mean()), 1),
        "maeMW": round(float(errors.abs().mean()), 1),
        "rmseMW": round(float((errors ** 2).mean() ** 0.5), 1),
        "weatherRegime": str(enriched_df["weatherRegime"].iloc[0]) if "weatherRegime" in enriched_df.columns else "Standard",
    }

    return {
        "status": "success",
        "date": effective_date,
        "summary": summary,
        "timeseries": records,
    }


@router.get("/metrics")
async def get_metrics(
    date: Optional[str] = Query(None, description="Target settlement date (e.g. 2026-01-15 or 'all' for full month)")
) -> Dict[str, Any]:
    """Returns quantitative accuracy metrics (MAE, RMSE, Bias, distribution, and diurnal profiles)."""
    target_date = _validate_date_param(date)
    effective_date = target_date if target_date is not None else (None if date == "all" else "2026-01-15")

    raw_df = await elexon_service.get_january_2026_data(effective_date)
    if raw_df.empty:
        raise HTTPException(status_code=404, detail=f"No records found for date {effective_date}")

    accuracy_metrics = analytics_service.calculate_accuracy_metrics(raw_df)
    diurnal_profile = analytics_service.calculate_diurnal_profile(raw_df)

    return {
        "status": "success",
        "date": effective_date if effective_date else "January 2026 (Full Month)",
        "metrics": accuracy_metrics,
        "diurnalProfile": diurnal_profile,
    }


@router.get("/deficits")
async def get_deficits(
    date: Optional[str] = Query(None, description="Target settlement date (e.g. 2026-01-15 or 'all' for full month)")
) -> Dict[str, Any]:
    """Calculates residual power demand and thermal procurement shortfalls."""
    target_date = _validate_date_param(date)
    effective_date = target_date if target_date is not None else (None if date == "all" else "2026-01-15")

    raw_df = await elexon_service.get_january_2026_data(effective_date)
    if raw_df.empty:
        raise HTTPException(status_code=404, detail=f"No records found for date {effective_date}")

    deficit_analytics = analytics_service.calculate_deficits_and_procurement(raw_df)

    return {
        "status": "success",
        "date": effective_date if effective_date else "January 2026 (Full Month)",
        "totals": deficit_analytics["totals"],
        "timeseries": deficit_analytics["timeseries"],
    }


@router.get("/dates")
async def list_available_dates() -> Dict[str, Any]:
    """List all available dates in January 2026 with high-level daily operational indicators."""
    month_df = await elexon_service.get_january_2026_data("all")
    enriched = analytics_service.prepare_enriched_dataframe(month_df)

    grouped = enriched.groupby("settlementDate")
    dates_summary = []
    for sdate, grp in grouped:
        err = grp["errorMW"]
        dates_summary.append({
            "date": str(sdate),
            "day": int(str(sdate).split("-")[2]),
            "weatherRegime": str(grp["weatherRegime"].iloc[0]) if "weatherRegime" in grp.columns else "Standard",
            "avgActualMW": round(float(grp["actualGeneration"].mean()), 1),
            "peakActualMW": round(float(grp["actualGeneration"].max()), 1),
            "maeMW": round(float(err.abs().mean()), 1),
            "rmseMW": round(float((err ** 2).mean() ** 0.5), 1),
            "meanBiasMW": round(float(err.mean()), 1),
            "maxShortfallMW": round(float(grp["procurementShortfallMW"].max()), 1),
            "shortfallHours": round(float((grp["procurementShortfallMW"] > 10).sum() * 0.5), 1),
        })

    return {
        "status": "success",
        "count": len(dates_summary),
        "dates": sorted(dates_summary, key=lambda x: x["date"]),
    }


@router.get("/monthly-summary")
async def get_monthly_summary() -> Dict[str, Any]:
    """Aggregated portfolio-level month statistics across all of January 2026."""
    month_df = await elexon_service.get_january_2026_data("all")
    metrics = analytics_service.calculate_accuracy_metrics(month_df)
    deficits = analytics_service.calculate_deficits_and_procurement(month_df)

    return {
        "status": "success",
        "period": "January 2026",
        "totalIntervals": len(month_df),
        "accuracyMetrics": metrics,
        "energyProcurementTotals": deficits["totals"],
    }

