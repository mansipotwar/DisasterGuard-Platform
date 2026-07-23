from flask import Blueprint, request

from app.services.news_service import fetch_latest_disaster_news
from app.utils.helpers import json_error, json_ok

news_bp = Blueprint("news", __name__, url_prefix="/news")


# -----------------------------
# DISASTER NEWS ENDPOINT
# -----------------------------
@news_bp.get("/latest")
def latest_news():
    try:
        disaster = (request.args.get("disaster") or "").strip().lower()

        if not disaster:
            return json_error(
                "disaster query parameter is required",
                status=422
            )

        # safe limit handling
        try:
            limit = int(request.args.get("limit", "5"))
        except ValueError:
            limit = 5

        limit = max(3, min(limit, 10))

        result = fetch_latest_disaster_news(
            disaster_type=disaster,
            max_records=limit
        )

        return json_ok({
            "success": True,
            "disaster": disaster,
            "count": len(result.get("news", [])),
            "news": result.get("news", [])
        })

    except Exception as e:
        return json_error(
            "Failed to fetch disaster news",
            status=500,
            details=str(e)
        )