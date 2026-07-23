"""Prediction persistence with per-user per-disaster upsert + HIGH alerts."""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from app.extensions import get_db
from app.models.prediction_model import build_prediction_doc, serialize_prediction
from app.services.alert_service import create_high_risk_alert
from app.services.ml_service import MLResult, predict_all_disasters, predict_disaster
from app.services.weather_service import fetch_weather
from app.utils.helpers import DISASTER_TYPES, normalize_disaster_type, utc_now

# Default map coordinates when none supplied (non-zero; not used for 0.0 placeholders).
_DEFAULT_LAT = 20.5937
_DEFAULT_LON = 78.9629


def _parse_lat_lon(data: dict[str, Any]) -> tuple[float | None, float | None]:
    loc = data.get("location")
    if isinstance(loc, dict):
        try:
            return float(loc["lat"]), float(loc["lon"])
        except (KeyError, TypeError, ValueError):
            pass
    try:
        if "lat" in data and "lon" in data:
            return float(data["lat"]), float(data["lon"])
    except (TypeError, ValueError):
        pass
    try:
        if "latitude" in data and "longitude" in data:
            return float(data["latitude"]), float(data["longitude"])
    except (TypeError, ValueError):
        pass
    return None, None


def _coerce_float(val: Any, *, fallback: float) -> float:
    try:
        if val is None:
            return fallback
        return float(val)
    except (TypeError, ValueError):
        return fallback


def enrich_input_for_flood_model(input_data: dict[str, Any]) -> dict[str, Any]:
    """
    Build a single-row dict matching the trained flood bundle (unified FEATURES schema).

    Weather is taken from Open-Meteo when lat/lon are available; otherwise from
    `input_data` with safe numeric fallbacks.
    """
    from app.services.ml_service import build_unified_feature_dict

    lat, lon = _parse_lat_lon(input_data)
    if lat is not None and lon is not None:
        weather = fetch_weather(lat, lon)
        payload = {
            "weather": {
                "temperature": weather.get("temperature"),
                "humidity": weather.get("humidity"),
                "rainfall": weather.get("rainfall"),
                "wind_speed": weather.get("wind_speed"),
                "pressure": weather.get("pressure"),
            },
            "lat": _coerce_float(weather.get("lat"), fallback=lat),
            "lon": _coerce_float(weather.get("lon"), fallback=lon),
        }
    else:
        payload = {
            "weather": {
                "temperature": input_data.get("temperature"),
                "humidity": input_data.get("humidity"),
                "rainfall": input_data.get("rainfall"),
                "wind_speed": input_data.get("wind_speed"),
                "pressure": input_data.get("pressure"),
            },
            "lat": _DEFAULT_LAT,
            "lon": _DEFAULT_LON,
        }
    return build_unified_feature_dict(payload)


def _subject_key(user_id: str | None, location: dict[str, float]) -> str:
    """Stable key for upsert: authenticated user vs guest (rounded coordinates)."""
    if user_id:
        return f"user:{user_id}"
    lat = float(location["lat"])
    lon = float(location["lon"])
    return f"guest:{lat:.4f}:{lon:.4f}"


def upsert_prediction(
    *,
    user_id: str | None,
    user_email: str | None,
    location: dict[str, float],
    disaster_type: str,
    weather: dict[str, float],
    trigger_high_alert: bool = True,
    ml_output: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Compute ML mock prediction and upsert one document per (user_id, disaster_type).

    Guest predictions use user_id=None; filter uses user_id key explicitly.

    When `ml_output` is provided (e.g. batch run), skip re-invoking the model for this disaster.
    """
    dtype = normalize_disaster_type(disaster_type)
    if not dtype:
        raise ValueError("invalid_disaster_type")

    if ml_output is not None:
        ml = MLResult(
            risk_level=str(ml_output["risk_level"]),
            probability=float(ml_output["probability"]),
            risk_score=float(ml_output.get("risk_score", ml_output["probability"])),
            confidence_percent=float(ml_output.get("confidence_percent", 0.0)),
            reasoning=str(ml_output["reasoning"]),
            factors_used=list(ml_output.get("factors_used") or []),
            extra=dict(ml_output.get("extra") or {}),
        )
    else:
        ml = predict_disaster(dtype, weather, location, user_id=user_id)
    created_at = utc_now()
    sk = _subject_key(user_id, location)
    doc = build_prediction_doc(
        user_id=user_id,
        subject_key=sk,
        location=location,
        disaster_type=dtype,
        risk_level=ml.risk_level,
        probability=ml.probability,
        risk_score=ml.risk_score,
        confidence_percent=ml.confidence_percent,
        factors=list(ml.factors_used),
        reasoning=ml.reasoning,
        created_at=created_at,
    )

    db = get_db()
    if user_id:
        try:
            ObjectId(user_id)
        except InvalidId as exc:
            raise ValueError("invalid_user_id") from exc

    db.predictions.update_one(
        {"subject_key": sk, "disaster_type": dtype},
        {"$set": doc},
        upsert=True,
    )
    history_doc = dict(doc)
    history_doc["lat"] = float(location["lat"])
    history_doc["lon"] = float(location["lon"])
    db.prediction_history.insert_one(history_doc)
    stored = db.predictions.find_one({"subject_key": sk, "disaster_type": dtype})
    assert stored is not None
    serialized = serialize_prediction(stored)

    if trigger_high_alert and ml.risk_level == "High" and user_id:
        msg = (
            f"HIGH {dtype} risk detected (p={ml.probability}). {ml.reasoning} "
            f"Location: lat={location.get('lat')}, lon={location.get('lon')}."
        )
        create_high_risk_alert(user_id, user_email, dtype, msg)

    return serialized


def predict_all_for_location(
    *,
    user_id: str | None,
    user_email: str | None,
    location: dict[str, float],
    trigger_high_alert: bool = True,
) -> dict[str, Any]:
    lat, lon = float(location["lat"]), float(location["lon"])
    weather = fetch_weather(lat, lon)
    w = {
        "temperature": float(weather["temperature"]),
        "humidity": float(weather["humidity"]),
        "rainfall": float(weather["rainfall"]),
        "wind_speed": float(weather["wind_speed"]),
        "pressure": float(weather["pressure"]),
    }
    disasters = predict_all_disasters(w, location, user_id=user_id)
    predictions: dict[str, dict[str, Any]] = {}
    for dtype in sorted(DISASTER_TYPES):
        predictions[dtype] = upsert_prediction(
            user_id=user_id,
            user_email=user_email,
            location=location,
            disaster_type=dtype,
            weather=w,
            trigger_high_alert=trigger_high_alert,
            ml_output=disasters[dtype],
        )
    recent = list_recent_predictions_24h(user_id=user_id, location=location)
    return {"weather": weather, "disasters": disasters, "predictions": predictions, "recent_predictions_24h": recent}


def list_recent_predictions_24h(
    *,
    user_id: str | None,
    location: dict[str, float] | None,
    limit: int = 500,
) -> list[dict[str, Any]]:
    db = get_db()
    since = utc_now() - timedelta(hours=24)
    q: dict[str, Any] = {"created_at": {"$gte": since}}
    if user_id:
        q["subject_key"] = f"user:{user_id}"
    elif location:
        q["subject_key"] = _subject_key(None, location)
    else:
        return []

    cursor = db.prediction_history.find(q).sort("created_at", -1).limit(max(1, min(limit, 1000)))
    return [serialize_prediction(d) for d in cursor]


def list_prediction_history(
    *,
    user_id: str,
    range_key: str = "24h",
    limit: int = 1000,
) -> list[dict[str, Any]]:
    db = get_db()
    rk = (range_key or "24h").strip().lower()
    hours_map = {"24h": 24, "7d": 24 * 7, "30d": 24 * 30}
    if rk not in hours_map:
        raise ValueError("range must be one of: 24h, 7d, 30d")
    since = utc_now() - timedelta(hours=hours_map[rk])
    q = {"subject_key": f"user:{user_id}", "created_at": {"$gte": since}}
    cursor = db.prediction_history.find(q).sort("created_at", -1).limit(max(1, min(limit, 5000)))
    return [serialize_prediction(d) for d in cursor]


def refresh_predictions_for_all_users() -> dict[str, int]:
    db = get_db()
    refreshed = 0
    skipped = 0
    errors = 0
    for user in db.users.find({}):
        loc = user.get("location") or {}
        try:
            lat = float(loc.get("lat"))
            lon = float(loc.get("lon"))
        except (TypeError, ValueError):
            skipped += 1
            continue
        uid = str(user.get("_id"))
        email = (user.get("email") or "").strip() or None
        try:
            predict_all_for_location(
                user_id=uid,
                user_email=email,
                location={"lat": lat, "lon": lon},
                trigger_high_alert=False,
            )
            refreshed += 1
        except Exception:  # noqa: BLE001
            errors += 1
    return {"refreshed": refreshed, "skipped": skipped, "errors": errors}


def get_latest_prediction(
    user_id: str | None,
    disaster_type: str,
    location: dict[str, float] | None = None,
) -> dict[str, Any] | None:
    dtype = normalize_disaster_type(disaster_type)
    if not dtype:
        return None
    db = get_db()
    if user_id:
        try:
            ObjectId(user_id)
        except InvalidId:
            return None
    if not user_id and not location:
        return None
    if not location and user_id:
        # allow lookup by user without re-sending location
        doc = db.predictions.find_one({"subject_key": f"user:{user_id}", "disaster_type": dtype})
        return serialize_prediction(doc) if doc else None
    if not location:
        return None
    sk = _subject_key(user_id, location)
    doc = db.predictions.find_one({"subject_key": sk, "disaster_type": dtype})
    return serialize_prediction(doc) if doc else None
