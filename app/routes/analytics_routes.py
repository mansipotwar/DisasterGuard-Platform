"""Analytics endpoints for frontend charts."""

from __future__ import annotations

from flask import Blueprint, request

from app.services.analytics_service import analytics_summary, analytics_trends
from app.utils.helpers import json_error, json_ok
from app.utils.jwt_utils import decode_token, extract_bearer_token

analytics_bp = Blueprint("analytics", __name__, url_prefix="/analytics")


def _optional_user_id() -> str | None:
    token = extract_bearer_token(request.headers.get("Authorization"))
    if not token:
        return None
    claims = decode_token(token)
    if not claims:
        return None
    return str(claims.get("sub")) if claims.get("sub") else None


@analytics_bp.get("/summary")
def summary():
    uid = _optional_user_id()
    data = analytics_summary(uid)
    return json_ok({"summary": data})


@analytics_bp.get("/overview")
def overview():
    uid = _optional_user_id()
    data = analytics_summary(uid)
    return json_ok({"overview": data})


@analytics_bp.get("/trends")
def trends():
    uid = _optional_user_id()
    try:
        days = int(request.args.get("days", "30"))
    except ValueError:
        return json_error("days must be an integer", status=422)
    data = analytics_trends(uid, days=days)
    return json_ok({"trends": data})
