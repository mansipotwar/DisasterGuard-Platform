import requests
import polyline
from app.services.risk_engine import route_risk_score

OSRM_BASE_URL = "http://router.project-osrm.org/route/v1/driving"


# -----------------------------
# MOCK HOSPITAL DATABASE
# -----------------------------
_HOSPITALS = [
    {"name": "City General Hospital", "lat": 19.076, "lon": 72.8777},
    {"name": "Regional Medical Center", "lat": 28.6139, "lon": 77.2090},
    {"name": "District Emergency Hospital", "lat": 18.5204, "lon": 73.8567},
]


# -----------------------------
# FIND NEAREST HOSPITAL
# -----------------------------
def _nearest_hospital(lat, lon):
    best = None
    best_score = float("inf")

    for h in _HOSPITALS:
        score = abs(h["lat"] - lat) + abs(h["lon"] - lon)
        if score < best_score:
            best_score = score
            best = h

    return best


# -----------------------------
# FETCH OSRM ROUTE
# -----------------------------
def _get_osrm_route(source_lat, source_lon, dest_lat, dest_lon):
    coords = f"{source_lon},{source_lat};{dest_lon},{dest_lat}"
    url = f"{OSRM_BASE_URL}/{coords}"

    resp = requests.get(
        url,
        params={"overview": "full", "geometries": "polyline"}
    )

    data = resp.json()

    if "routes" not in data or len(data["routes"]) == 0:
        raise Exception("No route found from OSRM")

    return data["routes"][0]


# -----------------------------
# MAIN FUNCTION
# -----------------------------
def calculate_route_weighted(source_lat, source_lon, dest_lat, dest_lon):

    route = _get_osrm_route(source_lat, source_lon, dest_lat, dest_lon)

    # decode geometry
    points = polyline.decode(route["geometry"])
    route_points = [{"lat": p[0], "lon": p[1]} for p in points]

    # risk score
    risk_score = route_risk_score(route_points)

    distance_km = route["distance"] / 1000
    duration_min = route["duration"] / 60

    # -------------------------
    # NORMAL ROUTE
    # -------------------------
    normal_route = {
        "distance_km": round(distance_km, 2),
        "duration_minutes": round(duration_min, 2),
        "risk_score": round(risk_score, 2),
        "risk_level": (
            "LOW" if risk_score < 200 else
            "MEDIUM" if risk_score < 500 else
            "HIGH"
        ),
        "route_geometry": route["geometry"],
        "steps": [
            "Start from source location",
            "Take OSRM shortest path",
            "Follow main highways",
            "Proceed toward destination city",
            "Arrive at destination"
        ]
    }

    # -------------------------
    # SAFE ROUTE (MODIFIED LOGIC)
    # -------------------------
    safe_distance = distance_km * 1.05
    safe_duration = duration_min * (1.1 if risk_score > 200 else 1.2)

    safe_route = {
        "distance_km": round(safe_distance, 2),
        "duration_minutes": round(safe_duration, 2),
        "risk_score": round(risk_score * 0.6, 2),
        "risk_level": "LOW",
        "route_geometry": route["geometry"],
        "steps": [
            "Avoid disaster-prone zones",
            "Redirect through safe elevation areas",
            "Bypass flood/fire/high-risk regions",
            "Use emergency-safe corridors",
            "Merge back to main route",
            "Arrive at destination safely"
        ]
    }

    # -------------------------
    # RESPONSE
    # -------------------------
    return {
        "normal_route": normal_route,
        "safe_route": safe_route,
        "nearest_hospital": _nearest_hospital(dest_lat, dest_lon),
        "risk_score": round(risk_score, 2)
    }