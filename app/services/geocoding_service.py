"""Reverse geocoding for human-readable place names (Nominatim)."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

import requests

logger = logging.getLogger(__name__)

_NOMINATIM_REVERSE = "https://nominatim.openstreetmap.org/reverse"
_REQUEST_TIMEOUT_SEC = 3
_USER_AGENT = "IntelliGuard/1.0 (reverse geocoding for flood alerts)"


def _pick_city(addr: dict[str, Any]) -> str | None:
    for key in ("city", "town", "village", "hamlet", "municipality", "suburb", "neighbourhood"):
        v = addr.get(key)
        if v and str(v).strip():
            return str(v).strip()
    return None


def get_place_name(lat: float | None, lon: float | None) -> str:
    """
    Return "city, state, country" from coordinates, or "Unknown Location" on failure.

    Uses OpenStreetMap Nominatim (free); does not raise — safe to call from request paths.
    """
    if lat is None or lon is None:
        return "Unknown Location"
    try:
        resp = requests.get(
            _NOMINATIM_REVERSE,
            params={"format": "json", "lat": lat, "lon": lon},
            headers={"User-Agent": _USER_AGENT},
            timeout=_REQUEST_TIMEOUT_SEC,
        )
        resp.raise_for_status()
        data = resp.json()
        addr = data.get("address") or {}
        city = _pick_city(addr)
        state = addr.get("state") or addr.get("region") or addr.get("county")
        country = addr.get("country")
        parts: list[str] = []
        if city:
            parts.append(city)
        if state and (not city or str(state).strip() != city):
            parts.append(str(state).strip())
        if country:
            parts.append(str(country).strip())
        if not parts:
            name = data.get("display_name")
            if name and str(name).strip():
                return str(name).strip()[:200]
            return "Unknown Location"
        return ", ".join(parts)
    except Exception as exc:  # noqa: BLE001 — never break callers
        logger.warning("Reverse geocoding failed: %s", exc)
        return "Unknown Location"


def get_location_details(lat: float | None, lon: float | None) -> dict[str, Any]:
    """
    Return structured high-precision location details.

    Output keys:
      full_name, city, district, state, country, pincode, latitude, longitude, date
    """
    base = {
        "full_name": "Unknown Location",
        "city": "",
        "district": "",
        "state": "",
        "country": "",
        "pincode": "",
        "latitude": lat,
        "longitude": lon,
        "date": datetime.now(timezone.utc).date().isoformat(),
    }
    if lat is None or lon is None:
        return base
    try:
        resp = requests.get(
            _NOMINATIM_REVERSE,
            params={"format": "json", "lat": lat, "lon": lon},
            headers={"User-Agent": _USER_AGENT},
            timeout=_REQUEST_TIMEOUT_SEC,
        )
        resp.raise_for_status()
        data = resp.json()
        addr = data.get("address") or {}
        city = _pick_city(addr) or ""
        district = str(addr.get("county") or addr.get("state_district") or "").strip()
        state = str(addr.get("state") or addr.get("region") or "").strip()
        country = str(addr.get("country") or "").strip()
        pincode = str(addr.get("postcode") or "").strip()

        parts: list[str] = []
        if city:
            parts.append(city)
        if district and district.lower() != city.lower():
            parts.append(district)
        if state and state.lower() not in {city.lower(), district.lower()}:
            parts.append(state)
        if country:
            parts.append(country)
        full = ", ".join([p for p in parts if p])
        if pincode:
            full = f"{full} (PIN: {pincode})" if full else f"Unknown Location (PIN: {pincode})"
        if not full:
            full = str(data.get("display_name") or "Unknown Location")[:220]
        return {
            **base,
            "full_name": full,
            "city": city,
            "district": district,
            "state": state,
            "country": country,
            "pincode": pincode,
            "latitude": lat,
            "longitude": lon,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("Structured reverse geocoding failed: %s", exc)
        return base
