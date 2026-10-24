"""Unit tests for Elexon data generation and quantitative error analytics."""

import asyncio
import numpy as np

from app.services.elexon import elexon_service
from app.services.analytics import analytics_service


def test_january_2026_dataset_shape():
    """Verify that January 2026 dataset has exactly 31 days * 48 settlement periods = 1,488 records."""
    df = asyncio.run(elexon_service.get_january_2026_data("all"))
    assert not df.empty
    assert len(df) == 31 * 48, f"Expected 1488 records, got {len(df)}"
    assert "actualGeneration" in df.columns
    assert "forecastGeneration" in df.columns
    assert "settlementPeriod" in df.columns
    assert "settlementDate" in df.columns


def test_single_day_filter():
    """Verify that filtering by a specific day returns exactly 48 settlement periods."""
    day_df = asyncio.run(elexon_service.get_january_2026_data("2026-01-15"))
    assert len(day_df) == 48
    assert (day_df["settlementPeriod"].values == np.arange(1, 49)).all()


def test_accuracy_metrics_calculation():
    """Verify accuracy metrics (MAE, RMSE, Bias, R^2) are mathematically valid."""
    df = asyncio.run(elexon_service.get_january_2026_data("2026-01-15"))
    metrics = analytics_service.calculate_accuracy_metrics(df)

    assert metrics["sampleCount"] == 48
    assert metrics["maeMW"] > 0
    assert metrics["rmseMW"] >= metrics["maeMW"], "RMSE must always be >= MAE"
    assert -10000 < metrics["meanBiasMW"] < 10000
    assert 0 <= metrics["rSquared"] <= 1.0
    assert len(metrics["errorDistribution"]) > 0


def test_deficits_and_procurement_totals():
    """Verify residual demand and procurement totals."""
    df = asyncio.run(elexon_service.get_january_2026_data("2026-01-15"))
    deficits = analytics_service.calculate_deficits_and_procurement(df)

    totals = deficits["totals"]
    assert totals["totalDemandMWh"] > 0
    assert totals["actualWindMWh"] > 0
    assert totals["actualThermalProcuredMWh"] > 0
    assert totals["peakDemandMW"] > totals["peakResidualMW"]
