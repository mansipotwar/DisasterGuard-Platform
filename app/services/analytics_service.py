"""MongoDB analytics for prediction trends."""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from app.extensions import get_db
from app.utils.helpers import utc_now


def _history_collection():
    db = get_db()
    if "prediction_history" in db.list_collection_names():
        return db.prediction_history
    return db.predictions


def analytics_summary(user_id: str | None = None) -> dict[str, Any]:
    coll = _history_collection()
    now = utc_now()
    since_7d = now - timedelta(days=7)
    since_30d = now - timedelta(days=30)
    q7: dict[str, Any] = {"created_at": {"$gte": since_7d}}
    q30: dict[str, Any] = {"created_at": {"$gte": since_30d}}
    if user_id:
        q7["subject_key"] = f"user:{user_id}"
        q30["subject_key"] = f"user:{user_id}"

    last_7_days_count = coll.count_documents(q7)
    last_30_days_count = coll.count_documents(q30)

    freq_pipeline = [
        {"$match": q30},
        {"$group": {"_id": "$disaster_type", "count": {"$sum": 1}, "avg_risk": {"$avg": "$risk_score"}}},
        {"$sort": {"count": -1}},
    ]
    freq = list(coll.aggregate(freq_pipeline))
    highest = sorted(freq, key=lambda x: float(x.get("avg_risk") or 0.0), reverse=True)[:5]
    return {
        "last_7_days_predictions": int(last_7_days_count),
        "last_30_days_predictions": int(last_30_days_count),
        "disaster_frequency": [
            {"disaster": r.get("_id"), "count": int(r.get("count", 0))}
            for r in freq
        ],
        "highest_risk_disasters": [
            {
                "disaster": r.get("_id"),
                "avg_risk_score": round(float(r.get("avg_risk") or 0.0), 4),
            }
            for r in highest
        ],
    }


def analytics_trends(user_id: str | None = None, days: int = 30) -> dict[str, Any]:
    coll = _history_collection()
    now = utc_now()
    since = now - timedelta(days=max(1, min(days, 90)))
    q: dict[str, Any] = {"created_at": {"$gte": since}}
    if user_id:
        q["subject_key"] = f"user:{user_id}"
    pipeline = [
        {"$match": q},
        {
            "$group": {
                "_id": {
                    "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                    "disaster": "$disaster_type",
                },
                "count": {"$sum": 1},
                "avg_risk": {"$avg": "$risk_score"},
            }
        },
        {"$sort": {"_id.date": 1}},
    ]
    rows = list(coll.aggregate(pipeline))
    return {
        "days": days,
        "series": [
            {
                "date": r["_id"]["date"],
                "disaster": r["_id"]["disaster"],
                "count": int(r.get("count", 0)),
                "avg_risk_score": round(float(r.get("avg_risk") or 0.0), 4),
            }
            for r in rows
        ],
    }
