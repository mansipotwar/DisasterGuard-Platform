"""Analysis overview and per-disaster endpoints."""

from __future__ import annotations

from flask import Blueprint

from app.services.analysis_service import analysis_overview, disaster_analysis
from app.utils.helpers import json_error, json_ok

analysis_bp = Blueprint("analysis", __name__, url_prefix="/analysis")


@analysis_bp.get("/overview")
def get_overview():
    return json_ok({"analysis": analysis_overview()})


@analysis_bp.get("/<disaster_type>")
def get_disaster_analysis(disaster_type: str):
    try:
        payload = disaster_analysis(disaster_type)
    except ValueError as exc:
        return json_error(str(exc), status=404)
    return json_ok({"analysis": payload})
