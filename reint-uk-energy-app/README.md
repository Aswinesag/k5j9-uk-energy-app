# UK Energy Day-Ahead Purchasing & Forecast Analytics Platform

> **A production-ready full-stack web application designed for UK energy utilities to optimize day-ahead electricity purchasing, evaluate wind forecast accuracy, and manage thermal backup procurement risks.**
> Sourced from the **Elexon BMRS API** for **January 2026** (48 Settlement Periods / 30-minute intervals).

---

## 1. Executive Summary & Business Context

### The Utility Client
A UK electricity utility purchasing wholesale power on the Day-Ahead Market (EPEX SPOT UK / Nord Pool) to fulfill consumer demand. 

### The Problem
Electricity cannot be cost-effectively stored at grid scale; supply and demand must match continuously at 50 Hz. Renewable wind power is variable and non-dispatchable. To guarantee security of supply:
1. Traders must decide at Day-Ahead Gate Closure (**11:00 UTC on D-1**) how much dispatchable thermal generation (CCGT, OCGT peakers, interconnectors) to procure.
2. Because decisions are locked in 24 hours prior to real-time physical delivery, the utility relies heavily on the latest available **WINDFOR** forecasts.
3. If wind generation is **over-forecasted**, the utility faces an unhedged power deficit in real-time, forcing punitive emergency cash-out in the Balancing Mechanism (**System Buy Price**, which can exceed £4,000/MWh during winter stress events).
4. If wind generation is **under-forecasted**, the utility over-procures expensive thermal assets and must dump surplus power at depressed or negative prices.

### Key Capabilities Delivered
- **Day-Ahead Operations Dashboard:** Interactive visual comparison of latest day-ahead wind forecasts against outturn actuals across all 48 half-hour Settlement Periods (SPs) in January 2026.
- **Quantitative Forecast Evaluation:** Statistical scorecards and risk distributions measuring **MAE**, **RMSE**, **Mean Bias**, **Percentage Bias**, and **Normalized MAE** to quantify forecast uncertainty.
- **Thermal Backup & Deficit Calculator:** Real-time computation of net residual demand (`Demand - Wind Actual`) and procurement shortfalls where backup thermal units must be dispatched.
- **31-Day Meteorological Regime Tracking:** Multi-day volatility and calendar analysis covering Atlantic storm surges, Dunkelflaute wind lulls, and storm cut-out events.

---

## 2. Mathematical & Domain Formulations

| Metric | Formula | Financial & Operational Significance |
| :--- | :--- | :--- |
| **Forecast Error ($\Delta$)** | $e_t = \text{Forecast}_t - \text{Actual}_t$ | Positive = Over-forecast (utility under-procures thermal; faces deficit). Negative = Under-forecast (utility over-procures thermal; has surplus). |
| **MAE** | $\frac{1}{N}\sum_{t=1}^N \|e_t\|$ | Average magnitude of forecast deviation in MW. Fundamental input to intraday reserve sizing. |
| **RMSE** | $\sqrt{\frac{1}{N}\sum_{t=1}^N e_t^2}$ | Volatility and outlier penalty. Heavily weights sudden storm ramps and offshore cut-out misses. |
| **Mean Bias** | $\frac{1}{N}\sum_{t=1}^N e_t$ | Systematic model error. Persistent positive bias indicates chronic over-estimation. |
| **Percentage Bias** | $\frac{\sum e_t}{\sum \text{Actual}_t} \times 100\%$ | Normalized bias as a percentage of total delivered wind volume. |
| **nMAE / nRMSE** | $\frac{\text{MAE}}{\mu_{\text{Actual}}} \times 100\%$ | Normalized metrics allowing fair comparison across seasons and varying fleet capacity. |
| **Residual Thermal Demand** | $R_t = \max(0, \text{Demand}_t - \text{Wind}_t)$ | The net load required to be procured from dispatchable thermal plants. |
| **Procurement Shortfall** | $S_t = \max(0, R_t^{\text{actual}} - R_t^{\text{planned}})$ | Uncovered energy shortfall entering the Balancing Mechanism. |

---

## 3. Technology Stack

### Backend
- **Framework:** Python 3.11+ / FastAPI (high-performance asynchronous API, auto-generated OpenAPI/Swagger schemas)
- **Data Engineering & Analytics:** Pandas, NumPy, Python-Dateutil
- **HTTP Client:** HTTPX (asynchronous connection pooling for Elexon BMRS streaming)
- **Settings & Validation:** Pydantic v2 & Pydantic-Settings
- **Server:** Uvicorn with standard ASGI workers
- **Testing:** Pytest

### Frontend
- **Framework:** React 18+ with Vite (blazing fast HMR and optimized production bundles)
- **Styling:** Tailwind CSS (custom dark/light energy trading terminal theme, JetBrains Mono font integration)
- **Charts:** Recharts (responsive multi-line, stacked area, error distribution histogram, scatter plots with $y=x$ reference lines)
- **Icons:** Lucide React

### Containerization & Deployment
- **Docker & Docker Compose:** Multi-stage Dockerfiles with unprivileged non-root users and health checks.
- **Cloud Ready:** Compatible with Vercel (`vercel.json`), Heroku (`Procfile`), Render, AWS, and GCP.

---

## 4. Repository Structure

```
reint-uk-energy-app/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI entrypoint, lifespan cache pre-warm & CORS
│   │   ├── config.py            # App settings & UK grid reference parameters
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── elexon.py        # Elexon BMRS API integration & Jan 2026 synthetic fallback
│   │   │   └── analytics.py     # Quantitative error calculations (MAE, RMSE, Bias, Residuals)
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── energy.py        # API endpoints: overview, metrics, deficits, dates, monthly
│   │       └── health.py        # Healthcheck and service metadata
│   ├── tests/
│   │   ├── test_analytics.py    # Unit tests for statistical models & Elexon dataset shape
│   │   └── test_api.py          # Integration tests for all REST endpoints
│   ├── Dockerfile               # Multi-stage production Python 3.11 container
│   ├── requirements.txt         # Pinned backend dependencies
│   └── Procfile                 # Heroku/Render process configuration
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx               # Navigation, live status pill, glossary modal trigger
│   │   │   ├── MetricCards.jsx          # KPI scorecards with trend indicators & badges
│   │   │   ├── DateSelector.jsx         # Jan 2026 date picker & weather event presets
│   │   │   ├── SettlementTable.jsx      # 48 half-hour settlement periods with CSV export
│   │   │   └── MarketGlossaryModal.jsx  # UK market definitions & trading rules of thumb
│   │   ├── pages/
│   │   │   ├── DashboardView.jsx        # View 1: Day-Ahead Operations & Forecast Overview
│   │   │   ├── ForecastAccuracyView.jsx # View 2: Quantitative Forecast Accuracy & Error Analytics
│   │   │   ├── ProcurementRiskView.jsx  # View 3: Residual Thermal Procurement & Deficits
│   │   │   └── MonthlySummaryView.jsx   # View 4: 31-Day January 2026 Portfolio Calendar
│   │   ├── services/
│   │   │   └── api.js                   # API client layer with error interceptors
│   │   ├── App.jsx                      # Main UI coordinator
│   │   ├── main.jsx                     # Vite React DOM entrypoint
│   │   └── index.css                    # Tailwind utility layers & custom scrollbars
│   ├── Dockerfile                       # Multi-stage Node builder + Nginx Alpine runner
│   ├── nginx.conf                       # Reverse proxy routing /api to backend
│   ├── package.json                     # Frontend scripts & dependencies
│   ├── tailwind.config.js               # Custom trading terminal color palette
│   ├── vite.config.js                   # Development proxy & build settings
│   └── vercel.json                      # Vercel deployment rewrite rules
├── docker-compose.yml                   # Orchestrates backend & frontend containers
├── pytest.ini                           # Test runner configuration
└── README.md                            # Comprehensive system documentation
```

---

## 5. Quick Start & Setup Instructions

### Option A: Using Docker Compose (Recommended)

To launch the complete application stack (Backend API on port `8000`, Frontend on port `3000`):

```bash
docker compose up --build
```

- **Frontend UI:** Open [http://localhost:3000](http://localhost:3000)
- **Backend Swagger API Docs:** Open [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check:** Open [http://localhost:8000/api/health](http://localhost:8000/api/health)

To stop the containers:
```bash
docker compose down
```

---

### Option B: Local Development Setup

#### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Linux / macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run automated tests
pytest -v

# Start FastAPI development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend

# Install node dependencies
npm install

# Start Vite dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or `http://localhost:5173`) in your browser.

---

## 6. API Reference

All endpoints return JSON responses and support filtering for specific dates in **January 2026** (e.g., `?date=2026-01-15`) or full month aggregation (`?date=all`).

### 1. `GET /api/energy/overview`
Returns time-series pairing actual wind generation (`FUELHH`) vs latest available day-ahead forecast (`WINDFOR`).
```json
{
  "status": "success",
  "date": "2026-01-15",
  "summary": {
    "settlementIntervals": 48,
    "peakActualMW": 19450.2,
    "peakForecastMW": 20850.0,
    "meanActualMW": 14210.5,
    "meanForecastMW": 14663.4,
    "maeMW": 782.3,
    "rmseMW": 1045.1,
    "weatherRegime": "Intense Ramp Event"
  },
  "timeseries": [
    {
      "startTime": "2026-01-15T00:00:00Z",
      "settlementPeriod": 1,
      "actualGenerationMW": 11200.4,
      "forecastGenerationMW": 11850.0,
      "errorMW": 649.6,
      "demandMW": 23400.0,
      "actualResidualMW": 12199.6,
      "plannedResidualMW": 11550.0,
      "procurementShortfallMW": 649.6
    }
  ]
}
```

### 2. `GET /api/energy/metrics`
Returns quantitative forecast accuracy metrics and risk distributions:
- `maeMW`: Mean Absolute Error
- `rmseMW`: Root Mean Square Error
- `meanBiasMW`: Mean Error (Forecast - Actual)
- `percentageBias`: Relative percentage bias vs actuals
- `nmaePercent`: Normalized MAE (% of mean generation)
- `rSquared`: Coefficient of determination ($R^2$)
- `errorDistribution`: 16 histogram bins with frequency counts
- `diurnalProfile`: 48 half-hour average error metrics

### 3. `GET /api/energy/deficits`
Calculates residual power demand (`Demand - Wind`) and thermal procurement gaps where thermal backup was under- or over-procured.

### 4. `GET /api/energy/dates`
Returns all 31 days of January 2026 with high-level daily weather regime indicators, daily MAE, and peak shortfall values.

### 5. `GET /api/energy/monthly-summary`
Aggregates month-level statistics across all 1,488 settlement periods in January 2026 (Total Wind TWh, Total Thermal TWh, Portfolio MAE/RMSE/Bias).

---

## 7. Operational Scenarios & Case Studies (January 2026)

The application models realistic meteorological regimes that UK power traders encounter:

1. **January 02 (Atlantic Storm Inflow):**
   - High wind generation (~17.5–22 GW).
   - High overall output, but small timing errors lead to high absolute MAE during front arrival.
2. **January 11 (Anticyclonic Dunkelflaute):**
   - Freezing high pressure, low wind generation (~1.8–4.2 GW) with high domestic heating demand.
   - NWP models systematically over-forecast light winds (+850 MW bias), exposing the utility to thermal shortfall risk at peak evening hours.
3. **January 15 (Rapid Ramp Timing Miss):**
   - Storm arrives 1.5 hours later than day-ahead models forecast.
   - Significant ramp phase error during morning peak (SP 14–20).
4. **January 19 (Extreme Gale with Offshore Cut-out):**
   - Gale wind speeds exceed 25 m/s. Offshore turbines automatically feather blades to prevent structural damage.
   - Actual wind drops from 22 GW to 15.5 GW while NWP model failed to predict the cut-out, creating a major 3,800 MW deficit.

---

## 8. AI Tools Acknowledgement

In compliance with project specifications, **AI-assisted engineering tools (Advanced Agentic AI & Large Language Models)** were utilized throughout the project lifecycle to accelerate:
- Mathematical formulation of UK balancing mechanism risk equations.
- Ingestion schema mapping for Elexon BMRS `FUELHH` and `WINDFOR` datasets.
- Fast generation of unit test suites and mock weather regime generators.
- UI component scaffolding with Tailwind CSS and Recharts.

---

## 9. License

Developed for the UK Energy Utility Client. All rights reserved &copy; 2026.
