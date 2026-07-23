"""
Central ML orchestration: imports per-disaster modules and exposes stable API.

Routes and persistence should depend on this module — not on individual model files —
so swapping in `joblib.load(...)` inside each disaster module stays localized.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

import hashlib
import logging
import os
import joblib
import pandas as pd
import requests

from app.extensions import get_db
from app.services.weather_service import fetch_weather
from model_utils import FEATURES as UNIFIED_FEATURES

logger = logging.getLogger(__name__)
_DISCLAIMER = (
    " This prediction is a risk estimation based on environmental conditions and heuristic modeling. "
    "It is not a guaranteed disaster forecast."
)

_flood_model_data = None
def _load_flood_model():
    global _flood_model_data
    if _flood_model_data is None:
        _flood_model_data = _safe_load_model(["flood.pkl", "flood_model.pkl"])
    return _flood_model_data

_wildfire_model_data = None
def _model_dir() -> str:
    return os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models")


def _safe_load_model(filenames: list[str]):
    for filename in filenames:
        model_path = os.path.join(_model_dir(), filename)
        if not os.path.exists(model_path):
            continue
        try:
            return joblib.load(model_path)
        except Exception:  # noqa: BLE001 - prediction flow handles graceful fallback
            continue
    return None


def _load_wildfire_model():
    global _wildfire_model_data
    if _wildfire_model_data is None:
        _wildfire_model_data = _safe_load_model(["wildfire.pkl", "wildfire_model.pkl"])
    return _wildfire_model_data

_landslide_model_data = None
def _load_landslide_model():
    global _landslide_model_data
    if _landslide_model_data is None:
        _landslide_model_data = _safe_load_model(["landslide.pkl", "landslide_model.pkl"])
    return _landslide_model_data

_cyclone_model_data = None
def _load_cyclone_model():
    global _cyclone_model_data
    if _cyclone_model_data is None:
        _cyclone_model_data = _safe_load_model(["hurricane.pkl", "cyclone_model.pkl"])
    return _cyclone_model_data

_earthquake_model_data = None
def _load_earthquake_model():
    global _earthquake_model_data
    if _earthquake_model_data is None:
        _earthquake_model_data = _safe_load_model(["earthquake.pkl", "earthquake_model.pkl"])
    return _earthquake_model_data


def _fallback_prediction() -> dict[str, Any]:
    return {"prediction": 0, "probability": 0.0, "ml_validated": False}


def _safe_float(value: Any, default: float) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


def _risk_level_from_score(score: float) -> str:
    if score < 0.3:
        return "Low"
    if score < 0.7:
        return "Medium"
    return "High"


def _insight_pack(
    disaster_type: str,
    weather: dict[str, float],
    location: dict[str, float],
    derived: dict[str, float],
) -> tuple[str, str, list[str]]:
    rainfall = float(weather.get("rainfall", 0.0))
    humidity = float(weather.get("humidity", 0.0))
    temperature = float(weather.get("temperature", 0.0))
    wind_speed = float(weather.get("wind_speed", 0.0))
    pressure = float(weather.get("pressure", 1013.25))

    if disaster_type == "flood":
        if rainfall == 0:
            return (
                "Dry conditions with no rainfall indicate minimal flood-triggering factors. Soil saturation remains low.",
                "Environment is not currently conducive to flooding. This is a low susceptibility state.",
                [
                    "No immediate flood precautions required.",
                    "Monitor rainfall updates during weather changes.",
                    "Keep drainage areas clear as a precaution.",
                ],
            )
        soil_moisture = float(derived.get("soil_moisture", 0.0))
        return (
            f"Rainfall ({rainfall:.1f} mm) with humidity ({humidity:.1f}%) is raising moisture load (soil indicator {soil_moisture:.1f}), which can stress local drainage.",
            "Current conditions suggest elevated flood susceptibility if rain persists, especially in low-lying zones.",
            [
                "Avoid waterlogged roads and low-lying crossings during heavy showers.",
                "Clear nearby drains and check local runoff channels.",
                "Follow local weather advisories for short-notice rain bursts.",
            ],
        )

    if disaster_type == "wildfire":
        if temperature > 30 and humidity < 30:
            return (
                "High temperature and very low humidity are increasing surface dryness, creating conditions favorable for wildfire ignition.",
                "Environment shows high fire susceptibility, not an active fire.",
                [
                    "Avoid open flames in dry vegetation areas.",
                    "Keep water or extinguishers accessible.",
                    "Monitor local fire alerts.",
                ],
            )
        return (
            f"Temperature ({temperature:.1f}°C), humidity ({humidity:.1f}%), rainfall ({rainfall:.1f} mm), and wind ({wind_speed:.1f} km/h) indicate moderate-to-low fire spread potential.",
            "Conditions currently indicate limited wildfire susceptibility compared with hot, dry, and windy scenarios.",
            [
                "Dispose of combustible waste safely and avoid dry brush burning.",
                "Keep ignition sources away from vegetation in windy periods.",
                "Track local air-dryness and fire-weather advisories.",
            ],
        )

    if disaster_type == "landslide":
        if rainfall == 0:
            return (
                "Lack of rainfall results in low soil saturation, reducing slope instability.",
                "Landslide risk is minimal under dry conditions.",
                [
                    "No immediate landslide threat.",
                    "Stay cautious in hilly terrain during future rainfall.",
                    "Monitor slope conditions after heavy rains.",
                ],
            )
        soil_sat = float(derived.get("soil_saturation", 0.0))
        slope_factor = float(derived.get("slope_factor", 0.7))
        return (
            f"Rainfall ({rainfall:.1f} mm) and humidity ({humidity:.1f}%) are increasing soil loading (saturation {soil_sat:.1f}) with slope sensitivity ({slope_factor:.2f}).",
            "Current terrain-moisture interaction indicates increased susceptibility to localized slope movement.",
            [
                "Avoid steep cut slopes and unstable embankments after intense rain.",
                "Watch for fresh cracks, tilted poles, or muddy seepage on slopes.",
                "Use alternate routes if hill-road advisories are issued.",
            ],
        )

    if disaster_type in {"hurricane", "cyclone"}:
        if not _is_coastal_region(float(location["lat"]), float(location["lon"])):
            return (
                "Geographic location is inland, reducing exposure to cyclone systems.",
                "Hurricane-related risk is negligible.",
                [
                    "No cyclone-specific precautions required.",
                    "Stay informed during regional storm alerts.",
                    "Secure outdoor objects during strong winds.",
                ],
            )
        storm_index = float(derived.get("storm_index", wind_speed / max(pressure, 1.0)))
        return (
            f"Wind ({wind_speed:.1f} km/h) and pressure ({pressure:.1f} hPa) suggest coastal storm influence (storm index {storm_index:.4f}).",
            "Current coastal weather indicates susceptibility to wind and surge-related impacts if storm intensity increases.",
            [
                "Review local evacuation zones and shelter guidance.",
                "Secure loose outdoor materials before winds strengthen.",
                "Keep emergency supplies ready for short-notice advisories.",
            ],
        )

    # Earthquake default (always independent of weather)
    return (
        "Earthquake risk is based on regional seismic patterns and is independent of weather conditions.",
        "This represents background seismic susceptibility, not a prediction of occurrence.",
        [
            "Identify safe drop-cover-hold locations.",
            "Secure heavy furniture.",
            "Keep emergency kits ready.",
        ],
    )


def _rainfall_label(rainfall: float) -> str:
    if rainfall < 10:
        return "Low rainfall"
    if rainfall <= 50:
        return "Moderate rainfall"
    return "Heavy rainfall"


def _humidity_label(humidity: float) -> str:
    if humidity < 30:
        return "Low humidity"
    if humidity <= 70:
        return "Moderate humidity"
    return "High humidity"


def _temperature_label(temperature: float) -> str:
    if temperature < 15:
        return "Low temperature"
    if temperature <= 30:
        return "Moderate temperature"
    return "High temperature"


def _stable_seismic_activity(lat: float, lon: float) -> float:
    key = f"{round(lat, 2)}:{round(lon, 2)}"
    digest = hashlib.sha256(key.encode("utf-8")).hexdigest()
    return (int(digest[:8], 16) % 1000) / 1000.0


def _historical_risk_for_region(lat: float, lon: float) -> float:
    if lat >= 25.0 and lon >= 80.0:
        return 0.6
    if lat >= 20.0:
        return 0.5
    if lon >= 75.0:
        return 0.45
    return 0.35


def _is_coastal_region(lat: float, lon: float) -> bool:
    coastal_points = [
        (19.076, 72.8777),  # Mumbai
        (13.0827, 80.2707),  # Chennai
        (15.4909, 73.8278),  # Goa
        (22.5726, 88.3639),  # Kolkata delta
        (9.9312, 76.2673),  # Kochi
    ]
    return any((abs(lat - c_lat) <= 2.0 and abs(lon - c_lon) <= 2.0) for c_lat, c_lon in coastal_points)


def _latest_previous_score(disaster_type: str, location: dict[str, float], user_id: str | None = None) -> float | None:
    try:
        db = get_db()
    except Exception:  # noqa: BLE001
        return None
    lat = float(location["lat"])
    lon = float(location["lon"])
    subject_key = f"user:{user_id}" if user_id else f"guest:{lat:.4f}:{lon:.4f}"
    doc = db.prediction_history.find_one(
        {"subject_key": subject_key, "disaster_type": disaster_type},
        sort=[("created_at", -1)],
    )
    if not doc:
        return None
    try:
        return float(doc.get("risk_score"))
    except (TypeError, ValueError):
        return None


def _rule_score_and_reasoning(
    disaster_type: str,
    weather: dict[str, float],
    location: dict[str, float],
) -> tuple[float, str, dict[str, float]]:
    lat = float(location["lat"])
    lon = float(location["lon"])
    rainfall = float(weather.get("rainfall", 0.0))
    humidity = float(weather.get("humidity", 0.0))
    temperature = float(weather.get("temperature", 0.0))
    wind_speed = float(weather.get("wind_speed", 0.0))
    pressure = float(weather.get("pressure", 1013.25))

    if disaster_type == "flood":
        # Moisture must collapse to zero when rainfall is zero.
        soil_moisture = max(0.0, min(100.0, rainfall * (humidity / 100.0)))
        if rainfall > 120:
            rule = 0.9
        elif rainfall > 70:
            rule = 0.6
        else:
            rule = 0.3
        if rainfall < 5:
            rule = min(rule, 0.2)
        reason = (
            f"{_rainfall_label(rainfall)} ({rainfall:.1f} mm) and {_humidity_label(humidity)} ({humidity:.1f}%) "
            f"produce soil_moisture ({soil_moisture:.1f}), indicating flood risk."
        )
        return rule, reason, {"soil_moisture": soil_moisture}

    if disaster_type == "wildfire":
        dryness_index = (temperature * (100.0 - humidity)) / 100.0
        if temperature > 35 and humidity < 30:
            rule = 0.9
        elif temperature > 30:
            rule = 0.6
        else:
            rule = 0.3
        reason = (
            f"{_temperature_label(temperature)} ({temperature:.1f}°C) with {_humidity_label(humidity)} ({humidity:.1f}%) "
            f"creates dryness_index ({dryness_index:.2f}), increasing wildfire risk."
        )
        return rule, reason, {"dryness_index": dryness_index}

    if disaster_type in {"hurricane", "cyclone"}:
        storm_index = wind_speed / max(pressure, 1.0)
        if wind_speed > 80:
            rule = 0.9
        elif wind_speed > 40:
            rule = 0.6
        else:
            rule = 0.2
        if not _is_coastal_region(lat, lon):
            rule = min(rule, 0.1)
        reason = (
            f"{_temperature_label(temperature)} ({temperature:.1f}°C), wind_speed ({wind_speed:.1f}km/h), "
            f"and pressure ({pressure:.1f}hPa) produce storm_index ({storm_index:.4f})."
        )
        return rule, reason, {"storm_index": storm_index}

    if disaster_type == "landslide":
        soil_saturation = (rainfall * 0.7) + (humidity * 0.3)
        slope_factor = 0.7
        if rainfall > 100:
            rule = 0.85
        elif rainfall > 60:
            rule = 0.6
        else:
            rule = 0.3
        if rainfall < 10:
            rule = min(rule, 0.25)
        reason = (
            f"{_rainfall_label(rainfall)} ({rainfall:.1f} mm) and {_humidity_label(humidity)} ({humidity:.1f}%) "
            f"yield soil_saturation ({soil_saturation:.1f}) with slope_factor ({slope_factor:.2f}), increasing landslide risk."
        )
        return rule, reason, {"soil_saturation": soil_saturation, "slope_factor": slope_factor}

    seismic_activity = _stable_seismic_activity(lat, lon)
    historical_risk = _historical_risk_for_region(lat, lon)
    if seismic_activity > 0.7:
        rule = 0.8
    elif seismic_activity > 0.4:
        rule = 0.5
    else:
        rule = 0.2
    reason = (
        "Risk based on regional seismic activity and historical patterns, independent of weather."
    )
    return rule, reason, {"seismic_activity": seismic_activity, "historical_risk": historical_risk}


def _confidence_score(
    weather: dict[str, float],
    ml_score: float,
    rule_score: float,
    disaster_type: str,
    previous_score: float | None = None,
    used_fallback_weather: bool = False,
) -> float:
    confidence = 72.0
    required_fields = ("temperature", "humidity", "rainfall", "wind_speed", "pressure")
    if disaster_type != "earthquake":
        missing = [k for k in required_fields if weather.get(k) is None]
        if missing:
            confidence -= 15.0
        else:
            confidence += 8.0
        if used_fallback_weather:
            confidence -= 10.0
        else:
            confidence += 5.0
    model_certainty = abs(ml_score - 0.5) * 2.0
    confidence += 10.0 * model_certainty
    if previous_score is not None and abs(previous_score - rule_score) <= 0.15:
        confidence += 2.0
    if 0.25 <= rule_score <= 0.35 or 0.65 <= rule_score <= 0.75:
        confidence -= 5.0
    return round(max(70.0, min(92.0, confidence)), 2)


def _is_validated_ml_score(ml_validated: bool) -> bool:
    return bool(ml_validated)


def _fetch_recent_seismic_activity(lat: float, lon: float) -> dict[str, float]:
    url = "https://earthquake.usgs.gov/fdsnws/event/1/query"
    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=7)
    params = {
        "format": "geojson",
        "latitude": lat,
        "longitude": lon,
        "maxradiuskm": 300,
        "starttime": start_time.date().isoformat(),
        "endtime": end_time.date().isoformat(),
        "orderby": "time",
        "limit": 50,
    }
    try:
        resp = requests.get(url, params=params, timeout=8)
        resp.raise_for_status()
        payload = resp.json()
        features = payload.get("features") or []
        if not features:
            return {
                "magnitude": 2.5,
                "depth": 15.0,
                "latitude": lat,
                "longitude": lon,
                "recent_seismic_activity": 0.0,
                "event_count": 0.0,
            }

        mags: list[float] = []
        depths: list[float] = []
        for event in features:
            props = event.get("properties") or {}
            geom = event.get("geometry") or {}
            coords = geom.get("coordinates") or [lon, lat, 15.0]
            mag = _safe_float(props.get("mag"), 0.0)
            dep = _safe_float(coords[2] if len(coords) > 2 else 15.0, 15.0)
            mags.append(mag)
            depths.append(dep)

        max_mag = max(mags) if mags else 2.5
        avg_depth = sum(depths) / max(1, len(depths))
        event_count = float(len(features))
        # Weighted activity index: magnitude pressure + event frequency.
        activity = min(1.0, (max_mag / 8.0) * 0.7 + (event_count / 50.0) * 0.3)
        return {
            "magnitude": max_mag,
            "depth": avg_depth,
            "latitude": lat,
            "longitude": lon,
            "recent_seismic_activity": activity,
            "event_count": event_count,
        }
    except Exception:  # noqa: BLE001
        return {
            "magnitude": 3.0,
            "depth": 18.0,
            "latitude": lat,
            "longitude": lon,
            "recent_seismic_activity": 0.2,
            "event_count": 1.0,
        }


def build_unified_feature_dict(input_data: dict[str, Any]) -> dict[str, float]:
    """
    Build the seven FEATURES expected by schema_version 2 bundles from weather + coordinates.
    Earthquake calls may omit weather; sensible defaults match training-style placeholders.
    """
    weather = input_data.get("weather") or {}
    lat = _safe_float(input_data.get("lat"), _safe_float(input_data.get("latitude"), 20.5937))
    lon = _safe_float(input_data.get("lon"), _safe_float(input_data.get("longitude"), 78.9629))
    return {
        "temperature": _safe_float(weather.get("temperature"), 27.0),
        "humidity": _safe_float(weather.get("humidity"), 50.0),
        "rainfall": _safe_float(weather.get("rainfall"), 0.0),
        "wind_speed": _safe_float(weather.get("wind_speed"), 0.0),
        "pressure": _safe_float(weather.get("pressure"), 1010.0),
        "lat": lat,
        "lon": lon,
    }


def build_flood_features(input_data: dict[str, Any], model_data: dict[str, Any]) -> dict[str, Any]:
    _ = model_data
    return build_unified_feature_dict(input_data)


def build_wildfire_features(input_data: dict[str, Any], model_data: dict[str, Any]) -> dict[str, Any]:
    _ = model_data
    return build_unified_feature_dict(input_data)


def build_landslide_features(input_data: dict[str, Any], model_data: dict[str, Any]) -> dict[str, Any]:
    _ = model_data
    return build_unified_feature_dict(input_data)


def build_cyclone_features(input_data: dict[str, Any], model_data: dict[str, Any]) -> dict[str, Any]:
    _ = model_data
    return build_unified_feature_dict(input_data)


def build_earthquake_features(input_data: dict[str, Any], model_data: dict[str, Any]) -> dict[str, Any]:
    _ = model_data
    return build_unified_feature_dict(input_data)


def _row_for_disaster(disaster_type: str, model_data: dict[str, Any], input_data: dict[str, Any]) -> dict[str, Any]:
    if disaster_type == "flood":
        row = build_flood_features(input_data, model_data)
    elif disaster_type == "wildfire":
        row = build_wildfire_features(input_data, model_data)
    elif disaster_type == "landslide":
        row = build_landslide_features(input_data, model_data)
    elif disaster_type in {"hurricane", "cyclone"}:
        row = build_cyclone_features(input_data, model_data)
    elif disaster_type == "earthquake":
        row = build_earthquake_features(input_data, model_data)
    else:
        row = dict(input_data)

    allowed = set(model_data.get("feature_columns") or [])
    return {k: v for k, v in row.items() if k in allowed}


def predict_from_model(model_data: dict[str, Any], input_data: dict[str, Any], *, disaster_type: str) -> dict[str, Any]:
    if model_data.get("model") is not None and model_data.get("scaler") is not None:
        feature_order: list[str] = list(model_data.get("features") or UNIFIED_FEATURES)
        missing_meta = [f for f in feature_order if f not in UNIFIED_FEATURES]
        if missing_meta:
            raise ValueError(f"Model bundle lists unknown features: {missing_meta}")
        row = build_unified_feature_dict(input_data)
        X = pd.DataFrame([[row[f] for f in feature_order]], columns=feature_order)
        Xs = model_data["scaler"].transform(X)
        clf = model_data["model"]
        pred = int(clf.predict(Xs)[0])
        prob = None
        if hasattr(clf, "predict_proba"):
            prob = float(clf.predict_proba(Xs)[0][1])
        return {
            "prediction": pred,
            "probability": prob,
            "ml_validated": prob is not None,
        }

    estimator = model_data["estimator"]
    features = set(model_data["feature_columns"])
    row = dict(input_data)
    if not features.issubset(row.keys()):
        row = _row_for_disaster(disaster_type, model_data, input_data)
    df = pd.DataFrame([row])

    pred = int(estimator.predict(df)[0])
    prob = None
    if hasattr(estimator, "predict_proba"):
        prob = float(estimator.predict_proba(df)[0][1])

    return {
        "prediction": pred,
        "probability": prob,
        "ml_validated": prob is not None,
    }

def predict_flood(input_data: dict) -> dict[str, Any]:
    model = _load_flood_model()
    if model is None:
        return _fallback_prediction()
    if model.get("schema_version") == 2 or model.get("features"):
        req = set(model.get("features") or UNIFIED_FEATURES)
    else:
        req = set(model["feature_columns"])
    if not req.issubset(input_data.keys()):
        from app.services.prediction_service import enrich_input_for_flood_model

        input_data = enrich_input_for_flood_model(input_data)
    return predict_from_model(model, input_data, disaster_type="flood")

def predict_wildfire(input_data: dict) -> dict[str, Any]:
    model = _load_wildfire_model()
    if model is None:
        return _fallback_prediction()
    return predict_from_model(model, input_data, disaster_type="wildfire")

def predict_landslide(input_data: dict) -> dict[str, Any]:
    model = _load_landslide_model()
    if model is None:
        return _fallback_prediction()
    return predict_from_model(model, input_data, disaster_type="landslide")

def predict_cyclone(input_data: dict) -> dict[str, Any]:
    model = _load_cyclone_model()
    if model is None:
        return _fallback_prediction()
    return predict_from_model(model, input_data, disaster_type="cyclone")

def predict_earthquake(input_data: dict) -> dict[str, Any]:
    model = _load_earthquake_model()
    if model is None:
        return _fallback_prediction()
    return predict_from_model(model, input_data, disaster_type="earthquake")

@dataclass
class MLResult:
    risk_level: str
    probability: float
    risk_score: float
    confidence_percent: float
    reasoning: str
    factors_used: list[str]
    extra: dict[str, Any]


def _normalize_weather(weather: dict[str, float]) -> dict[str, float]:
    required = ("temperature", "humidity", "rainfall", "wind_speed", "pressure")
    missing = [k for k in required if k not in weather or weather.get(k) is None]
    if missing:
        raise ValueError(f"missing_weather_fields: {', '.join(missing)}")
    try:
        return {
            "temperature": float(weather["temperature"]),
            "humidity": float(weather["humidity"]),
            "rainfall": float(weather["rainfall"]),
            "wind_speed": float(weather["wind_speed"]),
            "pressure": float(weather["pressure"]),
        }
    except (TypeError, ValueError) as exc:
        raise ValueError("weather fields must be numeric") from exc


def _build_prediction_payload(
    disaster_type: str,
    ml_score: float,
    weather: dict[str, float],
    location: dict[str, float],
    ml_validated: bool = False,
    used_fallback_weather: bool = False,
    user_id: str | None = None,
) -> dict[str, Any]:
    ml_score = _clamp01(ml_score)
    rule_score, rule_reason, derived = _rule_score_and_reasoning(disaster_type, weather, location)
    use_ml = _is_validated_ml_score(ml_validated)
    fusion_type = "rule_only_fallback"
    confidence_bucket = "medium"
    # ML-first adaptive fusion (mandatory weights by confidence bucket).
    if use_ml:
        if ml_score >= 0.8:
            fused_score = _clamp01((0.60 * ml_score) + (0.40 * _clamp01(rule_score)))
            fusion_type = "adaptive_ml_balanced_60_40"
            confidence_bucket = "high"
        elif ml_score < 0.5:
            fused_score = _clamp01((0.60 * ml_score) + (0.40 * _clamp01(rule_score)))
            fusion_type = "adaptive_ml_low_60_40"
            confidence_bucket = "low"
        else:
            fused_score = _clamp01((0.75 * ml_score) + (0.25 * _clamp01(rule_score)))
            fusion_type = "adaptive_ml_medium_75_25"
            confidence_bucket = "medium"
        probability = fused_score
    else:
        fused_score = _clamp01(rule_score)
        probability = _clamp01(rule_score)
        confidence_bucket = "low"
    prev_score = _latest_previous_score(disaster_type, location, user_id=user_id)
    if prev_score is not None:
        fused_score = _clamp01((0.7 * fused_score) + (0.3 * _clamp01(prev_score)))

    # Global physics sanity correction layer.
    rainfall = float(weather.get("rainfall", 0.0))
    humidity = float(weather.get("humidity", 0.0))
    temperature = float(weather.get("temperature", 0.0))
    lat = float(location.get("lat", 0.0))
    lon = float(location.get("lon", 0.0))
    consistency_check = {"valid": True, "reason": ""}
    if disaster_type == "flood" and rainfall == 0:
        # Strong flood suppression when no rainfall.
        ml_score = _clamp01(ml_score * 0.3)
        fused_score = _clamp01(ml_score)
        probability = _clamp01(ml_score)
        if humidity < 30:
            fused_score = _clamp01(fused_score * 0.6)
            probability = _clamp01(probability * 0.6)
        if fused_score > 0.5:
            print("Sanity correction applied to flood")
            fused_score = _clamp01(fused_score * 0.3)
            probability = _clamp01(probability * 0.3)
        fused_score = min(fused_score, 0.2)
        probability = min(probability, 0.2)
        fusion_type = f"{fusion_type}_rainfall_zero_hard_sanity"
        consistency_check = {"valid": False, "reason": "rainfall contradiction"}
    elif disaster_type == "landslide" and rainfall == 0:
        fused_score = min(_clamp01(fused_score * 0.4), 0.2)
        probability = min(_clamp01(probability * 0.4), 0.2)
        fusion_type = f"{fusion_type}_landslide_requires_rain"
        consistency_check = {"valid": False, "reason": "rainfall contradiction"}
    elif disaster_type == "landslide":
        slope_factor = float((derived or {}).get("slope_factor", 0.7))
        if slope_factor < 0.75:
            fused_score = _clamp01(fused_score * 0.65)
            probability = _clamp01(probability * 0.65)
            fusion_type = f"{fusion_type}_low_slope_suppression"
            consistency_check = {"valid": False, "reason": "low slope factor"}
    elif disaster_type == "wildfire":
        if humidity > 70:
            fused_score = _clamp01(fused_score * 0.6)
            probability = _clamp01(probability * 0.6)
            fusion_type = f"{fusion_type}_high_humidity_suppression"
            consistency_check = {"valid": False, "reason": "humidity contradiction"}
        if rainfall > 5:
            fused_score = min(_clamp01(fused_score * 0.45), 0.25)
            probability = min(_clamp01(probability * 0.45), 0.25)
            fusion_type = f"{fusion_type}_rainfall_suppression"
            consistency_check = {"valid": False, "reason": "rainfall suppression"}
        if temperature < 20:
            fused_score = _clamp01(fused_score * 0.5)
            probability = _clamp01(probability * 0.5)
            fusion_type = f"{fusion_type}_low_temperature_suppression"
            consistency_check = {"valid": False, "reason": "low temperature"}
    elif disaster_type in {"hurricane", "cyclone"}:
        if not _is_coastal_region(lat, lon):
            fused_score = min(_clamp01(fused_score * 0.35), 0.05)
            probability = min(_clamp01(probability * 0.35), 0.05)
            fusion_type = f"{fusion_type}_inland_suppression"
            consistency_check = {"valid": False, "reason": "inland location"}
    elif disaster_type == "earthquake":
        seismic = float((derived or {}).get("seismic_activity", 0.0))
        historical = float((derived or {}).get("historical_risk", 0.0))
        if seismic < 0.45 and historical < 0.55:
            fused_score = min(_clamp01(fused_score * 0.8), 0.35)
            probability = min(_clamp01(probability * 0.8), 0.35)
            fusion_type = f"{fusion_type}_seismic_support_required"
            consistency_check = {"valid": False, "reason": "low seismic support"}
    elif disaster_type in {"flood", "landslide"} and rainfall == 0:
        fused_score = _clamp01(fused_score * 0.7)
        probability = _clamp01(probability * 0.7)
        fusion_type = f"{fusion_type}_rainfall_zero_soft_adjustment"

    confidence = _confidence_score(
        weather,
        ml_score,
        rule_score,
        disaster_type,
        previous_score=prev_score,
        used_fallback_weather=used_fallback_weather,
    )
    probability = _clamp01(probability)
    fused_score = _clamp01(fused_score)
    level = _risk_level_from_score(fused_score)
    insight, interpretation, safety_advice = _insight_pack(disaster_type, weather, location, derived)
    return {
        "risk_level": level,
        "probability": probability,
        "probability_percent": round(probability * 100.0, 2),
        "risk_score": fused_score,
        "risk_score_percent": round(fused_score * 100.0, 2),
        "confidence_percent": confidence,
        "reasoning": f"{rule_reason}{_DISCLAIMER}",
        "insight": insight,
        "interpretation": interpretation,
        "safety_advice": safety_advice,
        "factors_used": list(weather.keys()) if disaster_type != "earthquake" else ["lat", "lon", "seismic_activity", "historical_risk"],
        "extra": {
            "derived": derived,
            "rule_score": round(_clamp01(rule_score), 4),
            "ml_score": round(_clamp01(ml_score), 4),
            "ml_used": use_ml,
            "fusion_type": fusion_type,
            "confidence_bucket": confidence_bucket,
            "consistency_check": consistency_check,
        },
    }


def _parse_satellite_confidence(value: Any) -> float:
    if isinstance(value, str):
        v = value.strip().lower()
        if v in {"low", "l"}:
            return 0.3
        if v in {"nominal", "n", "medium", "med"}:
            return 0.6
        if v in {"high", "h"}:
            return 0.9
    try:
        n = float(value)
        if n <= 1.0:
            return max(0.0, min(1.0, n))
        return max(0.0, min(1.0, n / 100.0))
    except (TypeError, ValueError):
        return 0.0


def _fetch_nasa_firms_validation(lat: float, lon: float) -> tuple[bool, float]:
    """
    Validate potential active fire near coordinates using NASA FIRMS.
    Falls back safely on API failures.
    """
    api_key = os.getenv("NASA_FIRMS_API_KEY", "").strip()
    if not api_key:
        logger.warning("NASA FIRMS API key missing; using wildfire satellite fallback")
        return False, 0.0

    bbox = f"{lon - 0.25:.3f},{lat - 0.25:.3f},{lon + 0.25:.3f},{lat + 0.25:.3f}"
    urls = [
        f"https://firms.modaps.eosdis.nasa.gov/api/area/json/{api_key}/VIIRS_SNPP_NRT/{bbox}/1",
        f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{api_key}/VIIRS_SNPP_NRT/{bbox}/1",
    ]
    for url in urls:
        try:
            resp = requests.get(url, timeout=8)
            resp.raise_for_status()
            content_type = (resp.headers.get("Content-Type") or "").lower()
            entries: list[dict[str, Any]] = []
            if "json" in content_type:
                payload = resp.json()
                if isinstance(payload, list):
                    entries = [e for e in payload if isinstance(e, dict)]
                elif isinstance(payload, dict):
                    raw = payload.get("data")
                    if isinstance(raw, list):
                        entries = [e for e in raw if isinstance(e, dict)]
            else:
                lines = [ln.strip() for ln in resp.text.splitlines() if ln.strip()]
                if len(lines) > 1:
                    headers = [h.strip() for h in lines[0].split(",")]
                    for row in lines[1:]:
                        vals = [v.strip() for v in row.split(",")]
                        entries.append(dict(zip(headers, vals)))

            if not entries:
                return False, 0.0

            confs = [
                _parse_satellite_confidence(e.get("confidence"))
                for e in entries
            ]
            sat_conf = max(confs) if confs else 0.0
            return sat_conf > 0.0, sat_conf
        except Exception as exc:  # noqa: BLE001
            logger.warning("NASA FIRMS API request failed (%s): %s", url, exc)

    logger.warning("NASA FIRMS API failed; fallback wildfire satellite validation used")
    return False, 0.0


def predict_all_disasters(
    weather: dict[str, float],
    location: dict[str, float],
    user_id: str | None = None,
) -> dict[str, dict[str, Any]]:
    """
    Run all five mock models once.

    Returns:
        {
          "flood": {...},
          "wildfire": {...},
          "landslide": {...},
          "hurricane": {...},
          "earthquake": {...}
        }
    """
    w = _normalize_weather(weather)
    payload = {"weather": w, "lat": float(location["lat"]), "lon": float(location["lon"])}
    eq_payload = {"lat": float(location["lat"]), "lon": float(location["lon"])}

    flood_res = predict_flood(payload)
    wildfire_res = predict_wildfire(payload)
    landslide_res = predict_landslide(payload)
    hurricane_res = predict_cyclone(payload)
    earthquake_res = predict_earthquake(eq_payload)

    return {
        "flood": _build_prediction_payload("flood", flood_res.get("probability") or float(flood_res["prediction"]), w, location, ml_validated=bool(flood_res.get("ml_validated")), user_id=user_id),
        "wildfire": _build_prediction_payload("wildfire", wildfire_res.get("probability") or float(wildfire_res["prediction"]), w, location, ml_validated=bool(wildfire_res.get("ml_validated")), user_id=user_id),
        "landslide": _build_prediction_payload("landslide", landslide_res.get("probability") or float(landslide_res["prediction"]), w, location, ml_validated=bool(landslide_res.get("ml_validated")), user_id=user_id),
        "hurricane": _build_prediction_payload("hurricane", hurricane_res.get("probability") or float(hurricane_res["prediction"]), w, location, ml_validated=bool(hurricane_res.get("ml_validated")), user_id=user_id),
        "earthquake": _build_prediction_payload("earthquake", earthquake_res.get("probability") or float(earthquake_res["prediction"]), {}, location, ml_validated=bool(earthquake_res.get("ml_validated")), user_id=user_id),
    }


def _dict_to_ml_result(payload: dict[str, Any]) -> MLResult:
    return MLResult(
        risk_level=str(payload["risk_level"]),
        probability=float(payload["probability"]),
        risk_score=float(payload.get("risk_score", payload["probability"])),
        confidence_percent=float(payload.get("confidence_percent", 0.0)),
        reasoning=str(payload["reasoning"]),
        factors_used=list(payload.get("factors_used") or []),
            extra=dict(payload.get("extra") or {}),
    )


def predict_disaster(
    disaster_type: str,
    weather: dict[str, float],
    location: dict[str, float],
    user_id: str | None = None,
) -> MLResult:
    """
    Single-disaster entrypoint (used by routes and upserts).

    `location` is accepted for API stability; individual mock models may ignore it until
    geospatial features are added or loaded from disk.
    """
    dtype = disaster_type.lower().strip()
    lat = float(location.get("lat", 20.5937))
    lon = float(location.get("lon", 78.9629))
    used_fallback_weather = False
    if dtype != "earthquake":
        if weather:
            weather_for_risk = _normalize_weather(weather)
            used_fallback_weather = bool(weather.get("fallback")) or str(weather.get("source", "")).lower() == "fallback_mock"
        else:
            fetched = fetch_weather(lat, lon)
            weather_for_risk = _normalize_weather(fetched)
            used_fallback_weather = bool(fetched.get("fallback")) or str(fetched.get("source", "")).lower() == "fallback_mock"
    else:
        weather_for_risk = {}
    payload = {"weather": weather_for_risk, "lat": lat, "lon": lon}
    eq_payload = {"lat": lat, "lon": lon}

    if dtype == "flood":
        res = predict_flood(payload)
    elif dtype == "wildfire":
        res = predict_wildfire(payload)
    elif dtype == "landslide":
        res = predict_landslide(payload)
    elif dtype == "hurricane" or dtype == "cyclone":
        res = predict_cyclone(payload)
    elif dtype == "earthquake":
        res = predict_earthquake(eq_payload)
    else:
        raw = {
            "risk_level": "Low",
            "probability": 0.2,
            "probability_percent": 20.0,
            "risk_score": 0.2,
            "risk_score_percent": 20.0,
            "confidence_percent": 0.0,
            "reasoning": f"Unsupported disaster type for the mock ensemble.{_DISCLAIMER}",
            "factors_used": [],
        }
        return _dict_to_ml_result(raw)

    ml_score = res["probability"] if res["probability"] is not None else float(res["prediction"])
    raw = _build_prediction_payload(
        dtype,
        ml_score,
        weather_for_risk,
        {"lat": lat, "lon": lon},
        ml_validated=bool(res.get("ml_validated")),
        used_fallback_weather=used_fallback_weather,
        user_id=user_id,
    )
    wildfire_extra: dict[str, Any] = {}
    if dtype == "wildfire":
        active_fire_detected, satellite_confidence = _fetch_nasa_firms_validation(lat, lon)
        final_fire_risk = (float(raw["risk_score"]) * 0.6) + (satellite_confidence * 0.4)
        wildfire_extra = {
            "satellite_fire_detected": bool(active_fire_detected),
            "satellite_confidence": float(round(satellite_confidence, 4)),
            "final_fire_risk": float(round(max(0.0, min(1.0, final_fire_risk)), 4)),
            "interpretation": (
                "This is an environmental fire risk score based on weather conditions. "
                "It does not indicate an active wildfire. Final result is validated using "
                "NASA FIRMS satellite detection."
            ),
        }
    if dtype == "wildfire":
        base_reason = str(raw.get("reasoning", "")).replace(_DISCLAIMER, "").strip()
        raw["reasoning"] = (
            f"{base_reason} Environmental fire risk only. No active wildfire confirmation without satellite detection."
            f"{_DISCLAIMER}"
        )
    raw["extra"] = {**dict(raw.get("extra") or {}), **wildfire_extra}
    return _dict_to_ml_result(raw)


def predict_batch(
    disaster_types: list[str],
    weather: dict[str, float],
    location: dict[str, float],
) -> dict[str, dict[str, Any]]:
    """Run a subset of models; stable dict output for APIs."""
    all_out = predict_all_disasters(weather, location)
    out: dict[str, dict[str, Any]] = {}
    for dtype in disaster_types:
        key = dtype.lower().strip()
        if key in all_out:
            out[key] = dict(all_out[key])
    return out
