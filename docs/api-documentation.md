# FreightAI — API Documentation

Base URL: `http://127.0.0.1:8000`  
Interactive Docs: `http://127.0.0.1:8000/docs` (Swagger UI)  
OpenAPI Schema: `http://127.0.0.1:8000/openapi.json`

All endpoints return JSON. CORS is configured to allow all origins (`*`) for local development.

---

## GET /api/health

Returns backend health status and ML model load status.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-11-05T10:00:00.000000",
  "ml_model_loaded": true,
  "model_name": "FreightAI-XGBoost-V4",
  "r2_score": 0.9676
}
```

| Field | Type | Description |
|---|---|---|
| `status` | string | Always `"healthy"` if running |
| `ml_model_loaded` | boolean | `true` if XGBoost pipeline loaded successfully |
| `model_name` | string | Active model identifier |
| `r2_score` | float \| null | Test-set R² score (null if fallback mode) |

---

## GET /api/dashboard

Returns all data required for the dashboard page: KPI metrics, vessel alerts, map markers, and operations table.

**Response:**
```json
{
  "kpis": {
    "active_vessels": 48,
    "in_voyage": 34,
    "at_berth": 10,
    "under_load": 6,
    "port_delays_pct": 18,
    "port_delays_change": -4.6,
    "route_efficiency_pct": 87,
    "route_efficiency_change": 2.8
  },
  "alerts": [
    {
      "id": "ALT001",
      "type": "storm",
      "severity": "high",
      "message": "Storm Warning — North Atlantic Corridor",
      "vessel": "MV Pacific Voyager",
      "actions": ["Reroute", "View Route"]
    }
  ],
  "vessel_map_markers": [
    {
      "id": "V001",
      "name": "MV Pacific Voyager",
      "lat": 48.3,
      "lng": -20.1,
      "status": "In Voyage",
      "class": "LR3",
      "destination": "Rotterdam",
      "eta": "Nov 12, 2026"
    }
  ],
  "operations_table": [ ... ],
  "avg_turnaround_chart": [ ... ]
}
```

---

## POST /api/forecast

Runs ML freight rate prediction for the given voyage parameters.

**Request Body:**
```json
{
  "origin": "Far East Main (Shanghai)",
  "destination": "North Europe Main (Rotterdam)",
  "vessel_class": "Capesize",
  "commodity": "Iron Ore",
  "forecast_horizon_days": 30,
  "distance_nm": 10550.0,
  "bunker_price_usd_t": 624.0,
  "port_congestion_days": 2.5,
  "weather_risk_index": 2.4,
  "cargo_demand_index": 112.0,
  "canal_transit": 1
}
```

**Request Fields:**

| Field | Type | Required | Range / Values |
|---|---|---|---|
| `origin` | string | Yes | Any string |
| `destination` | string | Yes | Any string |
| `vessel_class` | string | Yes | Handysize, Supramax, Panamax, Capesize, MR2, LR1, LR2, LR3, VLCC |
| `commodity` | string | Yes | Iron Ore, Coal, Grain, Crude Oil, Clean Petroleum, Chemicals / Sulfuric Acid, Bauxite |
| `forecast_horizon_days` | integer | Yes | 7 – 90 |
| `distance_nm` | float | Yes | 50 – 25000 |
| `bunker_price_usd_t` | float | Yes | 200 – 1500 |
| `port_congestion_days` | float | Yes | 0 – 30 |
| `weather_risk_index` | float | Yes | 1.0 – 5.0 |
| `cargo_demand_index` | float | Yes | 50 – 200 |
| `canal_transit` | integer | Yes | 0, 1, or 2 |

**Response:**
```json
{
  "predicted_freight_rate": 16.94,
  "predicted_range": {
    "low": 13.90,
    "high": 20.00
  },
  "confidence_score": 0.9676,
  "model_used": "FreightAI-XGBoost-V4",
  "is_live_ml": true,
  "influencing_factors": [
    {
      "factor": "Bunker Fuel Price",
      "impact": 34.2,
      "direction": "positive"
    },
    {
      "factor": "Port Congestion",
      "impact": 21.8,
      "direction": "positive"
    }
  ],
  "time_series": [
    {
      "date": "2026-10-05",
      "rate": 15.2,
      "is_future": false,
      "lower_bound": null,
      "upper_bound": null
    },
    {
      "date": "2026-11-12",
      "rate": 16.94,
      "is_future": true,
      "lower_bound": 13.90,
      "upper_bound": 20.00
    }
  ],
  "summary": "Freight rates are projected to increase..."
}
```

**Response Fields:**

| Field | Type | Description |
|---|---|---|
| `predicted_freight_rate` | float | Point estimate ($/ton) |
| `predicted_range.low` | float | 95% CI lower bound |
| `predicted_range.high` | float | 95% CI upper bound |
| `confidence_score` | float | Model R² score |
| `model_used` | string | Model identifier |
| `is_live_ml` | boolean | `true` = real ML, `false` = heuristic fallback |
| `influencing_factors` | array | SHAP-approximated factor attributions |
| `time_series` | array | Historical + forecast points |

---

## GET /api/vessels

Returns the full registered fleet list.

**Response:**
```json
{
  "count": 8,
  "vessels": [
    {
      "id": "V001",
      "name": "MV Baltic Wave",
      "class": "LR3",
      "dwt": 160000,
      "current_status": "Available",
      "current_port": "Rotterdam",
      "daily_hire_usd": 28500,
      "speed_knots": 14.2,
      "fuel_consumption_t_day": 42,
      "cii_rating": "A",
      "build_year": 2021,
      "flag": "Marshall Islands"
    }
  ]
}
```

---

## POST /api/chartering-decision

Multi-objective vessel ranking for a charter request.

**Request Body:**
```json
{
  "origin_port": "Rotterdam [NL]",
  "destination_port": "Lagos [NG]",
  "cargo_quantity_mts": 150000,
  "commodity": "Clean Petroleum",
  "laycan_start": "2026-11-01",
  "laycan_end": "2026-11-05",
  "priority": "cost"
}
```

| Field | Type | Values |
|---|---|---|
| `priority` | string | `"cost"`, `"speed"`, `"environmental"`, `"balanced"` |

**Response:**
```json
{
  "recommended_vessel": {
    "vessel": { "name": "MV Baltic Wave", ... },
    "rank": 1,
    "total_voyage_cost_usd": 2340000,
    "cost_per_ton": 15.6,
    "voyage_days": 15,
    "cii_impact": "Positive",
    "score": 0.934
  },
  "ranked_vessels": [ ... ],
  "executive_rationale": "MV Baltic Wave ranked first due to...",
  "voyage_economics": {
    "bunker_cost": 1200000,
    "charter_hire": 427500,
    "canal_fees": 0,
    "port_charges": 170000,
    "total": 1797500
  }
}
```

---

## GET /api/procurement/scenarios

Returns procurement scenario data for all 4 scenarios.

**Response:**
```json
{
  "active_scenario": "Scenario A",
  "procurement_cards": [ ... ],
  "orders_table": [
    {
      "id": "PO-2847",
      "parcels": 3,
      "from_region": "Rotterdam",
      "from_port": "Rotterdam [NL]",
      "to_port": "Mumbai [IN]",
      "to_region": "India",
      "amount_mts": 125000,
      "commodity": "Clean Petroleum",
      "freight_usd_t": 18.42,
      "landed_cost_usd_t": 24.18,
      "savings_usd_t": 3.21,
      "is_optimal": true
    }
  ],
  "timeline_schedules": [ ... ],
  "landed_cost_calculator": {
    "fob_price": 285.0,
    "ocean_freight": 18.42,
    "bunker_adjustment": 4.20,
    "canal_toll": 1.85,
    "terminal_handling": 2.10,
    "marine_insurance": 0.95,
    "total_landed_cost": 312.52
  }
}
```

---

## GET /api/models

Returns the ML model registry with metadata and dataset summary.

**Response:**
```json
{
  "status": "ready",
  "is_real_ml": true,
  "active_version": "Version 4 (Production)",
  "primary_model": "FreightAI-XGBoost-V4",
  "backend_engine": "FastAPI + XGBoost Regressor (Scikit-Learn)",
  "registered_models_count": 3,
  "models_available": [
    {
      "name": "FreightAI-XGBoost-V4",
      "type": "XGBoost Regressor",
      "status": "Production Active",
      "is_primary": true
    }
  ],
  "model_metadata": {
    "model_name": "FreightAI-XGBoost-V4",
    "algorithm": "Extreme Gradient Boosting (XGBoost)",
    "training_samples": 5200,
    "test_samples": 1300,
    "trained_at": "2026-10-28T14:49:38.290860",
    "metrics": {
      "mae": 1.108,
      "rmse": 1.544,
      "r2": 0.9676,
      "mape_percent": 7.45
    },
    "comparison_models": [ ... ],
    "top_features": [ ... ],
    "business_drivers": { ... },
    "feature_columns": [ ... ],
    "dataset_summary": {
      "total_records": 6500,
      "training_samples": 5200,
      "test_samples": 1300,
      "split_ratio": "80 / 20 Train/Test Holdout",
      "missing_values_count": 0,
      "file_size_bytes": 703465
    }
  }
}
```

---

## GET /api/models/dataset

Returns a paginated preview of the training dataset.

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | integer | 1 | Page number (1-indexed) |
| `page_size` | integer | 10 | Rows per page (max 100) |

**Response:**
```json
{
  "total_rows": 6500,
  "page": 1,
  "page_size": 10,
  "total_pages": 650,
  "columns": [
    {
      "name": "route_origin",
      "type": "categorical",
      "dtype": "object",
      "missing": 0
    }
  ],
  "rows": [
    {
      "route_origin": "Middle East (Jubail)",
      "route_destination": "India (Vizag)",
      "distance_nm": 2723.5,
      "vessel_class": "Capesize",
      "vessel_dwt": 180000,
      "commodity": "Crude Oil",
      "bunker_price_usd_t": 675.18,
      "port_congestion_days": 1.3,
      "weather_risk_index": 1.38,
      "cargo_demand_index": 99.38,
      "canal_transit": 0,
      "voyage_days": 9.7,
      "freight_rate_usd_per_ton": 4.45
    }
  ]
}
```

---

## POST /api/models/predict-test

Runs a live test inference against the specified model.

**Request Body:**
```json
{
  "model_name": "FreightAI-XGBoost-V4",
  "distance_nm": 4120.0,
  "vessel_class": "LR3",
  "commodity": "Clean Petroleum",
  "bunker_price": 620.0,
  "port_congestion_days": 2.5,
  "weather_risk_index": 2.0,
  "cargo_demand_index": 108.0,
  "canal_transit": 0
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `model_name` | string | `"FreightAI-XGBoost-V4"` | `"FreightAI-XGBoost-V4"` or `"Random-Forest-Baseline-V2"` |
| `distance_nm` | float | 4120.0 | Nautical miles (50–25000) |
| `vessel_class` | string | `"LR3"` | Any supported vessel class |
| `commodity` | string | `"Clean Petroleum"` | Any supported commodity |
| `bunker_price` | float | 620.0 | VLSFO $/ton (200–1500) |
| `port_congestion_days` | float | 2.5 | 0–30 |
| `weather_risk_index` | float | 2.0 | 1.0–5.0 |
| `cargo_demand_index` | float | 108.0 | 50–200 |
| `canal_transit` | integer | 0 | 0, 1, or 2 |

**Response:**
```json
{
  "status": "success",
  "model_used": "FreightAI-XGBoost-V4",
  "is_real_ml": true,
  "predicted_rate_usd_t": 8.98,
  "lower_95_ci": 5.95,
  "upper_95_ci": 12.01,
  "rmse_applied": 1.544,
  "latency_ms": 6.61,
  "inputs": {
    "distance_nm": 4120.0,
    "vessel_class": "LR3",
    "vessel_dwt": 160000,
    "commodity": "Clean Petroleum",
    "bunker_price": 620.0,
    "port_congestion_days": 2.5,
    "weather_risk_index": 2.0,
    "cargo_demand_index": 108.0,
    "canal_transit": 0
  }
}
```

---

## GET /api/analytics

Returns bunker fuel price trends and port congestion index.

**Response:**
```json
{
  "summary": "Baltic Dry Index & Tanker Freight Analytics 2026",
  "fuel_bunker_trend": [
    { "month": "May 2026", "vlsfo": 590, "mgo": 780 },
    { "month": "Jun 2026", "vlsfo": 605, "mgo": 810 }
  ],
  "port_congestion_index": [
    { "port": "Singapore", "wait_hours": 36, "vessels_waiting": 42 },
    { "port": "Rotterdam", "wait_hours": 18, "vessels_waiting": 14 }
  ]
}
```

---

## GET /api/routes

Returns all pre-configured reference shipping routes.

**Response:**
```json
{
  "routes": [
    {
      "id": "R01",
      "origin": "Rotterdam [NL]",
      "origin_coords": [51.9244, 4.4777],
      "destination": "Lagos [NG]",
      "destination_coords": [6.4654, 3.4064],
      "vessel_class": "LR3",
      "distance_nm": 4120,
      "transit_time_days": 15.6,
      "base_rate": 25.74,
      "change_pct": 5.0,
      "commodity": "Clean Petroleum",
      "via": "Direct Atlantic",
      "canal_fee": 0
    }
  ]
}
```

---

## GET /api/search

Global search across vessels, ports, routes, and commodities.

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `q` | string | Search query string |

**Example:** `GET /api/search?q=rotterdam`

**Response:**
```json
{
  "query": "rotterdam",
  "results": {
    "vessels": [],
    "ports": [
      {
        "name": "Rotterdam",
        "code": "RTM",
        "country": "Netherlands",
        "coords": [51.9244, 4.4777]
      }
    ],
    "routes": [
      {
        "origin": "Rotterdam [NL]",
        "destination": "Lagos [NG]",
        "vessel_class": "LR3",
        "commodity": "Clean Petroleum",
        "distance_nm": 4120
      }
    ],
    "commodities": []
  }
}
```

---

## Error Responses

All endpoints return standard HTTP status codes:

| Code | Meaning | Example |
|---|---|---|
| `200 OK` | Success | — |
| `422 Unprocessable Entity` | Validation error (Pydantic) | Invalid request field |
| `404 Not Found` | Resource not found | Dataset not loaded |
| `500 Internal Server Error` | Backend exception | Model inference failure |

**Error Body (Pydantic 422):**
```json
{
  "detail": [
    {
      "loc": ["body", "vessel_class"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**Error Body (HTTPException):**
```json
{
  "detail": "Dataset not loaded"
}
```
