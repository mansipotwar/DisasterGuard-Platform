"""Safety recommendation endpoints."""

from __future__ import annotations

from flask import Blueprint, request

from app.services.safety_service import safety_for_disaster, safety_overview
from app.utils.helpers import json_error, json_ok

safety_bp = Blueprint("safety", __name__, url_prefix="/safety")


@safety_bp.get("/overview")
def get_safety_overview():
    return json_ok({"safety": safety_overview()})


@safety_bp.get("/<disaster_type>")
def get_safety_for_disaster(disaster_type: str):
    risk_level = request.args.get("risk_level")
    try:
        payload = safety_for_disaster(disaster_type, risk_level=risk_level)
    except ValueError as exc:
        return json_error(str(exc), status=404)
    return json_ok({"disaster": disaster_type.lower(), "safety": payload})
