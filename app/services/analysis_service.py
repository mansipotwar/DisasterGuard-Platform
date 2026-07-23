"""Analysis data service for overview and per-disaster pages."""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from app.extensions import get_db
from app.utils.helpers import DISASTER_TYPES, utc_now


def _history_coll():
    db = get_db()
    return db.prediction_history if "prediction_history" in db.list_collection_names() else db.predictions


def analysis_overview() -> dict[str, Any]:
    coll = _history_coll()
    since_24h = utc_now() - timedelta(hours=24)
    q = {"created_at": {"$gte": since_24h}}
    total = coll.count_documents(q)
    dist = list(
        coll.aggregate(
            [
                {"$match": q},
                {"$group": {"_id": "$disaster_type", "count": {"$sum": 1}, "avg_risk": {"$avg": "$risk_score"}}},
                {"$sort": {"count": -1}},
            ]
        )
    )
    trend = list(
        coll.aggregate(
            [
                {"$match": q},
                {
                    "$group": {
                        "_id": {"$dateToString": {"format": "%Y-%m-%d %H:00", "date": "$created_at"}},
                        "count": {"$sum": 1},
                    }
                },
                {"$sort": {"_id": 1}},
            ]
        )
    )
    correlation_summary = [
        {
            "disaster": d.get("_id"),
            "risk_to_frequency_ratio": round(float(d.get("avg_risk") or 0.0) / max(1, int(d.get("count", 1))), 4),
        }
        for d in dist
    ]
    return {
        "system_risk_summary": {"total_predictions_24h": int(total)},
        "disaster_distribution": [
            {"disaster": d.get("_id"), "count": int(d.get("count", 0)), "avg_risk_score": round(float(d.get("avg_risk") or 0.0), 4)}
            for d in dist
        ],
        "trend_24h": [{"time_bucket": t.get("_id"), "count": int(t.get("count", 0))} for t in trend],
        "correlation_summary": correlation_summary,
    }


def disaster_analysis(disaster_type: str) -> dict[str, Any]:
    dtype = disaster_type.strip().lower()
    if dtype not in DISASTER_TYPES:
        raise ValueError("unsupported_disaster_type")
    coll = _history_coll()
    now = utc_now()

    def trend(hours: int) -> list[dict[str, Any]]:
        q = {"disaster_type": dtype, "created_at": {"$gte": now - timedelta(hours=hours)}}
        rows = list(
            coll.aggregate(
                [
                    {"$match": q},
                    {
                        "$group": {
                            "_id": {"$dateToString": {"format": "%Y-%m-%d %H:00", "date": "$created_at"}},
                            "count": {"$sum": 1},
                            "avg_risk": {"$avg": "$risk_score"},
                            "avg_probability": {"$avg": "$probability"},
                        }
                    },
                    {"$sort": {"_id": 1}},
                ]
            )
        )
        return [
            {
                "time_bucket": r.get("_id"),
                "count": int(r.get("count", 0)),
                "avg_risk_score": round(float(r.get("avg_risk") or 0.0), 4),
                "avg_probability": round(float(r.get("avg_probability") or 0.0), 4),
            }
            for r in rows
        ]

    samples_cur = coll.find({"disaster_type": dtype}).sort("created_at", -1).limit(10)
    sample_rows = []
    for s in samples_cur:
        sample_rows.append(
            {
                "created_at": s.get("created_at"),
                "probability": s.get("probability"),
                "risk_score": s.get("risk_score"),
                "confidence_percent": s.get("confidence_percent"),
                "location": s.get("location") or {"lat": s.get("lat"), "lon": s.get("lon")},
            }
        )

    # Generic model-facing factors for explainability layer without touching ML internals.
    feature_templates = {
        "flood": ["rainfall", "humidity", "river_discharge", "water_level", "elevation"],
        "earthquake": ["magnitude", "depth", "recent_seismic_activity", "event_count"],
        "wildfire": ["temperature", "humidity", "wind_speed", "satellite_confidence"],
        "hurricane": ["wind_speed", "pressure", "storm_band_intensity"],
        "landslide": ["rainfall", "slope", "elevation", "soil_saturation"],
    }
    features = feature_templates.get(dtype, [])
    importance = [{"feature": f, "importance": round(1.0 / max(1, len(features)), 3)} for f in features]
    correlations = [{"feature_pair": f"{f}~risk_score", "correlation": 0.0} for f in features]

    return {
        "disaster": dtype,
        "feature_importance": importance,
        "parameter_correlation": correlations,
        "sample_rows": sample_rows,
        "risk_trend": {
            "24h": trend(24),
            "7d": trend(24 * 7),
            "30d": trend(24 * 30),
        },
        "ml_feature_relationships": [{"feature": f, "relationship": "monitored"} for f in features],
    }
