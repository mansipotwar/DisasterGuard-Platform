"""Prediction history endpoints."""

from __future__ import annotations

from flask import Blueprint, request

from app.services.prediction_service import list_prediction_history
from app.utils.helpers import json_error, json_ok
from app.utils.jwt_utils import decode_token, extract_bearer_token

history_bp = Blueprint("prediction_history", __name__, url_prefix="/predictions")


@history_bp.get("/history")
def get_prediction_history():
    token = extract_bearer_token(request.headers.get("Authorization"))
    if not token:
        return json_error("Authorization Bearer token required", status=401)
    claims = decode_token(token)
    if not claims or not claims.get("sub"):
        return json_error("Invalid or expired token", status=401)
    uid = str(claims["sub"])
    rk = (request.args.get("range") or "24h").strip().lower()
    try:
        items = list_prediction_history(user_id=uid, range_key=rk)
    except ValueError as exc:
        return json_error(str(exc), status=422)
    return json_ok({"range": rk, "predictions": items, "count": len(items)})
