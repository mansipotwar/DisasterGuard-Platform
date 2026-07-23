"""Alert listing and email test routes."""

from __future__ import annotations

from flask import Blueprint, request

from app.services.alert_service import list_alerts_for_user
from app.services.email_service import send_email
from app.utils.helpers import json_error, json_ok
from app.utils.jwt_utils import decode_token, extract_bearer_token

alert_bp = Blueprint("alerts", __name__, url_prefix="/alerts")


def _require_user_id() -> str | None:
    token = extract_bearer_token(request.headers.get("Authorization"))
    if not token:
        return None
    claims = decode_token(token)
    if not claims or not claims.get("sub"):
        return None
    return str(claims["sub"])


@alert_bp.get("")
def list_alerts():
    """GET /alerts — requires authentication; returns alerts for the current user."""
    uid = _require_user_id()
    if not uid:
        return json_error("Authorization Bearer token required", status=401)

    try:
        limit = int(request.args.get("limit", "50"))
    except ValueError:
        limit = 50

    items = list_alerts_for_user(uid, limit=limit)
    return json_ok({"alerts": items, "count": len(items)})


@alert_bp.post("/test-email")
def test_email():
    """
    POST /alerts/test-email

    Body:
      { "to": "someone@example.com" }  (optional; defaults to current user's email)
    """
    uid = _require_user_id()
    if not uid:
        return json_error("Authorization Bearer token required", status=401)

    data = request.get_json(silent=True) or {}
    to_addr = (data.get("to") or "").strip()

    if not to_addr:
        from bson import ObjectId

        from app.extensions import get_db

        db = get_db()
        try:
            user = db.users.find_one({"_id": ObjectId(uid)})
        except Exception:  # noqa: BLE001
            user = None
        to_addr = (user or {}).get("email") or ""

    if not to_addr:
        return json_error('Provide "to" in JSON or ensure your profile has an email', status=422)

    ok = send_email(
        to_addr,
        subject="IntelliGuard SMTP test",
        body="This is a test email from IntelliGuard. SMTP configuration looks working.",
    )
    if not ok:
        return json_error("Email could not be sent (check server logs / SMTP credentials)", status=502)

    return json_ok({"sent": True, "to": to_addr})
