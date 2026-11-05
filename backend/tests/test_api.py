import sys
import os
sys.path.insert(0, os.path.abspath("."))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "ml_model_loaded" in data
    print("Health check test passed!")

def test_dashboard():
    res = client.get("/api/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "kpis" in data
    assert "active_vessels" in data["kpis"]
    assert "alerts" in data
    assert "vessel_map_markers" in data
    assert len(data["alerts"]) >= 3
    print("Dashboard endpoint test passed!")

def test_forecast():
    payload = {
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
    res = client.post("/api/forecast", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "predicted_freight_rate" in data
    assert "predicted_range" in data
    assert "time_series" in data
    assert len(data["time_series"]) > 0
    assert "influencing_factors" in data
    print(f"Forecast test passed: Predicted rate=${data['predicted_freight_rate']}/t, Model={data['model_used']}")

def test_vessels_and_chartering():
    res = client.get("/api/vessels")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] >= 5
    
    charter_payload = {
        "origin_port": "Rotterdam [NL]",
        "destination_port": "Lagos [NG]",
        "cargo_quantity_mts": 150000,
        "commodity": "Clean Petroleum",
        "laycan_start": "2026-11-01",
        "laycan_end": "2026-11-05",
        "priority": "cost"
    }
    charter_res = client.post("/api/chartering-decision", json=charter_payload)
    assert charter_res.status_code == 200
    c_data = charter_res.json()
    assert "recommended_vessel" in c_data
    assert "ranked_vessels" in c_data
    assert "executive_rationale" in c_data
    print(f"Chartering decision test passed: Top Vessel={c_data['recommended_vessel']['vessel']['name']}")

def test_procurement():
    res = client.get("/api/procurement/scenarios")
    assert res.status_code == 200
    data = res.json()
    assert "procurement_cards" in data
    assert "orders_table" in data
    assert "timeline_schedules" in data
    print("Procurement scenarios test passed!")

def test_models():
    res = client.get("/api/models")
    assert res.status_code == 200
    data = res.json()
    assert "model_metadata" in data
    print("Model insights registry test passed!")

if __name__ == "__main__":
    test_health()
    test_dashboard()
    test_forecast()
    test_vessels_and_chartering()
    test_procurement()
    test_models()
    print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY! (6/6)")
