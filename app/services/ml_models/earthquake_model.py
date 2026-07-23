"""Earthquake mock: stochastic probability; swap for physics/stat models + joblib later."""

from __future__ import annotations

import random
from typing import Any


def predict_earthquake(weather_data: dict[str, Any]) -> dict[str, Any]:
    """
    Simulate probability with random draws; map risk bands from probability.

    Weather is ignored for this placeholder (real models would use seismic catalogs, faults, etc.).

    Future:
        # import joblib
        # features = extract_seismic_features(weather_data)  # or non-weather signals
        # model = joblib.load(Path(__file__).with_name("earthquake_model.pkl"))
        # probability = float(model.predict_proba([features])[0, 1])
    """
    _ = weather_data
    probability = random.random()
    if probability < 0.35:
        risk_level = "Low"
        reasoning = (
            f"Mock draw yielded low relative exposure (p={probability:.3f}); treat as baseline "
            "awareness — seismic risk still exists without weather correlation."
        )
    elif probability < 0.65:
        risk_level = "Medium"
        reasoning = (
            f"Mock draw indicates moderate notional exposure (p={probability:.3f}); review "
            "family plans and emergency supplies."
        )
    else:
        risk_level = "High"
        reasoning = (
            f"Mock draw placed notional risk in the upper band (p={probability:.3f}); use this "
            "only as a drill signal until real seismic models are wired in."
        )

    factors_used = ["simulated_probability"]

    return {
        "risk_level": risk_level,
        "probability": round(probability, 4),
        "reasoning": reasoning,
        "factors_used": factors_used,
    }
