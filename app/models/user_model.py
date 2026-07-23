"""User document helpers for MongoDB `users` collection."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from werkzeug.security import check_password_hash, generate_password_hash


def hash_password(plain: str) -> str:
    return generate_password_hash(plain)


def verify_password(hash_value: str, plain: str) -> bool:
    return check_password_hash(hash_value, plain)


def build_user_doc(
    name: str,
    email: str,
    password_hash: str,
    location: dict[str, float] | None,
    created_at: datetime,
) -> dict[str, Any]:
    return {
        "name": name.strip(),
        "email": email.strip().lower(),
        "password": password_hash,
        "location": location or {},
        "created_at": created_at,
    }


def public_user(doc: dict[str, Any]) -> dict[str, Any]:
    """Strip sensitive fields for API responses."""
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name"),
        "email": doc.get("email"),
        "location": doc.get("location") or {},
        "created_at": doc.get("created_at"),
    }
