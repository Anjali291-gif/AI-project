# FreightAI — Intelligent Freight Forecasting & Vessel Chartering System

> **SIH 2026 · Problem Statement SIH26006 · Team P23**
>
> An AI-powered maritime freight intelligence platform for real-time freight rate prediction, vessel chartering optimization, and bulk cargo procurement — built with FastAPI, React, XGBoost, and Random Forest.

[![Backend Tests](https://img.shields.io/badge/tests-6%2F6%20passed-brightgreen)](#testing)
[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)](https://python.org)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](#)

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Tech Stack](#tech-stack)
5. [Frontend Modules](#frontend-modules)
6. [Backend & API](#backend--api)
7. [ML Pipeline](#ml-pipeline)
8. [Dataset](#dataset)
9. [Folder Structure](#folder-structure)
10. [Local Setup](#local-setup)
11. [Environment Variables](#environment-variables)
12. [Deployment (Render)](#deployment-render)
13. [Testing](#testing)
14. [Screenshots](#screenshots)
15. [Limitations & Future Scope](#limitations--future-scope)
16. [Contributors](#contributors)

---

## Problem Statement

Maritime freight pricing is opaque, volatile, and difficult to forecast. Shipping companies and cargo owners lack real-time tools to:
- Predict accurate freight rates across vessel classes and trade lanes.
- Optimize vessel chartering decisions using multiple competing objectives.
- Procure bulk cargo cost-efficiently with scenario analysis.

FreightAI addresses all three with machine-learning models trained on historical shipping data, surfaced through a modern web interface.

---

## Features

| Module | Capability |
|---|---|
| **Dashboard** | Live KPIs, vessel map, alert feed, customizable widget grid |
| **AI Freight Forecast** | ML-powered rate prediction with 95% confidence interval, time-series chart, CSV export |
| **Vessel Chartering** | Live AIS map, AI multi-objective optimizer, vessel ranking table |
| **Bulk Cargo Procurement** | Scenario manager (Spot / COA / Shuttle / Custom), landed cost calculator |
| **Model Insights & ML Registry** | Model comparison, evaluation metrics, training telemetry, dataset explorer, live inference workbench |
| **Global Search** | Cross-module search for vessels, ports, routes, commodities |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│          Browser (React + Vite)             │
│  Dashboard · Forecast · Chartering          │
│  Procurement · Model Insights               │
│  Global Search · Dark/Light Theme           │
└──────────────┬──────────────────────────────┘
               │  REST (fetch /api/*)
               │  Dev: Vite proxy → localhost:8000
               │  Prod: VITE_API_URL env var
┌──────────────▼──────────────────────────────┐
│          FastAPI (Python 3.11)              │
│  /api/health · /api/dashboard               │
│  /api/forecast · /api/vessels               │
│  /api/chartering-decision                   │
│  /api/procurement/scenarios                 │
│  /api/models · /api/models/dataset          │
│  /api/models/predict-test · /api/search     │
└──────────────┬──────────────────────────────┘
               │
     ┌─────────┴──────────┐
     │                    │
┌────▼─────┐    ┌─────────▼──────┐
│ XGBoost  │    │  Random Forest │
│ Pipeline │    │  Pipeline      │
│ (primary)│    │  (baseline)    │
└────┬─────┘    └─────────┬──────┘
     └─────────┬──────────┘
               │
     ┌─────────▼──────────┐
     │  historical_freight │
     │  _data.csv (6,500) │
     └────────────────────┘
```

See [`docs/architecture.md`](docs/architecture.md) for a detailed component diagram.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite 6, Tailwind CSS 3, Recharts, Leaflet |
| **Backend** | Python 3.11, FastAPI 0.110, Uvicorn, Pydantic v2 |
| **ML** | XGBoost 2.0, scikit-learn 1.4, joblib, NumPy, pandas |
| **Dev Tools** | ESLint, TypeScript strict mode, pytest, python-dotenv |
| **Deployment** | Render (web service + static site), GitHub |

---

## Frontend Modules

### Dashboard (`/`)
Customizable KPI cards, real-time alert feed, interactive world map with vessel markers, and a widget grid. The "Add Widget" button opens a portal-based modal that sits above the map layer.

### AI Freight Forecast (`/forecast`)
Selectable route, vessel class, commodity, forecast horizon, fuel price, congestion, and weather. Renders a Recharts composite chart with:
- Solid historical rate line
- Dashed future prediction line
- Shaded 95% confidence interval band

Exports a fully populated CSV with all chart data.

### Vessel Chartering (`/chartering`)
Live AIS-style world map with vessel positions. The Charter Optimizer opens a full-screen portal modal showing AI-ranked vessels by cost/time/efficiency — the map is hidden while the modal is open.

### Bulk Cargo Procurement (`/procurement`)
Scenario tabs (Spot, COA, Shuttle, Custom), procurement cards, order table, timeline schedule, and a landed cost calculator (FOB + Ocean Freight + BAF + Canal Toll + THC + Marine Insurance).

### Model Insights & ML Registry (`/models`)
Five-tab interface: Overview → Model Comparison → Dataset Explorer → Feature Analysis → Inference Workbench. Displays actual model metadata, real R²/MAE/RMSE/MAPE metrics, and allows live predictions.

---

## Backend & API

**Base URL (dev):** `http://127.0.0.1:8000`
**Interactive docs:** `http://127.0.0.1:8000/docs`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check; reports ML model load status |
| GET | `/api/dashboard` | KPIs, vessel markers, alerts |
| POST | `/api/forecast` | Freight rate prediction + time series |
| GET | `/api/vessels` | Vessel fleet list |
| POST | `/api/chartering-decision` | Multi-objective vessel ranking |
| GET | `/api/procurement/scenarios` | Procurement scenario data |
| GET | `/api/models` | ML registry + model metadata |
| GET | `/api/models/dataset` | Paginated dataset preview |
| POST | `/api/models/predict-test` | Live inference workbench |
| GET | `/api/search` | Global search across vessels/ports/routes |

Full API reference: [`docs/api-documentation.md`](docs/api-documentation.md)

---

## ML Pipeline

### Training (`backend/ml/train_models.py`)

Both models are trained on `backend/data/historical_freight_data.csv` (6,500 labelled voyages).

**Features (11 input columns):**
`route_origin`, `route_destination`, `distance_nm`, `vessel_class`, `vessel_dwt`, `commodity`, `bunker_price_usd_t`, `port_congestion_days`, `weather_risk_index`, `cargo_demand_index`, `canal_transit`

**Target:** `freight_rate_usd_per_ton`

**Pipeline:**
```
Raw CSV → feature encoding (OrdinalEncoder) → 80/20 train-test split
  → XGBoost Regressor (primary model, R² = 0.9676)
  → Random Forest Regressor (baseline model, R² = 0.9742)
  → joblib serialization → backend/ml/models/
```

**Saved artifacts (committed to repo):**
| File | Size | Description |
|---|---|---|
| `freight_rate_xgb.joblib` | 793 KB | Primary XGBoost pipeline |
| `freight_rate_rf.joblib` | 4.2 MB | Random Forest baseline |
| `model_metadata.json` | 3 KB | Evaluation metrics, feature list |

> **Dataset provenance:** The 6,500-row dataset is a synthetic but domain-realistic dataset generated from published maritime freight benchmarks (Baltic Dry Index ranges, Clarksons freight data distributions). It is not sourced from a live exchange feed. All statistics should be treated as illustrative, not operational.

---

## Dataset

| Property | Value |
|---|---|
| File | `backend/data/historical_freight_data.csv` |
| Rows | 6,500 labelled voyages |
| Columns | 13 (11 features + voyage_days + freight_rate_usd_per_ton) |
| Vessel classes | Handysize, Supramax, Panamax, Capesize |
| Commodities | Iron Ore, Coal, Grain, Fertilizer, Clean Petroleum, LNG |
| Routes | 10 major trade lanes (Rotterdam, Singapore, Houston, etc.) |
| Rate range | \$2.5–\$35 / ton (synthetic, domain-realistic) |

---

## Folder Structure

```
AI-Project/
├── .gitignore
├── .env.example               ← root env template (copy to backend/.env)
├── render.yaml                ← Render.com deployment blueprint
├── README.md
├── CONTRIBUTING.md
├── start_backend.bat          ← Windows: start FastAPI backend
├── start_frontend.bat         ← Windows: start Vite dev server
│
├── backend/
│   ├── main.py                ← FastAPI app (all API endpoints)
│   ├── requirements.txt       ← Python dependencies
│   ├── data/
│   │   └── historical_freight_data.csv
│   ├── ml/
│   │   ├── train_models.py    ← Training script
│   │   └── models/
│   │       ├── freight_rate_xgb.joblib
│   │       ├── freight_rate_rf.joblib
│   │       └── model_metadata.json
│   └── tests/
│       └── test_api.py        ← 6 integration tests
│
├── frontend/
│   ├── .env.example           ← frontend env template
│   ├── vite.config.ts         ← Vite config + dev proxy
│   ├── tsconfig.json
│   ├── package.json
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.css
│       ├── components/        ← Shared UI components
│       ├── pages/             ← Route-level page components
│       ├── services/api.ts    ← All API calls (env-aware base URL)
│       ├── types/index.ts     ← TypeScript type definitions
│       └── context/           ← React contexts (Theme)
│
└── docs/
    ├── architecture.md
    └── api-documentation.md
```

---

## Local Setup

### Prerequisites
- **Python** 3.10+ (3.11 recommended)
- **Node.js** 18+ (20 recommended)
- **npm** 9+
- **Git**

### 1. Clone the repository

```bash
git clone https://github.com/Anjali291-gif/AI-project.git
cd AI-project
```

### 2. Backend setup

```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt

# (Optional) Create a .env file for local overrides
# cp ../env.example .env

# Start the FastAPI backend
# Option A — from project root (recommended):
cd ..
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

# Option B — from backend/ directory:
cd backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at `http://127.0.0.1:8000`.
Interactive docs: `http://127.0.0.1:8000/docs`

### 3. Frontend setup

In a **separate terminal**:

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

> **How the connection works in development:**
> The Vite dev server proxies all `/api/*` requests to `http://127.0.0.1:8000`
> (configured in `vite.config.ts`). No CORS issues, no environment variable needed.

### 4. Run tests

```bash
# Backend integration tests (from project root)
python backend/tests/test_api.py

# Frontend type check + production build
cd frontend
npm run build
```

### Windows Quick Start

Double-click (run as separate processes):
1. `start_backend.bat` — starts FastAPI on port 8000
2. `start_frontend.bat` — starts Vite on port 5173

---

## Environment Variables

### Backend (`backend/.env` or platform env)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8000` | Uvicorn port (Render sets this automatically) |
| `HOST` | `0.0.0.0` | Bind address |
| `ENVIRONMENT` | `development` | `development` or `production` |
| `ALLOWED_ORIGINS` | `""` (all) | Comma-separated CORS origins |

### Frontend (`frontend/.env` — build-time only)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `""` | Backend public URL. Empty = use Vite proxy (dev) or same-origin. Set to backend URL for cross-origin production deploys. |

> See `.env.example` and `frontend/.env.example` for annotated templates.

---

## Deployment (Render)

This repository includes `render.yaml` for one-click deployment on [Render](https://render.com).

### Services

| Service | Type | Root Dir | Build Command | Start Command |
|---|---|---|---|---|
| `freightai-backend` | Web (Python) | `backend/` | `pip install -r requirements.txt` | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| `freightai-frontend` | Static Site | `frontend/` | `npm install && npm run build` | — (static) |

### Step-by-step deployment

1. **Push** this repository to GitHub (already done).
2. Go to [render.com](https://render.com) → **New** → **Blueprint**.
3. Connect the GitHub repo `Anjali291-gif/AI-project`.
4. Render reads `render.yaml` and creates both services.
5. After the **backend** deploys, copy its public URL (e.g. `https://freightai-backend.onrender.com`).
6. In the **frontend** service settings → **Environment** → add:
   ```
   VITE_API_URL = https://freightai-backend.onrender.com
   ```
7. In the **backend** service settings → **Environment** → add:
   ```
   ALLOWED_ORIGINS = https://freightai-frontend.onrender.com
   ```
8. **Trigger a manual redeploy** of the frontend so it rebuilds with the correct `VITE_API_URL`.

> **Free tier note:** Render free services spin down after 15 minutes of inactivity. The first request after spin-down takes ~30 seconds while the ML models reload.

> **ML models:** Both `.joblib` model files are committed to the repository and are loaded at startup. No separate model storage or download step is needed.

### Alternative platforms

| Platform | Frontend | Backend |
|---|---|---|
| Vercel | `vercel` (auto-detects Vite) | Use Vercel Serverless Functions or separate backend |
| Netlify | `netlify deploy --dir=frontend/dist` | Separate backend service |
| Railway | `railway up` from project root | Supports monorepo with separate services |
| Fly.io | Use `Dockerfile` (not included) | Full Docker support |

---

## Testing

### Backend (6 integration tests)

```bash
python backend/tests/test_api.py
```

| Test | Endpoint | Checks |
|---|---|---|
| `test_health` | `GET /api/health` | Status=healthy, ML model loaded |
| `test_dashboard` | `GET /api/dashboard` | KPIs, vessels, alerts present |
| `test_forecast` | `POST /api/forecast` | Predicted rate, CI range, time series |
| `test_vessels_and_chartering` | `GET /api/vessels`, `POST /api/chartering-decision` | Fleet count, ranked vessels |
| `test_procurement` | `GET /api/procurement/scenarios` | Procurement cards, orders, schedules |
| `test_models` | `GET /api/models` | Model metadata present |

### Frontend

```bash
cd frontend
npm run build      # TypeScript check + Vite production build
npm run preview    # Serve the built static files locally
```

---

## Screenshots

| Dashboard | AI Freight Forecast |
|---|---|
| ![Dashboard](01-dashboard.png.png) | ![Forecast](02-ai-freight-forecast.png.png) |

| Vessel Chartering | Bulk Cargo Procurement |
|---|---|
| ![Chartering](03-vessel-chartering.png.png) | ![Procurement](04-bulk-cargo-procurement.png.png) |

| Model Insights & ML Registry |
|---|
| ![Model Insights](05-model-insights.png.png) |

---

## Limitations & Future Scope

### Current Limitations
- **Dataset is synthetic.** Freight rates and routes are domain-realistic but generated, not sourced from live exchanges. Do not use for operational shipping decisions.
- **No real-time AIS data.** Vessel positions on the map are simulated. Integration with a live AIS provider (e.g. MarineTraffic API) is planned.
- **Free-tier cold starts.** Render free services sleep after inactivity; ML model reload takes ~30s on wakeup.
- **Single-process backend.** The free tier uses 1 Uvicorn worker. Under load, consider upgrading or using Gunicorn + multiple workers.

### Future Scope
- [ ] Live AIS data integration (MarineTraffic / AISHub API)
- [ ] Real historical rate data from Baltic Exchange / Clarksons
- [ ] User authentication and saved forecasts
- [ ] Email/SMS alert notifications for rate thresholds
- [ ] Model retraining pipeline with new data
- [ ] Containerization (Docker + docker-compose)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Mobile-responsive PWA

---

## Contributors

| Name | Role |
|---|---|
| Anjali Yadav (Anjali291-gif) | Full-stack development, ML engineering, project lead |

---

## Acknowledgements

- [SIH 2026](https://www.sih.gov.in/) for the problem statement framework
- [FastAPI](https://fastapi.tiangolo.com) — high-performance Python API framework
- [XGBoost](https://xgboost.readthedocs.io/) — gradient boosting ML library
- [Recharts](https://recharts.org/) — React charting library
- [Leaflet](https://leafletjs.com/) — open-source interactive maps
- [Render](https://render.com) — cloud deployment platform

---

*FreightAI is a research/academic project. It is not affiliated with any shipping exchange or logistics company.*
