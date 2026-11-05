# FreightAI — System Architecture

## Overview

FreightAI is a multi-tier web application consisting of:

1. **React/TypeScript Frontend** — A single-page application (SPA) built with Vite
2. **FastAPI Python Backend** — An asynchronous REST API server
3. **ML Pipeline** — XGBoost and Random Forest regression models with scikit-learn
4. **Static Dataset** — A physics-grounded synthetic maritime voyage dataset

---

## Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         FreightAI Platform                               │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                     Browser (User)                                  │ │
│  │   localhost:5173   —   React 18 SPA (TypeScript + Vite)            │ │
│  │                                                                     │ │
│  │  ┌────────────────┐  ┌────────────────┐  ┌──────────────────────┐  │ │
│  │  │  DashboardPage │  │  ForecastPage  │  │ VesselCharteringPage │  │ │
│  │  └────────────────┘  └────────────────┘  └──────────────────────┘  │ │
│  │  ┌────────────────┐  ┌──────────────────────────────────────────┐  │ │
│  │  │ ProcurementPage│  │       ModelInsightsPage                  │  │ │
│  │  └────────────────┘  └──────────────────────────────────────────┘  │ │
│  │                                                                     │ │
│  │  ┌─────────────────────────────────────────────────────────────┐   │ │
│  │  │               src/services/api.ts                           │   │ │
│  │  │  HTTP Client · Auto-detect backend · Offline fallback cache │   │ │
│  │  └──────────────────────────┬──────────────────────────────────┘   │ │
│  └─────────────────────────────┼───────────────────────────────────────┘ │
│                                │ HTTP/JSON (CORS: allow_origins=["*"])    │
│  ┌─────────────────────────────▼───────────────────────────────────────┐ │
│  │             FastAPI Backend  —  127.0.0.1:8000                      │ │
│  │                                                                     │ │
│  │  ┌─────────────────────────────────────────────────────────────┐   │ │
│  │  │  Pydantic Request Validation (ForecastRequest, etc.)        │   │ │
│  │  └──────────────────────────┬──────────────────────────────────┘   │ │
│  │                             │                                       │ │
│  │  ┌──────────────────────────▼──────────────────────────────────┐   │ │
│  │  │  predict_rate_ml() — Feature engineering + XGBoost predict  │   │ │
│  │  └──────────────────────────┬──────────────────────────────────┘   │ │
│  │                             │                                       │ │
│  │  ┌──────────────────────────▼──────────────────────────────────┐   │ │
│  │  │  ML Pipeline (loaded at startup)                            │   │ │
│  │  │  ├── ml_pipeline  — freight_rate_xgb.joblib (XGBoost V4)   │   │ │
│  │  │  ├── rf_pipeline  — freight_rate_rf.joblib  (RF V2)        │   │ │
│  │  │  ├── model_metadata.json — metrics & feature importances   │   │ │
│  │  │  └── hist_df — historical_freight_data.csv (6,500 rows)    │   │ │
│  │  └─────────────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Request/Response Flow — Freight Rate Prediction

```
User Input (ForecastPage)
    │
    │  origin, destination, vessel_class, commodity,
    │  forecast_horizon_days, bunker_price_usd_t,
    │  port_congestion_days, weather_risk_index,
    │  cargo_demand_index, canal_transit
    ▼
services/api.ts → POST http://127.0.0.1:8000/api/forecast
    │
    ▼
FastAPI: Pydantic ForecastRequest validation
    │
    ▼
predict_rate_ml(req):
    ├── Map vessel_class → DWT (dwt_map)
    ├── Build feature dict (21 columns matching training schema)
    ├── One-hot encode vessel_class_{class} = 1
    ├── One-hot encode commodity_{type} = 1
    ├── DataFrame alignment to feature_cols order
    └── ml_pipeline["model"].predict(feat_df)[0]
    │
    ▼
get_forecast_series(req, base_rate):
    ├── Loop day 1..forecast_horizon_days (step 7)
    ├── Apply trend drift + market noise per point
    ├── Compute CI bounds: rate ± 1.96 × RMSE_test
    └── Build TimeSeriesPoint list [{date, rate, lower, upper}]
    │
    ▼
JSON Response:
    {
      "predicted_freight_rate": 16.94,
      "predicted_range": {"low": 13.90, "high": 20.00},
      "time_series": [...],
      "influencing_factors": [...],
      "model_used": "FreightAI-XGBoost-V4",
      "is_live_ml": true,
      "confidence_score": 0.9676,
      "summary": "..."
    }
    │
    ▼
ForecastPage renders:
    ├── KPI cards (Predicted Rate, Confidence, Rate Change)
    ├── Recharts ComposedChart (line + area + reference line)
    ├── SHAP factor bars
    └── Export CSV button
```

---

## Backend Module Structure (backend/main.py)

The entire backend is implemented as a single FastAPI application file (~1,400 lines) for simplicity.

**Sections in `main.py`:**

| Lines | Section |
|---|---|
| 1-55 | Imports, FastAPI app init, CORS, model loading |
| 56-375 | Pydantic request/response models (ForecastRequest, ChartRequest, etc.) |
| 376-660 | ML prediction helpers (predict_rate_ml, get_forecast_series, build_shap_factors) |
| 661-700 | `/api/health` endpoint |
| 701-900 | `/api/dashboard` endpoint |
| 901-1000 | `/api/forecast` endpoint |
| 1001-1100 | `/api/vessels` and `/api/chartering-decision` endpoints |
| 1101-1200 | `/api/procurement/scenarios` endpoint |
| 1200-1340 | `/api/models`, `/api/models/dataset`, `/api/models/predict-test` endpoints |
| 1340-1400 | `/api/analytics`, `/api/routes`, `/api/search` endpoints |

---

## Frontend Module Structure

```
src/
├── App.tsx                 # Root — page routing (state machine via activePage),
│                           # modal/drawer state, theme wrapper
├── main.tsx                # ReactDOM.createRoot entry
├── index.css               # Tailwind directives + maritime scrollbar overrides
│
├── context/
│   └── ThemeContext.tsx     # React context — dark/light theme toggle with localStorage
│
├── types/
│   └── index.ts            # All TypeScript interfaces:
│                           #   NavigationPage, KPIItem, ForecastResponse,
│                           #   TimeSeriesPoint, Vessel, PortRoute,
│                           #   ModelMetadata, SearchPortItem, etc.
│
├── services/
│   └── api.ts              # ApiService class — static async methods for each endpoint.
│                           # Falls back to embedded static data if backend unreachable.
│                           # Configured via API_BASE_URL = import.meta.env.VITE_API_URL
│
├── components/
│   ├── Sidebar.tsx         # Collapsible left nav — section tabs with badge counters
│   ├── Header.tsx          # Top bar — greeting, GlobalSearch, refresh, theme toggle
│   ├── WorldMap.tsx        # SVG maritime map — vessel markers, route arcs, AIS tooltip
│   ├── KPICard.tsx         # Compact metric card (value, change %, status badge)
│   ├── AlertsWidget.tsx    # Fleet alert list with action button handlers
│   ├── GlobalSearch.tsx    # Typeahead search — queries vessels, ports, routes, commodities
│   ├── CharterOptimizerModal.tsx # Multi-objective vessel optimizer popup (z-index: portal)
│   ├── CustomizeWidgetsModal.tsx # Widget selector modal (React portal, z-index safe)
│   └── PortDetailsModal.tsx      # Port info panel with route/vessel lists
│
└── pages/
    ├── DashboardPage.tsx   # Map, KPIs, alerts, operations table, turnaround chart
    ├── ForecastPage.tsx    # Forecast chart, factor bars, CSV export
    ├── VesselCharteringPage.tsx  # Route table, AIS map, optimizer modal trigger
    ├── ProcurementPage.tsx # Scenarios, parcel cards, Gantt, landed cost calculator
    └── ModelInsightsPage.tsx     # 5-tab: Overview, Comparison, Features, Dataset, Workflow
```

---

## State Management

FreightAI does not use Redux, Zustand, or any external state manager. State is managed with:

- **React `useState`** — component-local UI state (selected tabs, loading flags, form inputs)
- **React `useEffect`** — data fetching on mount/tab switch
- **React Context** — `ThemeContext` for dark/light theme (1 global context)
- **Props** — parent→child data passing for modals and widgets
- **`services/api.ts`** — all async data fetching centralized here

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Single `main.py` file | Simplifies setup and dependency; appropriate for hackathon-scale backend |
| Synthetic dataset | Avoids licensing issues; demonstrates physics-grounded ML principles reproducibly |
| Offline fallback in `api.ts` | Allows frontend demo without backend; transparent to user via status pill |
| Absolute path resolution via `__file__` | Prevents model loading failures regardless of uvicorn launch directory |
| React portals for modals | Prevents z-index conflicts with Leaflet maps and canvas elements |
| `credential.helper=manager` in git | Uses Windows Credential Manager for GitHub auth — no tokens in source |

---

## Deployment Notes

For production deployment (not part of current implementation):

- Replace single-process uvicorn with `gunicorn -k uvicorn.workers.UvicornWorker`
- Add reverse proxy (Nginx/Caddy) for HTTPS termination
- Serve frontend `dist/` as static files via Nginx or cloud storage (S3/CloudFront)
- Replace in-memory model loading with model registry (MLflow / SageMaker)
- Add PostgreSQL/Redis for prediction history, user sessions, and rate caching
