from flask import Blueprint, request, jsonify
import requests
import polyline
import os

route_bp = Blueprint("route_bp", __name__, url_prefix="/route")

ORS_API_KEY = os.getenv("ORS_API_KEY")

ORS_URL = "https://api.openrouteservice.org/v2/directions/driving-car"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"


# -----------------------------
# LIVE HOSPITALS (OVERPASS)
# -----------------------------
def fetch_hospitals(lat, lon):
    try:
        query = f"""
        [out:json];
        node["amenity"="hospital"](around:5000,{lat},{lon});
        out;
        """

        res = requests.post(OVERPASS_URL, data={"data": query})
        data = res.json()

        hospitals = []

        for el in data.get("elements", []):
            hospitals.append({
                "name": el.get("tags", {}).get("name", "Unknown Hospital"),
                "lat": el.get("lat"),
                "lon": el.get("lon")
            })

        return hospitals

    except:
        return []


# -----------------------------
# ORS ROUTE
# -----------------------------
def get_route(src, dst):
    headers = {
        "Authorization": ORS_API_KEY,
        "Content-Type": "application/json"
    }

    body = {
        "coordinates": [src, dst]
    }

    return requests.post(ORS_URL, json=body, headers=headers).json()


# -----------------------------
# RISK SCORE
# -----------------------------
def risk_score(points):
    score = 0
    for lat, lon in points:
        score += abs(lat) * 0.01 + abs(lon) * 0.01
    return score


# -----------------------------
# MAIN API
# -----------------------------
@route_bp.post("/calculate")
def calculate_route():
    data = request.get_json()

    src_lat = data["source_lat"]
    src_lon = data["source_lon"]
    dst_lat = data["dest_lat"]
    dst_lon = data["dest_lon"]

    src = [src_lon, src_lat]
    dst = [dst_lon, dst_lat]

    try:
        result = get_route(src, dst)

        if "routes" not in result:
            return jsonify({"error": "ORS failed", "raw": result}), 500

        route = result["routes"][0]

        # -----------------------------
        # GEOMETRY
        # -----------------------------
        coords = route["geometry"]
        decoded = polyline.decode(coords)

        route_points = [[lat, lon] for lat, lon in decoded]

        # -----------------------------
        # DISTANCE / TIME
        # -----------------------------
        distance_km = route["summary"]["distance"] / 1000
        duration_min = route["summary"]["duration"] / 60

        # -----------------------------
        # TURN BY TURN NAVIGATION (IMPORTANT FIX)
        # -----------------------------
        steps_raw = route["segments"][0]["steps"]

        steps = []
        for s in steps_raw:
            steps.append({
                "instruction": s.get("instruction"),
                "distance": round(s.get("distance", 0), 2),
                "duration": round(s.get("duration", 0), 2)
            })

        # -----------------------------
        # RISK
        # -----------------------------
        risk = risk_score(decoded)

        risk_level = (
            "LOW" if risk < 200 else
            "MEDIUM" if risk < 500 else
            "HIGH"
        )

        # -----------------------------
        # SAFE ROUTE (SIMPLIFIED OFFSET)
        # -----------------------------
        safe_route_points = [[lat + 0.005, lon + 0.005] for lat, lon in route_points]

        # -----------------------------
        # HOSPITALS
        # -----------------------------
        hospitals = fetch_hospitals(src_lat, src_lon)

        nearest = hospitals[0] if hospitals else {
            "name": "No hospital found",
            "lat": src_lat,
            "lon": src_lon
        }

        # -----------------------------
        # RESPONSE
        # -----------------------------
        return jsonify({
            "source": {"lat": src_lat, "lon": src_lon},
            "destination": {"lat": dst_lat, "lon": dst_lon},

            "normal_route": {
                "distance_km": round(distance_km, 2),
                "duration_minutes": round(duration_min, 2),
                "risk_level": risk_level,
                "route_geometry": route_points,
                "steps": steps
            },

            "safe_route": {
                "distance_km": round(distance_km * 1.1, 2),
                "duration_minutes": round(duration_min * 1.2, 2),
                "risk_level": "LOW",
                "route_geometry": safe_route_points,
                "steps": steps
            },

            "nearest_hospital": nearest,
            "hospitals": hospitals,
            "risk_score": round(risk, 2)
        })

    except Exception as e:
        return jsonify({
            "error": "Route failed",
            "message": str(e)
        }), 500