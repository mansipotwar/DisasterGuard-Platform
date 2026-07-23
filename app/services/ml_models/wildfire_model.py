"""Wildfire risk mock model — swap rule block for `joblib.load` inference later."""

from __future__ import annotations

from typing import Any


def predict_wildfire(weather_data: dict[str, Any]) -> dict[str, Any]:
    """
    High risk if temperature > 38 AND humidity < 30.

    Future ML hook (keeps I/O stable):
        # import joblib
        # model = joblib.load(Path(__file__).with_name("wildfire_model.pkl"))
        # probability = float(model.predict_proba([[temperature, humidity]])[0, 1])
    """
    temperature = float(weather_data.get("temperature", 20))
    humidity = float(weather_data.get("humidity", 50))
    factors_used = ["temperature", "humidity"]

    if temperature > 38 and humidity < 30:
        probability = min(
            0.95,
            0.8 + (temperature - 38) / 80.0 + (30 - humidity) / 120.0,
        )
        risk_level = "High"
        reasoning = (
            f"Extreme heat ({temperature:.1f}°C) with very dry air ({humidity:.0f}%) "
            "strongly favors fuel ignition and rapid wildfire spread."
        )
    elif temperature > 32 or humidity < 40:
        probability = min(0.62, 0.28 + max(0, temperature - 24) / 90.0 + max(0, 45 - humidity) / 150.0)
        risk_level = "Medium"
        reasoning = (
            f"Warm conditions ({temperature:.1f}°C) and relatively low humidity ({humidity:.0f}%) "
            "increase fuel dryness; vigilance is warranted."
        )
    else:
        probability = min(0.35, 0.1 + max(0, temperature - 15) / 200.0)
        risk_level = "Low"
        reasoning = (
            f"Temperature ({temperature:.1f}°C) and humidity ({humidity:.0f}%) do not meet "
            "the high wildfire danger profile for this mock model."
        )

    return {
        "risk_level": risk_level,
        "probability": round(probability, 4),
        "reasoning": reasoning,
        "factors_used": factors_used,
    }
