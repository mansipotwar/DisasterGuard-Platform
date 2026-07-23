"""Structured safety recommendation content."""

from __future__ import annotations

from typing import Any


_BASE_OVERVIEW = {
    "general_guidelines": [
        "Keep emergency contacts and local emergency numbers accessible.",
        "Maintain a 72-hour emergency kit with water, food, medicines, and flashlight.",
        "Track official weather and disaster advisories regularly.",
    ],
    "preparedness_checklist": [
        "Phone fully charged and power bank ready",
        "First-aid kit available",
        "Important documents backed up",
        "Emergency transport plan prepared",
    ],
    "universal_safety_rules": [
        "Follow verified government advisories only.",
        "Avoid high-risk areas unless evacuation is required.",
        "Inform family or friends before relocation.",
    ],
}

_DISASTER_GUIDES: dict[str, dict[str, Any]] = {
    "flood": {
        "before": ["Move valuables to higher levels.", "Prepare sandbags and drainage checks."],
        "during": ["Avoid walking/driving through floodwater.", "Switch off electricity if water rises."],
        "after": ["Disinfect water sources.", "Inspect structural and electrical damage."],
        "dos": ["Follow evacuation notices.", "Use clean drinking water."],
        "donts": ["Do not enter fast-moving water.", "Do not restore power with wet wiring."],
        "emergency_instructions": ["Move to high ground immediately when alert turns high."],
    },
    "earthquake": {
        "before": ["Secure heavy furniture.", "Identify safe drop-cover-hold spots."],
        "during": ["Drop, Cover, and Hold On.", "Stay away from glass and exterior walls."],
        "after": ["Expect aftershocks.", "Check gas leaks and injuries."],
        "dos": ["Keep shoes and torch near bed.", "Use stairs, not lifts."],
        "donts": ["Do not run outdoors during shaking.", "Do not use open flames after quake."],
        "emergency_instructions": ["Evacuate damaged buildings after shaking stops."],
    },
    "wildfire": {
        "before": ["Clear dry vegetation around home.", "Prepare masks and evacuation bag."],
        "during": ["Evacuate early when advised.", "Close windows/vents to reduce smoke ingress."],
        "after": ["Check for hidden embers.", "Use N95 mask in ash-heavy zones."],
        "dos": ["Monitor wind direction and fire updates.", "Keep vehicle fueled for evacuation."],
        "donts": ["Do not ignore ember spots.", "Do not return before official clearance."],
        "emergency_instructions": ["Prioritize evacuation over property protection."],
    },
    "hurricane": {
        "before": ["Reinforce doors/windows.", "Store drinking water and dry food."],
        "during": ["Stay indoors away from windows.", "Do not travel unless evacuation is ordered."],
        "after": ["Avoid downed power lines.", "Use generators only in ventilated spaces."],
        "dos": ["Track eye-wall and wind alerts.", "Keep emergency radio active."],
        "donts": ["Do not go outside during brief calm.", "Do not wade through unknown water."],
        "emergency_instructions": ["If shelter is damaged, move to nearest official relief center."],
    },
    "landslide": {
        "before": ["Watch for cracks on slopes/walls.", "Plan alternative evacuation routes."],
        "during": ["Move perpendicular to slide path.", "Seek stable high ground."],
        "after": ["Stay away from unstable slopes.", "Report blocked roads and utilities."],
        "dos": ["Monitor prolonged rainfall alerts.", "Keep drainage channels clear."],
        "donts": ["Do not stay near retaining walls.", "Do not cross fresh debris flows."],
        "emergency_instructions": ["Evacuate at first sign of slope movement."],
    },
}


def safety_overview() -> dict[str, Any]:
    return dict(_BASE_OVERVIEW)


def safety_for_disaster(disaster_type: str, risk_level: str | None = None) -> dict[str, Any]:
    key = (disaster_type or "").strip().lower()
    if key not in _DISASTER_GUIDES:
        raise ValueError("unsupported_disaster_type")
    out = dict(_DISASTER_GUIDES[key])
    if risk_level and risk_level.lower() == "high":
        out["emergency_instructions"] = out["emergency_instructions"] + ["Execute evacuation plan immediately."]
    return out
