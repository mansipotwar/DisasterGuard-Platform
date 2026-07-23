"""JWT creation and validation helpers."""

from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from flask import current_app


def _secret() -> str:
    return current_app.config["JWT_SECRET"]


def _expiry() -> timedelta:
    return current_app.config["JWT_EXPIRES"]


def create_access_token(user_id: str, email: str) -> str:
    """Encode a signed JWT for the given user."""
    now = datetime.now(timezone.utc)
    exp = now + _expiry()
    payload: dict[str, Any] = {
        "sub": user_id,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
        "type": "access",
    }
    return jwt.encode(payload, _secret(), algorithm="HS256")


def decode_token(token: str) -> dict[str, Any] | None:
    """Decode and validate JWT; return claims or None."""
    try:
        return jwt.decode(token, _secret(), algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def extract_bearer_token(auth_header: str | None) -> str | None:
    """Parse `Authorization: Bearer <token>` header value."""
    if not auth_header:
        return None
    parts = auth_header.split()
    if len(parts) == 2 and parts[0].lower() == "bearer" and parts[1]:
        return parts[1].strip()
    return None
