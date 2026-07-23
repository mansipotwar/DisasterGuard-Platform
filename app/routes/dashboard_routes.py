"""Dashboard endpoints for authenticated users."""

from __future__ import annotations

from bson import ObjectId
from flask import Blueprint, request

from app.extensions import get_db
from app.services.dashboard_service import dashboard_summary
from app.utils.helpers import json_error, json_ok
from app.utils.jwt_utils import decode_token, extract_bearer_token

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")


@dashboard_bp.get("/summary")
def get_dashboard_summary():
    token = extract_bearer_token(request.headers.get("Authorization"))
    if not token:
        return json_error("Authorization Bearer token required", status=401)
    claims = decode_token(token)
    if not claims or not claims.get("sub"):
        return json_error("Invalid or expired token", status=401)

    uid = str(claims["sub"])
    db = get_db()
    try:
        user = db.users.find_one({"_id": ObjectId(uid)})
    except Exception:  # noqa: BLE001
        user = None
    if not user:
        return json_error("User not found", status=404)
    loc = user.get("location") or {}
    try:
        lat = float(loc.get("lat"))
        lon = float(loc.get("lon"))
    except (TypeError, ValueError):
        return json_error("Saved location missing for user", status=422)

    out = dashboard_summary(uid, user.get("email"), {"lat": lat, "lon": lon})
    return json_ok({"dashboard": out})
