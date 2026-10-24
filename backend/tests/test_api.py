"""Integration tests for FastAPI endpoints using TestClient."""

from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "Elexon" in data["dataSource"]


def test_overview_endpoint():
    res = client.get("/api/energy/overview?date=2026-01-15")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert len(data["timeseries"]) == 48
    assert "peakActualMW" in data["summary"]


def test_metrics_endpoint():
    res = client.get("/api/energy/metrics?date=2026-01-15")
    assert res.status_code == 200
    data = res.json()
    assert "metrics" in data
    assert "maeMW" in data["metrics"]
    assert "rmseMW" in data["metrics"]
    assert len(data["diurnalProfile"]) == 48


def test_deficits_endpoint():
    res = client.get("/api/energy/deficits?date=2026-01-15")
    assert res.status_code == 200
    data = res.json()
    assert "totals" in data
    assert "timeseries" in data
    assert len(data["timeseries"]) == 48


def test_dates_list_endpoint():
    res = client.get("/api/energy/dates")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] == 31
    assert len(data["dates"]) == 31


def test_monthly_summary_endpoint():
    res = client.get("/api/energy/monthly-summary")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["totalIntervals"] == 1488

