# Risk engine for disaster-aware routing

import math

DISASTER_ZONES = [
    {"lat": 19.10, "lon": 72.85, "risk": 5},
    {"lat": 19.05, "lon": 72.90, "risk": 4},
]

def distance(a, b):
    return math.sqrt((a["lat"] - b["lat"])**2 + (a["lon"] - b["lon"])**2)


def route_risk_score(route_points):
    score = 0

    for point in route_points:
        for zone in DISASTER_ZONES:
            d = distance(point, zone)

            if d < 0.02:
                score += zone["risk"] * 120
            elif d < 0.05:
                score += zone["risk"] * 60

    return score