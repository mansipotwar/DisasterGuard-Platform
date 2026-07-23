"""Unified orchestrator-backed prediction route."""

from __future__ import annotations

from flask import Blueprint, request

from app.services.geocoding_service import get_location_details
from app.services.ml_service import predict_all_disasters
from app.services.weather_service import fetch_weather
from app.services.alert_service import create_high_risk_alert


def build_history_entry(**kwargs):
    """No-op compatibility shim when integration routes are unavailable."""
    return dict(kwargs)


def save_prediction_history(_entry):
    """No-op compatibility shim when integration routes are unavailable."""
    return None


prediction_bp = Blueprint("predictions", __name__, url_prefix="/predict")


def _parse_lat_lon(data: dict) -> tuple[float | None, float | None]:
    try:
        if "lat" in data and "lon" in data:
            return float(data.get("lat")), float(data.get("lon"))
    except (TypeError, ValueError):
        pass

    loc = data.get("location")
    if isinstance(loc, dict):
        try:
            return float(loc.get("lat")), float(loc.get("lon"))
        except (TypeError, ValueError):
            pass

    return None, None


@prediction_bp.post("")
def predict_unified():
    """
    Request:
    {
        "lat": 21.15,
        "lon": 79.09,
        "disaster": "... (optional)",
        "force_high_risk": true,   <-- DEMO ONLY
        "email": "test@gmail.com"  <-- for email test
    }
    """

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return {"error": "Request body must be valid JSON."}, 400

    lat, lon = _parse_lat_lon(data)
    if lat is None or lon is None:
        return {
            "error": "lat and lon are required numeric fields (flat or location.{lat,lon})."
        }, 422

    loc = {"lat": lat, "lon": lon}

    # 🔥 DEMO FLAGS
    force_high_risk = bool(data.get("force_high_risk", False))
    email = (data.get("email") or "").strip()

    try:
        weather = fetch_weather(lat, lon)

        w = {
            "temperature": float(weather["temperature"]),
            "humidity": float(weather["humidity"]),
            "rainfall": float(weather["rainfall"]),
            "wind_speed": float(weather["wind_speed"]),
            "pressure": float(weather["pressure"]),
        }

        print("FINAL FEATURES SENT TO MODEL:", w)

        # ✅ REAL ML PREDICTION
        result = predict_all_disasters(w, loc, user_id="demo_user")

        # 🔥 DEMO OVERRIDE (SAFE - DOES NOT CHANGE MODEL)
        if force_high_risk:
            print("⚠ DEMO MODE: FORCING HIGH RISK OUTPUT")
            for dtype in result:
                result[dtype]["risk_level"] = "HIGH"
                result[dtype]["probability"] = max(
                    float(result[dtype].get("probability", 0.0)),
                    0.85
                )

    except ValueError as exc:
        return {"error": str(exc)}, 400

    # 🌍 metadata
    source = str(weather.get("source", "")).lower()
    fallback_used = bool(weather.get("fallback")) or source in {"mock", "fallback_mock"}

    debug = {
        "api_used": source in {"openweathermap", "redis-cache"},
        "weather_data_present": all(
            k in weather and weather.get(k) is not None
            for k in ("temperature", "humidity", "rainfall", "wind_speed", "pressure")
        ),
        "fallback_used": fallback_used,
        "demo_force_high_risk": force_high_risk,
        "raw_weather": weather,
    }

    location = get_location_details(lat, lon)

    requested_disaster = str(
        data.get("disaster_type") or data.get("disaster") or ""
    ).strip().lower()

    selected_key = requested_disaster if requested_disaster in result else ""

    if not selected_key:
        selected_key = max(
            result.items(),
            key=lambda kv: float((kv[1] or {}).get("risk_score", 0.0))
        )[0]

    selected = result.get(selected_key, {})

    summary = {
        "disaster": selected_key,
        "probability": float(selected.get("probability", 0.0)),
        "risk_level": str(selected.get("risk_level", "LOW")).upper(),
        "timestamp": location.get("date"),
        "location": location.get("full_name", "Unknown Location"),
    }

    # 💾 history (optional)
    entry = build_history_entry(
        user_id="demo_user",
        location=location,
        disaster=summary["disaster"],
        probability=summary["probability"],
        risk_level=summary["risk_level"],
        predictions=result,
    )

    save_prediction_history(entry)

    # 🔥 EMAIL TRIGGER (ONLY IF EMAIL PROVIDED)
    if force_high_risk and email:
        create_high_risk_alert(
            user_id="demo_user",
            user_email=email,
            disaster_type=summary["disaster"],
            message=f"⚠ DEMO HIGH RISK: {summary['disaster']} detected at {summary['location']}"
        )

    return {
        "location": location,
        "predictions": result,
        "debug": debug,
        **summary
    }, 200