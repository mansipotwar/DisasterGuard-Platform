"""Per-disaster ML modules (mock rules now; swap in joblib models later)."""

from app.services.ml_models.earthquake_model import predict_earthquake
from app.services.ml_models.flood_model import predict_flood
from app.services.ml_models.hurricane_model import predict_hurricane
from app.services.ml_models.landslide_model import predict_landslide
from app.services.ml_models.wildfire_model import predict_wildfire

__all__ = [
    "predict_earthquake",
    "predict_flood",
    "predict_hurricane",
    "predict_landslide",
    "predict_wildfire",
]
