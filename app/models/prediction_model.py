"""Prediction document shape and serialization for `predictions` collection."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from bson import ObjectId


def build_prediction_doc(
    user_id: str | None,
    subject_key: str,
    location: dict[str, float],
    disaster_type: str,
    risk_level: str,
    probability: float,
    risk_score: float,
    confidence_percent: float,
    factors: list[str],
    reasoning: str,
    created_at: datetime,
) -> dict[str, Any]:
    doc: dict[str, Any] = {
        "user_id": ObjectId(user_id) if user_id else None,
        "subject_key": subject_key,
        "location": location,
        "disaster_type": disaster_type,
        "risk_level": risk_level,
        "probability": probability,
        "risk_score": risk_score,
        "confidence_percent": confidence_percent,
        "factors": factors,
        "reasoning": reasoning,
        "created_at": created_at,
    }
    return doc


def serialize_prediction(doc: dict[str, Any]) -> dict[str, Any]:
    uid = doc.get("user_id")
    return {
        "id": str(doc["_id"]),
        "user_id": str(uid) if uid else None,
        "location": doc.get("location") or {},
        "disaster_type": doc.get("disaster_type"),
        "risk_level": doc.get("risk_level"),
        "probability": doc.get("probability"),
        "probability_percent": round(float(doc.get("probability", 0.0)) * 100.0, 2),
        "risk_score": doc.get("risk_score"),
        "risk_score_percent": round(float(doc.get("risk_score", 0.0)) * 100.0, 2),
        "confidence_percent": float(doc.get("confidence_percent", 0.0)),
        "factors": doc.get("factors") or [],
        "reasoning": doc.get("reasoning"),
        "created_at": doc.get("created_at"),
    }
