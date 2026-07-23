"""Landslide risk mock model — replace with trained estimator via joblib when ready."""

from __future__ import annotations

from typing import Any


def predict_landslide(weather_data: dict[str, Any]) -> dict[str, Any]:
    """
    High risk if rainfall > 80 mm.

    Future:
        # import joblib
        # model = joblib.load(Path(__file__).with_name("landslide_model.pkl"))
        # probability = float(model.predict_proba([[rainfall]])[0, 1])
    """
    rainfall = float(weather_data.get("rainfall", 0))
    factors_used = ["rainfall"]

    if rainfall > 80:
        probability = min(0.95, 0.82 + (rainfall - 80) / 200.0)
        risk_level = "High"
        reasoning = (
            f"Intense rainfall ({rainfall:.1f} mm) exceeds the 80 mm high-risk threshold, "
            "raising pore-water pressure and slope failure potential."
        )
    elif rainfall > 50:
        probability = min(0.65, 0.35 + (rainfall - 50) / 120.0)
        risk_level = "Medium"
        reasoning = (
            f"Substantial rainfall ({rainfall:.1f} mm) can destabilize slopes, especially where "
            "vegetation or drainage is poor."
        )
    else:
        probability = min(0.34, 0.1 + rainfall / 180.0)
        risk_level = "Low"
        reasoning = (
            f"Rainfall ({rainfall:.1f} mm) is below the landslide-critical band in this mock model."
        )

    return {
        "risk_level": risk_level,
        "probability": round(probability, 4),
        "reasoning": reasoning,
        "factors_used": factors_used,
    }
