"""Quantitative analytics service for UK energy day-ahead purchasing and risk assessment.

Calculates:
- Statistical forecast accuracy: MAE, RMSE, Mean Bias, Percentage Bias, nMAE, nRMSE, R^2
- Error distributions and histogram binning for risk modeling
- Settlement period diurnal error profiles
- Residual demand, thermal procurement gaps, and imbalance exposure
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

from app.config import settings


class AnalyticsService:
    """Performs statistical evaluation of wind forecasts and calculates residual thermal procurement."""

    def compute_baseline_demand(self, df: pd.DataFrame) -> pd.Series:
        """Compute realistic UK winter electricity demand curve across settlement periods.

        Models:
        - Morning peak around SP 16-18 (08:00 - 09:00 UTC) at ~39-41 GW
        - Afternoon lull around SP 24-27 (12:00 - 13:30 UTC) at ~33-35 GW
        - Primary winter evening peak around SP 35-38 (17:30 - 19:00 UTC) at ~43-45 GW
        - Overnight valley around SP 7-9 (03:30 - 04:30 UTC) at ~22-24 GW
        - Weekend load reduction (~12% lower than weekday industrial load)
        """
        demands = []
        for _, row in df.iterrows():
            sp = int(row["settlementPeriod"])
            date_obj = pd.to_datetime(row["settlementDate"]).date()
            is_weekend = date_obj.weekday() >= 5

            # Diurnal curve synthesis using harmonic components
            t = (sp - 1) / 48.0 * 2.0 * math.pi
            # Base harmonic shape
            h1 = - math.cos(t) * 0.40                       # Main day-night variation
            h2 = - math.cos(2 * t - 0.5) * 0.22             # Dual peak (morning & evening)
            h3 = 0.12 * math.sin(3 * t)                     # Sharp evening shoulder
            norm_val = (h1 + h2 + h3 + 0.65) / 1.35         # Scaled between 0.0 and 1.0
            norm_val = max(0.0, min(1.0, norm_val))

            demand_range = settings.BASE_DEMAND_MAX_MW - settings.BASE_DEMAND_MIN_MW
            demand_mw = settings.BASE_DEMAND_MIN_MW + norm_val * demand_range

            if is_weekend:
                demand_mw *= 0.88

            # Small realistic thermal weather adjustment based on day of month
            day_num = date_obj.day
            if 9 <= day_num <= 13:
                # Dunkelflaute freezing cold snap increases domestic heating demand by ~5%
                demand_mw *= 1.05

            demands.append(round(demand_mw, 1))

        return pd.Series(demands, index=df.index)

    def prepare_enriched_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Enrich raw Elexon dataset with demand, residuals, and settlement deltas."""
        if df.empty:
            return df.copy()

        edf = df.copy()
        if "demandMW" not in edf.columns:
            edf["demandMW"] = self.compute_baseline_demand(edf)

        # Delta definitions:
        # Error = Forecast - Actual. (Positive = Over-forecast; Negative = Under-forecast)
        edf["errorMW"] = edf["forecastGeneration"] - edf["actualGeneration"]
        edf["absErrorMW"] = edf["errorMW"].abs()
        edf["squaredErrorMW2"] = edf["errorMW"] ** 2

        # Residuals:
        # Actual Residual Demand = Demand - Actual Wind (must be supplied by thermal/peakers/imports)
        edf["actualResidualMW"] = (edf["demandMW"] - edf["actualGeneration"]).clip(lower=0.0)
        # Planned Residual Demand = Demand - Forecast Wind (what the trader procured day-ahead)
        edf["plannedResidualMW"] = (edf["demandMW"] - edf["forecastGeneration"]).clip(lower=0.0)

        # Procurement Shortfall / Imbalance:
        # When actual wind is lower than forecast (errorMW > 0), the utility under-procured thermal power
        # and has a Shortfall/Deficit (must buy expensive peaking power or imbalance).
        edf["procurementShortfallMW"] = (edf["actualResidualMW"] - edf["plannedResidualMW"]).clip(lower=0.0)
        edf["procurementSurplusMW"] = (edf["plannedResidualMW"] - edf["actualResidualMW"]).clip(lower=0.0)

        return edf

    def calculate_accuracy_metrics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate comprehensive quantitative accuracy metrics."""
        if df.empty:
            return {
                "sampleCount": 0,
                "maeMW": 0.0,
                "rmseMW": 0.0,
                "meanBiasMW": 0.0,
                "percentageBias": 0.0,
                "nmaePercent": 0.0,
                "nrmsePercent": 0.0,
                "rSquared": 0.0,
                "correlation": 0.0,
                "maxOverForecastMW": 0.0,
                "maxUnderForecastMW": 0.0,
                "meanActualMW": 0.0,
                "meanForecastMW": 0.0,
                "directionalAccuracyPercent": 0.0,
                "errorDistribution": [],
                "scatterSample": [],
            }

        edf = self.prepare_enriched_dataframe(df)
        n = len(edf)

        actuals = edf["actualGeneration"].values
        forecasts = edf["forecastGeneration"].values
        errors = edf["errorMW"].values

        mae = float(np.mean(np.abs(errors)))
        rmse = float(np.sqrt(np.mean(errors ** 2)))
        mean_bias = float(np.mean(errors))

        total_actual = float(np.sum(actuals))
        percentage_bias = float((np.sum(errors) / total_actual * 100.0)) if total_actual > 0 else 0.0

        mean_actual = float(np.mean(actuals))
        mean_forecast = float(np.mean(forecasts))

        nmae = float((mae / mean_actual * 100.0)) if mean_actual > 0 else 0.0
        nrmse = float((rmse / mean_actual * 100.0)) if mean_actual > 0 else 0.0

        # Pearson correlation and R^2
        if np.std(actuals) > 1e-4 and np.std(forecasts) > 1e-4:
            corr_matrix = np.corrcoef(actuals, forecasts)
            correlation = float(corr_matrix[0, 1])
            r_squared = float(correlation ** 2)
        else:
            correlation = 0.0
            r_squared = 0.0

        max_over = float(np.max(errors))  # Greatest positive error
        max_under = float(np.min(errors))  # Greatest negative error (negative number)

        # Directional ramp accuracy (did forecast anticipate next half-hour move correctly?)
        if n > 1:
            actual_diffs = np.diff(actuals)
            forecast_diffs = np.diff(forecasts)
            same_direction = (actual_diffs * forecast_diffs) >= 0
            directional_accuracy = float(np.mean(same_direction) * 100.0)
        else:
            directional_accuracy = 100.0

        # Build histogram error distribution (e.g. 16 bins)
        error_min = float(np.min(errors))
        error_max = float(np.max(errors))
        # Ensure symmetric or reasonable bounds
        bins = np.linspace(error_min - 50.0, error_max + 50.0, 16)
        counts, edges = np.histogram(errors, bins=bins)

        error_dist = []
        for i in range(len(counts)):
            bin_center = float((edges[i] + edges[i + 1]) / 2.0)
            error_dist.append({
                "binStart": round(float(edges[i]), 1),
                "binEnd": round(float(edges[i + 1]), 1),
                "binCenter": round(float(bin_center), 1),
                "count": int(counts[i]),
                "frequency": round(float(counts[i] / n * 100.0), 2),
                "isOverForecast": bool(bin_center > 0)
            })

        # Scatter sample (if large, sample up to 300 points for crisp frontend rendering)
        if n > 350:
            step = n // 300
            scatter_df = edf.iloc[::step]
        else:
            scatter_df = edf

        scatter_points = []
        for _, r in scatter_df.iterrows():
            scatter_points.append({
                "startTime": r["startTime"].strftime("%Y-%m-%dT%H:%M:%SZ") if hasattr(r["startTime"], "strftime") else str(r["startTime"]),
                "settlementPeriod": int(r["settlementPeriod"]),
                "actual": round(float(r["actualGeneration"]), 1),
                "forecast": round(float(r["forecastGeneration"]), 1),
                "error": round(float(r["errorMW"]), 1),
                "settlementDate": str(r["settlementDate"]),
            })

        return {
            "sampleCount": n,
            "maeMW": round(mae, 1),
            "rmseMW": round(rmse, 1),
            "meanBiasMW": round(mean_bias, 1),
            "percentageBias": round(percentage_bias, 2),
            "nmaePercent": round(nmae, 2),
            "nrmsePercent": round(nrmse, 2),
            "rSquared": round(r_squared, 4),
            "correlation": round(correlation, 4),
            "maxOverForecastMW": round(max_over, 1),
            "maxUnderForecastMW": round(abs(max_under), 1),
            "meanActualMW": round(mean_actual, 1),
            "meanForecastMW": round(mean_forecast, 1),
            "directionalAccuracyPercent": round(directional_accuracy, 1),
            "errorDistribution": error_dist,
            "scatterSample": scatter_points,
        }

    def calculate_diurnal_profile(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Calculate average forecast metrics by settlement period (1 to 48)."""
        if df.empty:
            return []

        edf = self.prepare_enriched_dataframe(df)
        grouped = edf.groupby("settlementPeriod")

        profile = []
        for sp, group in grouped:
            errors = group["errorMW"].values
            actuals = group["actualGeneration"].values
            forecasts = group["forecastGeneration"].values

            mae = float(np.mean(np.abs(errors)))
            rmse = float(np.sqrt(np.mean(errors ** 2)))
            bias = float(np.mean(errors))

            # Approximate time of day string (e.g. SP 1 = 00:00, SP 48 = 23:30)
            mins = (int(sp) - 1) * 30
            hours = mins // 60
            minutes = mins % 60
            time_label = f"{hours:02d}:{minutes:02d}"

            profile.append({
                "settlementPeriod": int(sp),
                "timeLabel": time_label,
                "avgActualMW": round(float(np.mean(actuals)), 1),
                "avgForecastMW": round(float(np.mean(forecasts)), 1),
                "avgErrorMW": round(bias, 1),
                "maeMW": round(mae, 1),
                "rmseMW": round(rmse, 1),
                "overForecastRatio": round(float(np.mean(errors > 0) * 100.0), 1),
            })

        return sorted(profile, key=lambda x: x["settlementPeriod"])

    def calculate_deficits_and_procurement(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate residual power demand and thermal procurement risk analytics."""
        if df.empty:
            return {
                "timeseries": [],
                "totals": {
                    "totalDemandMWh": 0.0,
                    "actualWindMWh": 0.0,
                    "forecastWindMWh": 0.0,
                    "actualThermalProcuredMWh": 0.0,
                    "plannedThermalProcuredMWh": 0.0,
                    "procurementShortfallMWh": 0.0,
                    "procurementSurplusMWh": 0.0,
                    "peakDemandMW": 0.0,
                    "peakResidualMW": 0.0,
                    "maxThermalShortfallMW": 0.0,
                    "deficitSettlementPeriodsCount": 0,
                    "surplusSettlementPeriodsCount": 0,
                }
            }

        edf = self.prepare_enriched_dataframe(df)

        # 30-minute settlement period = 0.5 hours for MWh conversion
        half_hour = 0.5

        total_demand_mwh = float(edf["demandMW"].sum() * half_hour)
        actual_wind_mwh = float(edf["actualGeneration"].sum() * half_hour)
        forecast_wind_mwh = float(edf["forecastGeneration"].sum() * half_hour)

        actual_thermal_mwh = float(edf["actualResidualMW"].sum() * half_hour)
        planned_thermal_mwh = float(edf["plannedResidualMW"].sum() * half_hour)

        shortfall_mwh = float(edf["procurementShortfallMW"].sum() * half_hour)
        surplus_mwh = float(edf["procurementSurplusMW"].sum() * half_hour)

        peak_demand_mw = float(edf["demandMW"].max())
        peak_residual_mw = float(edf["actualResidualMW"].max())
        max_shortfall_mw = float(edf["procurementShortfallMW"].max())

        deficit_count = int((edf["procurementShortfallMW"] > 0.01).sum())
        surplus_count = int((edf["procurementSurplusMW"] > 0.01).sum())

        timeseries = []
        for _, r in edf.iterrows():
            st_str = r["startTime"].strftime("%Y-%m-%dT%H:%M:%SZ") if hasattr(r["startTime"], "strftime") else str(r["startTime"])
            timeseries.append({
                "startTime": st_str,
                "settlementDate": str(r["settlementDate"]),
                "settlementPeriod": int(r["settlementPeriod"]),
                "demandMW": round(float(r["demandMW"]), 1),
                "actualWindMW": round(float(r["actualGeneration"]), 1),
                "forecastWindMW": round(float(r["forecastGeneration"]), 1),
                "actualResidualMW": round(float(r["actualResidualMW"]), 1),
                "plannedResidualMW": round(float(r["plannedResidualMW"]), 1),
                "procurementShortfallMW": round(float(r["procurementShortfallMW"]), 1),
                "procurementSurplusMW": round(float(r["procurementSurplusMW"]), 1),
                "errorMW": round(float(r["errorMW"]), 1),
            })

        return {
            "timeseries": timeseries,
            "totals": {
                "totalDemandMWh": round(total_demand_mwh, 1),
                "actualWindMWh": round(actual_wind_mwh, 1),
                "forecastWindMWh": round(forecast_wind_mwh, 1),
                "actualThermalProcuredMWh": round(actual_thermal_mwh, 1),
                "plannedThermalProcuredMWh": round(planned_thermal_mwh, 1),
                "procurementShortfallMWh": round(shortfall_mwh, 1),
                "procurementSurplusMWh": round(surplus_mwh, 1),
                "peakDemandMW": round(peak_demand_mw, 1),
                "peakResidualMW": round(peak_residual_mw, 1),
                "maxThermalShortfallMW": round(max_shortfall_mw, 1),
                "deficitSettlementPeriodsCount": deficit_count,
                "surplusSettlementPeriodsCount": surplus_count,
            }
        }


analytics_service = AnalyticsService()
