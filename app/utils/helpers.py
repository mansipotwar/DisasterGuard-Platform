"""Shared helper utilities."""

from datetime import datetime, timezone
from typing import Any


def utc_now() -> datetime:
    """Return timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


def json_error(message: str, code: str | None = None, status: int = 400) -> tuple[dict[str, Any], int]:
    """Build a consistent error JSON payload."""
    body: dict[str, Any] = {"success": False, "error": message}
    if code:
        body["code"] = code
    return body, status


def json_ok(data: dict[str, Any] | None = None, status: int = 200) -> tuple[dict[str, Any], int]:
    """Build a consistent success JSON payload."""
    payload: dict[str, Any] = {"success": True}
    if data:
        payload.update(data)
    return payload, status


DISASTER_TYPES = frozenset(
    {"flood", "earthquake", "hurricane", "wildfire", "landslide"}
)


def normalize_disaster_type(value: str) -> str | None:
    v = (value or "").strip().lower()
    return v if v in DISASTER_TYPES else None


def smart_suggestions(weather: dict[str, Any], predictions: dict[str, dict[str, Any]]) -> list[str]:
    """Generate short safety tips from weather + latest risk levels."""
    tips: list[str] = []
    try:
        rain = float(weather.get("rainfall", 0))
        temp = float(weather.get("temperature", 20))
        hum = float(weather.get("humidity", 50))
        wind = float(weather.get("wind_speed", 0))
    except (TypeError, ValueError):
        rain, temp, hum, wind = 0.0, 20.0, 50.0, 0.0

    if rain >= 5:
        tips.append("Carry umbrella")
        tips.append("Carry an umbrella or rain gear; roads may be slick.")
    if temp >= 32:
        tips.append("Avoid heat")
        tips.append("Avoid prolonged heat exposure; hydrate and seek shade.")
    if temp <= 3:
        tips.append("Dress warmly; watch for ice on walkways and roads.")
    if hum <= 30 and temp >= 26:
        tips.append("Dry air and heat increase dehydration risk; drink water regularly.")
    if wind >= 55:
        tips.append("Strong winds: secure loose objects and take care when driving.")

    high = [d for d, p in predictions.items() if (p or {}).get("risk_level") == "High"]
    medium = [d for d, p in predictions.items() if (p or {}).get("risk_level") == "Medium"]

    if high:
        tips.append("Stay safe")
        tips.append(f"Elevated hazard signals for: {', '.join(high)}. Prefer staying indoors and monitoring official alerts.")
    elif medium:
        tips.append("Stay safe")
        tips.append(f"Moderate risk for: {', '.join(medium)}. Stay aware and avoid unnecessary travel in exposed areas.")

    if not tips:
        tips.append("Stay safe")
        tips.append("Conditions look relatively calm; still keep emergency basics ready.")

    # de-dupe while preserving order
    seen: set[str] = set()
    ordered: list[str] = []
    for t in tips:
        if t not in seen:
            seen.add(t)
            ordered.append(t)
    return ordered
