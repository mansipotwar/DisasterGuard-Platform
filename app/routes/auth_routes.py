"""Authentication routes: register, login."""

from __future__ import annotations

from typing import Any

from bson import ObjectId
from flask import Blueprint, request

from app.extensions import get_db
from app.models.user_model import build_user_doc, hash_password, public_user, verify_password
from app.utils.helpers import json_error, json_ok, utc_now
from app.utils.jwt_utils import create_access_token, decode_token, extract_bearer_token

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


def _require_json() -> dict[str, Any] | None:
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return None
    return data


def _parse_location(raw: Any) -> dict[str, float] | None:
    if not isinstance(raw, dict):
        return None
    try:
        lat = float(raw.get("lat"))
        lon = float(raw.get("lon"))
        return {"lat": lat, "lon": lon}
    except (TypeError, ValueError):
        return None


@auth_bp.post("/register")
def register():
    data = _require_json()
    if not data:
        return json_error("Invalid JSON body", status=400)

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    location = _parse_location(data.get("location"))

    if not name or not email or not password:
        return json_error("name, email, and password are required", status=422)
    if location is None:
        return json_error("location with numeric lat and lon is required", status=422)

    db = get_db()
    if db.users.find_one({"email": email}):
        return json_error("Email already registered", code="duplicate_email", status=409)

    doc = build_user_doc(
        name=name,
        email=email,
        password_hash=hash_password(password),
        location=location,
        created_at=utc_now(),
    )
    res = db.users.insert_one(doc)
    created = db.users.find_one({"_id": res.inserted_id})
    assert created is not None

    token = create_access_token(str(created["_id"]), created["email"])
    return json_ok(
        {
            "token": token,
            "token_type": "Bearer",
            "user": public_user(created),
        },
        status=201,
    )


@auth_bp.post("/login")
def login():
    data = _require_json()
    if not data:
        return json_error("Invalid JSON body", status=400)

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not email or not password:
        return json_error("email and password are required", status=422)

    db = get_db()
    user = db.users.find_one({"email": email})
    if not user or not verify_password(user.get("password", ""), password):
        return json_error("Invalid credentials", code="auth_failed", status=401)

    token = create_access_token(str(user["_id"]), user["email"])
    return json_ok({"token": token, "token_type": "Bearer", "user": public_user(user)})


@auth_bp.get("/me")
def me():
    token = extract_bearer_token(request.headers.get("Authorization"))
    if not token:
        return json_error("Authorization Bearer token required", status=401)
    claims = decode_token(token)
    if not claims or not claims.get("sub"):
        return json_error("Invalid or expired token", status=401)

    db = get_db()
    try:
        user = db.users.find_one({"_id": ObjectId(str(claims["sub"]))})
    except Exception:  # noqa: BLE001
        user = None
    if not user:
        return json_error("User not found", status=404)

    return json_ok({"user": public_user(user)})
