"""Alert persistence, notification orchestration, and scheduled digest."""

from __future__ import annotations

import logging
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from app.extensions import get_db
from app.models.alert_model import build_alert_doc, serialize_alert
from app.services.email_service import send_email
from app.utils.helpers import smart_suggestions, utc_now

logger = logging.getLogger(__name__)


def create_high_risk_alert(
    user_id: str | None,
    user_email: str | None,
    disaster_type: str,
    message: str,
) -> dict[str, Any] | None:
    """Store HIGH risk alert and email the user when possible."""
    db = get_db()
    doc = build_alert_doc(user_id, disaster_type, message, utc_now())
    res = db.alerts.insert_one(doc)
    created = db.alerts.find_one({"_id": res.inserted_id})
    if user_email:
        send_email(
            user_email,
            subject=f"IntelliGuard HIGH risk: {disaster_type}",
            body=message,
        )
    return serialize_alert(created) if created else None


def list_alerts_for_user(user_id: str, limit: int = 50) -> list[dict[str, Any]]:
    db = get_db()
    try:
        oid = ObjectId(user_id)
    except InvalidId:
        return []
    cursor = (
        db.alerts.find({"user_id": oid}).sort("created_at", -1).limit(max(1, min(limit, 200)))
    )
    return [serialize_alert(d) for d in cursor]


def list_all_alerts(limit: int = 100) -> list[dict[str, Any]]:
    """Admin-style listing (used by scheduler logs / optional future auth)."""
    db = get_db()
    cursor = db.alerts.find({}).sort("created_at", -1).limit(max(1, min(limit, 500)))
    return [serialize_alert(d) for d in cursor]


def run_daily_digest_for_all_users() -> dict[str, Any]:
    """
    Scheduled job: refresh predictions and email each user a daily brief.

    HIGH-risk instant emails are suppressed here to avoid duplicate notifications;
    the digest still includes the computed risk levels.
    """
    from app.services.prediction_service import predict_all_for_location

    db = get_db()
    sent = 0
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

        email = (user.get("email") or "").strip()
        if not email:
            skipped += 1
            continue

        uid = str(user["_id"])
        name = user.get("name") or "there"

        try:
            bundle = predict_all_for_location(
                user_id=uid,
                user_email=email,
                location={"lat": lat, "lon": lon},
                trigger_high_alert=False,
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("Daily digest prediction failed for %s: %s", uid, exc)
            errors += 1
            continue

        weather = bundle.get("weather") or {}
        preds = bundle.get("predictions") or {}
        tips = smart_suggestions(weather, preds)

        lines = [
            f"Good morning {name},",
            "",
            "Here is your IntelliGuard daily brief.",
            "",
            "Weather summary:",
            f"- Temperature: {weather.get('temperature')} °C",
            f"- Humidity: {weather.get('humidity')} %",
            f"- Rainfall: {weather.get('rainfall')} mm",
            f"- Wind speed: {weather.get('wind_speed')} km/h",
            f"- Source: {weather.get('source', 'n/a')}",
            "",
            "Disaster risk snapshot:",
        ]
        for dtype, p in preds.items():
            lines.append(
                f"- {dtype}: {p.get('risk_level')} (p={p.get('probability')}) — {p.get('reasoning')}"
            )
        lines += ["", "Smart suggestions:"]
        for tip in tips:
            lines.append(f"- {tip}")

        body = "\n".join(lines)
        ok = send_email(email, subject="IntelliGuard Daily Safety Brief", body=body)
        if ok:
            sent += 1
        else:
            skipped += 1

    return {"sent": sent, "skipped": skipped, "errors": errors}
