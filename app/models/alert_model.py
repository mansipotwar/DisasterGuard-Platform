"""Alert document helpers for `alerts` collection."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId


def build_alert_doc(
    user_id: str | None,
    disaster_type: str,
    message: str,
    created_at: datetime,
) -> dict[str, Any]:
    """
    SAFE VERSION:
    - Supports real Mongo ObjectId users
    - Supports demo users like 'demo_user' without crashing
    """

    safe_user_id = None

    if user_id:
        try:
            safe_user_id = ObjectId(user_id)
        except (InvalidId, TypeError):
            # demo / guest / fake user fallback
            safe_user_id = None

    return {
        "user_id": safe_user_id,
        "disaster_type": disaster_type,
        "message": message,
        "created_at": created_at,
    }


def serialize_alert(doc: dict[str, Any]) -> dict[str, Any]:
    uid = doc.get("user_id")

    return {
        "id": str(doc["_id"]),
        "user_id": str(uid) if uid else None,
        "disaster_type": doc.get("disaster_type"),
        "message": doc.get("message"),
        "created_at": doc.get("created_at"),
    }