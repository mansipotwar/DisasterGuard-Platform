"""Weather retrieval via OpenWeatherMap with fail-safe fallback."""

from __future__ import annotations

import logging
import json
import os
from typing import Any

import requests
import redis

logger = logging.getLogger(__name__)
_redis_client: redis.Redis | None = None


def _get_redis_client() -> redis.Redis | None:
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    try:
        _redis_client = redis.from_url(redis_url, decode_responses=True, socket_connect_timeout=2)
        _redis_client.ping()
        return _redis_client
    except Exception as exc:  # noqa: BLE001
        logger.warning("Redis unavailable for weather cache: %s", exc)
        _redis_client = None
        return None


def _cache_key(lat: float, lon: float) -> str:
    return f"weather:{lat:.4f}:{lon:.4f}"


def _mock_weather(lat: float, lon: float) -> dict[str, Any]:
    """Deterministic-ish mock from coordinates for demos without network."""
    seed = abs(int((lat * 97 + lon * 131) * 1000)) % 10000
    temperature = 18.0 + (seed % 180) / 10.0
    humidity = 35.0 + (seed % 450) / 10.0
    rainfall = float((seed % 80) / 10.0)
    wind_speed = 5.0 + (seed % 350) / 10.0
    return {
        "temperature": round(temperature, 2),
        "humidity": round(humidity, 2),
        "rainfall": round(rainfall, 2),
        "wind_speed": round(wind_speed, 2),
        "source": "mock",
        "lat": lat,
        "lon": lon,
    }


def fetch_weather(lat: float, lon: float) -> dict[str, Any]:
    """
    Fetch current weather summary for coordinates.

    Uses OpenWeatherMap current weather endpoint.
    Falls back to deterministic mock only when API is unavailable.
    """
    url = "https://api.openweathermap.org/data/2.5/weather"
    api_key = os.getenv("OPENWEATHER_API_KEY")
    print("API KEY:", api_key)
    if not api_key:
        print("API KEY NOT LOADED")
    if not api_key:
        logger.error("Weather API Status: FAILED | OPENWEATHER_API_KEY not configured")
        raise ValueError("OPENWEATHER_API_KEY is not configured")
    cache_ttl = int(os.getenv("WEATHER_CACHE_TTL_SECONDS", "600"))
    cache = _get_redis_client()
    key = _cache_key(lat, lon)
    if cache:
        try:
            cached = cache.get(key)
            if cached:
                payload = json.loads(cached)
                payload["cache"] = "hit"
                print("Fetching weather for:", {"lat": lat, "lon": lon, "source": "redis-cache"})
                print("RAW API RESPONSE:", {"cache": "hit", "cached_payload_preview": payload})
                print(
                    "PARSED WEATHER DATA:",
                    {
                        "temperature": payload.get("temperature"),
                        "humidity": payload.get("humidity"),
                        "rainfall": payload.get("rainfall"),
                        "wind_speed": payload.get("wind_speed"),
                        "pressure": payload.get("pressure"),
                    },
                )
                logger.info("Weather API Status: REAL | source=redis-cache lat=%.4f lon=%.4f", lat, lon)
                return payload
        except Exception as exc:  # noqa: BLE001
            logger.warning("Redis cache read failed for %s: %s", key, exc)

    params = {
        "lat": lat,
        "lon": lon,
        "appid": api_key,
        "units": "metric",
    }
    try:
        print("Fetching weather for:", {"lat": lat, "lon": lon, "source": "openweathermap"})
        resp = requests.get(url, params=params, timeout=8)
        resp.raise_for_status()
        data = resp.json()
        print("RAW API RESPONSE:", data)
        main = data.get("main") or {}
        wind = data.get("wind") or {}
        rain = data.get("rain") or {}
        if "temp" not in main or "humidity" not in main or "pressure" not in main or "speed" not in wind:
            raise ValueError("incomplete weather payload from OpenWeatherMap")
        # Rainfall proxy in mm for the latest hour when available.
        rainfall_1h = rain.get("1h")
        if rainfall_1h is None and rain.get("3h") is not None:
            rainfall_1h = float(rain.get("3h", 0.0)) / 3.0
        rainfall_1h = float(rainfall_1h or 0.0)
        out = {
            "temperature": float(main.get("temp", 20)),
            "humidity": float(main.get("humidity", 50)),
            "rainfall": rainfall_1h,
            "wind_speed": float(wind.get("speed", 0.0)) * 3.6,  # m/s -> km/h
            "pressure": float(main.get("pressure", 1013.25)),
            "source": "openweathermap",
            "lat": lat,
            "lon": lon,
            "cache": "miss",
        }
        if cache:
            try:
                cache.setex(key, cache_ttl, json.dumps(out))
            except Exception as exc:  # noqa: BLE001
                logger.warning("Redis cache write failed for %s: %s", key, exc)
        print(
            "PARSED WEATHER DATA:",
            {
                "temperature": out.get("temperature"),
                "humidity": out.get("humidity"),
                "rainfall": out.get("rainfall"),
                "wind_speed": out.get("wind_speed"),
                "pressure": out.get("pressure"),
            },
        )
        logger.info("Weather API Status: REAL | source=openweathermap lat=%.4f lon=%.4f", lat, lon)
        return out
    except Exception as exc:  # noqa: BLE001 - broad fallback by design
        print("ERROR: Weather API failed or returned empty data")
        logger.warning("Weather API Status: FALLBACK | OpenWeatherMap request failed: %s", exc)
        fallback = _mock_weather(lat, lon)
        fallback["source"] = "fallback_mock"
        fallback["fallback"] = True
        print("FALLBACK MODE ACTIVATED")
        print(
            "PARSED WEATHER DATA:",
            {
                "temperature": fallback.get("temperature"),
                "humidity": fallback.get("humidity"),
                "rainfall": fallback.get("rainfall"),
                "wind_speed": fallback.get("wind_speed"),
                "pressure": fallback.get("pressure"),
            },
        )
        return fallback
