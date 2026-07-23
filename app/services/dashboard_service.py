"""Personalized dashboard service for logged-in users."""

from __future__ import annotations

from typing import Any

from app.services.prediction_service import list_recent_predictions_24h, predict_all_for_location


def dashboard_summary(user_id: str, user_email: str | None, location: dict[str, float]) -> dict[str, Any]:
    latest_bundle = predict_all_for_location(
        user_id=user_id,
        user_email=user_email,
        location=location,
        trigger_high_alert=False,
    )
    recent = list_recent_predictions_24h(user_id=user_id, location=location, limit=500)
    return {
        "user_id": user_id,
        "location": location,
        "auto_refresh_minutes": 10,
        "latest": latest_bundle.get("predictions", {}),
        "recent_24h": recent,
    }
