"""Hurricane / severe wind risk mock — joblib swap point reserved below rules."""

from __future__ import annotations

from typing import Any


def predict_hurricane(weather_data: dict[str, Any]) -> dict[str, Any]:
    """
    High risk if wind_speed > 100 km/h.

    Future:
        # import joblib
        # model = joblib.load(Path(__file__).with_name("hurricane_model.pkl"))
        # probability = float(model.predict_proba([[wind_speed]])[0, 1])
    """
    wind_speed = float(weather_data.get("wind_speed", 0))
    factors_used = ["wind_speed"]

    if wind_speed > 100:
        probability = min(0.95, 0.85 + (wind_speed - 100) / 250.0)
        risk_level = "High"
        reasoning = (
            f"Wind speed ({wind_speed:.1f} km/h) exceeds 100 km/h — structural and travel hazards "
            "associated with severe tropical / extratropical wind events increase sharply."
        )
    elif wind_speed > 70:
        probability = min(0.64, 0.38 + (wind_speed - 70) / 120.0)
        risk_level = "Medium"
        reasoning = (
            f"Elevated winds ({wind_speed:.1f} km/h) warrant caution for outdoor activity, "
            "driving, and loose debris."
        )
    else:
        probability = min(0.35, 0.12 + wind_speed / 220.0)
        risk_level = "Low"
        reasoning = (
            f"Wind speed ({wind_speed:.1f} km/h) is below the high-risk hurricane proxy threshold "
            "for this mock model."
        )

    return {
        "risk_level": risk_level,
        "probability": round(probability, 4),
        "reasoning": reasoning,
        "factors_used": factors_used,
    }
