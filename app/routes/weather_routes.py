"""Weather API routes."""

from __future__ import annotations

from flask import Blueprint, request

from app.services.weather_service import fetch_weather
from app.utils.helpers import json_error, json_ok

weather_bp = Blueprint("weather", __name__, url_prefix="/weather")


@weather_bp.get("")
def get_weather():
    """
    GET /weather?lat=..&lon=..

    Returns temperature, humidity, rainfall, wind_speed (+ metadata).
    """
    try:
        lat = float(request.args.get("lat", ""))
        lon = float(request.args.get("lon", ""))
    except (TypeError, ValueError):
        return json_error("Query parameters lat and lon are required numbers", status=422)

    data = fetch_weather(lat, lon)
    return json_ok({"weather": data})
