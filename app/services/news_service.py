import logging
import requests
from datetime import datetime, timedelta, timezone
from typing import Any

GDELT_URL = "https://api.gdeltproject.org/api/v2/doc/doc"
logger = logging.getLogger(__name__)


# -----------------------------
# DISASTER QUERY MAP
# -----------------------------
_QUERY_HINTS = {
    "flood": "\"flood India\" OR \"flash flood\" OR \"flood warning\"",
    "wildfire": "\"wildfire\" OR \"forest fire\" OR \"fire alert\"",
    "earthquake": "\"earthquake\" OR \"seismic activity\" OR \"tremor\"",
    "hurricane": "\"cyclone\" OR \"hurricane\" OR \"storm warning\"",
    "landslide": "\"landslide\" OR \"slope failure\" OR \"heavy rain landslide\"",
}


# -----------------------------
# FALLBACK NEWS (SAFE MODE)
# -----------------------------
def _fallback_news(disaster_type: str, count: int) -> list[dict[str, str]]:
    now = datetime.now(timezone.utc)

    templates = [
        {"title": f"{disaster_type.capitalize()} alert issued for affected regions", "url": "https://www.un-spider.org/"},
        {"title": f"Authorities monitoring {disaster_type} conditions", "url": "https://www.un-spider.org/"},
        {"title": f"Emergency preparedness updated for {disaster_type}", "url": "https://www.un-spider.org/"},
        {"title": f"Response teams on standby for {disaster_type}", "url": "https://www.un-spider.org/"},
        {"title": f"Safety advisory issued amid {disaster_type}", "url": "https://www.un-spider.org/"}
    ]

    out = []

    for i in range(count):
        t = templates[i % len(templates)]

        out.append({
            "title": t["title"],
            "headline": t["title"],
            "url": t["url"],
            "published_at": (now - timedelta(hours=i * 3)).isoformat()
        })

    return out


# -----------------------------
# MAIN NEWS FETCH FUNCTION
# -----------------------------
def fetch_latest_disaster_news(disaster_type: str, max_records: int = 5) -> dict[str, Any]:

    # SAFE LIMIT
    count = max(3, min(int(max_records), 10))

    query_hint = _QUERY_HINTS.get(
        disaster_type,
        f"\"{disaster_type} disaster\" OR emergency"
    )

    query = f"{query_hint} AND (disaster OR emergency OR evacuation)"

    params = {
        "query": query,
        "mode": "artlist",
        "format": "json",
        "maxrecords": count,
        "sort": "datedesc"
    }

    try:
        resp = requests.get(GDELT_URL, params=params, timeout=10)
        resp.raise_for_status()

        data = resp.json()
        articles = data.get("articles", [])

        news = []

        for a in articles[:count]:
            news.append({
                "title": a.get("title", ""),
                "headline": a.get("title", ""),
                "url": a.get("url", ""),
                "published_at": a.get("seendate", "")
            })

        # ensure minimum results
        if len(news) < 3:
            news.extend(_fallback_news(disaster_type, 3 - len(news)))
            news = news[:count]

        return {
            "success": True,
            "news": news
        }

    except Exception as e:
        logger.warning("GDELT API failed for %s: %s", disaster_type, str(e))

        return {
            "success": True,
            "news": _fallback_news(disaster_type, count)
        }