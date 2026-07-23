"""Flood risk mock model — replace internals with `joblib.load` when a trained model exists."""

from __future__ import annotations

from typing import Any


def predict_flood(weather_data: dict[str, Any]) -> dict[str, Any]:
    """
    Rule-based flood mock.

    High risk if rainfall > 70 AND humidity > 80.

    Future: load a sklearn pipeline without changing this function's name or return shape, e.g.:
        # import joblib
        # model = joblib.load(Path(__file__).with_name("flood_model.pkl"))
        # probability = float(model.predict_proba([[rainfall, humidity]])[0, 1])
    """
    rainfall = float(weather_data.get("rainfall", 0))
    humidity = float(weather_data.get("humidity", 0))
    factors_used = ["rainfall", "humidity"]

    if rainfall > 70 and humidity > 80:
        probability = min(
            0.95,
            0.78 + (rainfall - 70) / 150.0 + (humidity - 80) / 200.0,
        )
        risk_level = "High"
        reasoning = (
            f"Heavy rainfall ({rainfall:.1f} mm) with very high humidity ({humidity:.0f}%) "
            "saturates soil and drainage — flash or riverine flooding risk is elevated."
        )
    elif rainfall > 50 or humidity > 75:
        probability = min(0.64, 0.32 + rainfall / 200.0 + humidity / 400.0)
        risk_level = "Medium"
        reasoning = (
            f"Moderate rainfall ({rainfall:.1f} mm) and humidity ({humidity:.0f}%) "
            "support rising water levels; monitor low-lying areas."
        )
    else:
        probability = min(0.34, 0.08 + rainfall / 250.0 + humidity / 500.0)
        risk_level = "Low"
        reasoning = (
            f"Rainfall ({rainfall:.1f} mm) and humidity ({humidity:.0f}%) are below critical "
            "combined thresholds for widespread flooding."
        )

    return {
        "risk_level": risk_level,
        "probability": round(probability, 4),
        "reasoning": reasoning,
        "factors_used": factors_used,
    }
