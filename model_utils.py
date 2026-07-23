"""
IntelliGuard ML training utilities: load /data CSVs, map to a unified weather+geo
feature schema, train classifiers, and persist joblib bundles for the API.

All disaster models share FEATURES so real-time weather + lat/lon can drive inference.
"""

from __future__ import annotations

import logging
import re
import warnings
from pathlib import Path
from typing import Any, Callable

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

try:
    from xgboost import XGBClassifier

    _HAS_XGB = True
except ImportError:
    XGBClassifier = None  # type: ignore[misc, assignment]
    _HAS_XGB = False

warnings.filterwarnings("ignore", category=UserWarning)

logger = logging.getLogger(__name__)

FEATURES = [
    "temperature",
    "humidity",
    "rainfall",
    "wind_speed",
    "pressure",
    "lat",
    "lon",
]
TARGET_COL = "target"

PROJECT_ROOT = Path(__file__).resolve().parent
DATA_DIR = PROJECT_ROOT / "data"
MODELS_DIR = PROJECT_ROOT / "models"

RANDOM_STATE = 42
TEST_SIZE = 0.2
MAX_WILDFIRE_ROWS = 50_000

# Filename → logical key (output stem)
FILE_TO_DISASTER: dict[str, str] = {
    "flood.csv": "flood",
    "wlidfire.csv": "wildfire",  # typo in repo
    "wildfire.csv": "wildfire",
    "landslide.csv": "landslide",
    "hurricane.csv": "cyclone",
    "cyclone.csv": "cyclone",
    "Earthquakes.csv": "earthquake",
    "earthquakes.csv": "earthquake",
}

OUTPUT_NAMES: dict[str, str] = {
    "flood": "flood_model.pkl",
    "wildfire": "wildfire_model.pkl",
    "landslide": "landslide_model.pkl",
    "cyclone": "cyclone_model.pkl",
    "earthquake": "earthquake_model.pkl",
}


def discover_data_files() -> list[Path]:
    """Return CSV paths under /data that map to a known disaster type."""
    if not DATA_DIR.is_dir():
        raise FileNotFoundError(f"Data directory not found: {DATA_DIR}")
    paths: list[Path] = []
    for p in sorted(DATA_DIR.glob("*.csv")):
        key = FILE_TO_DISASTER.get(p.name)
        if key:
            paths.append(p)
    return paths


def infer_disaster_key(path: Path) -> str | None:
    return FILE_TO_DISASTER.get(path.name)


def _parse_hurricane_coord(s: Any) -> float:
    """Parse strings like '28.0N', '94.8W' to signed decimal degrees."""
    if pd.isna(s):
        return np.nan
    t = str(s).strip().upper()
    m = re.match(r"^(-?\d+\.?\d*)\s*([NSEW])$", t)
    if not m:
        return np.nan
    val = float(m.group(1))
    hemi = m.group(2)
    if hemi in ("S", "W"):
        val = -abs(val)
    return val


def _flood_temperature_column(df: pd.DataFrame) -> str:
    if "Temperature (°C)" in df.columns:
        return "Temperature (°C)"
    for c in df.columns:
        cl = str(c).lower()
        if "temperature" in cl and "c" in cl.replace("°", ""):
            return str(c)
    raise ValueError("flood: missing temperature column (expected 'Temperature (°C)')")


def transform_flood(df: pd.DataFrame, rng: np.random.Generator) -> pd.DataFrame:
    df = df.drop_duplicates().copy()
    tcol = _flood_temperature_column(df)
    n = len(df)
    return pd.DataFrame(
        {
            "temperature": pd.to_numeric(df[tcol], errors="coerce"),
            "humidity": pd.to_numeric(df["Humidity (%)"], errors="coerce"),
            "rainfall": pd.to_numeric(df["Rainfall (mm)"], errors="coerce"),
            "wind_speed": rng.uniform(5.0, 15.0, size=n),
            "pressure": rng.uniform(1000.0, 1015.0, size=n),
            "lat": pd.to_numeric(df["Latitude"], errors="coerce"),
            "lon": pd.to_numeric(df["Longitude"], errors="coerce"),
            "target": pd.to_numeric(df["Flood Occurred"], errors="coerce"),
        }
    )


def transform_wildfire(df: pd.DataFrame, rng: np.random.Generator) -> pd.DataFrame:
    _ = rng
    df = df.drop_duplicates().copy()
    bright = pd.to_numeric(df["brightness"], errors="coerce")
    conf = pd.to_numeric(df["confidence"], errors="coerce")
    track = pd.to_numeric(df["track"], errors="coerce")
    typ = pd.to_numeric(df["type"], errors="coerce").fillna(0.0)
    lat = pd.to_numeric(df["latitude"], errors="coerce")
    lon = pd.to_numeric(df["longitude"], errors="coerce")
    n = len(df)
    return pd.DataFrame(
        {
            "temperature": bright / 10.0,
            "humidity": 100.0 - conf,
            "rainfall": np.zeros(n, dtype=float),
            "wind_speed": track * 10.0,
            "pressure": 1013.0 - (bright - 300.0),
            "lat": lat,
            "lon": lon,
            "target": (typ > 0.0).astype(int),
        }
    )


def transform_earthquake(df: pd.DataFrame, rng: np.random.Generator) -> pd.DataFrame:
    df = df.drop_duplicates().copy()
    df = df.dropna(subset=["mag", "latitude", "longitude"])
    mag = pd.to_numeric(df["mag"], errors="coerce")
    lat = pd.to_numeric(df["latitude"], errors="coerce")
    lon = pd.to_numeric(df["longitude"], errors="coerce")
    n = len(df)
    return pd.DataFrame(
        {
            "temperature": rng.uniform(20.0, 35.0, size=n),
            "humidity": rng.uniform(30.0, 70.0, size=n),
            "rainfall": np.zeros(n, dtype=float),
            "wind_speed": np.zeros(n, dtype=float),
            "pressure": np.full(n, 1010.0, dtype=float),
            "lat": lat,
            "lon": lon,
            "target": (mag >= 4.0).astype(int),
        }
    )


def transform_cyclone(df: pd.DataFrame, rng: np.random.Generator) -> pd.DataFrame:
    df = df.drop_duplicates().copy()
    n = len(df)
    lat = df["Latitude"].map(_parse_hurricane_coord)
    lon = df["Longitude"].map(_parse_hurricane_coord)
    mw = pd.to_numeric(df["Maximum Wind"], errors="coerce").replace(-999, np.nan)
    mp = pd.to_numeric(df["Minimum Pressure"], errors="coerce").replace(-999, 1000.0)
    status = df["Status"].astype(str).str.strip()
    y = (status == "HU").astype(int)
    out = pd.DataFrame(
        {
            "temperature": rng.uniform(25.0, 32.0, size=n),
            "humidity": rng.uniform(60.0, 90.0, size=n),
            "rainfall": rng.uniform(50.0, 300.0, size=n),
            "wind_speed": mw,
            "pressure": mp,
            "lat": lat,
            "lon": lon,
            "target": y,
        }
    )
    return out.dropna(subset=["wind_speed", "lat", "lon", "pressure"])


def transform_landslide(df: pd.DataFrame, rng: np.random.Generator) -> pd.DataFrame:
    df = df.drop_duplicates().copy()
    rain = pd.to_numeric(df["Rainfall"], errors="coerce")
    lat = pd.to_numeric(df["Latitude"], errors="coerce")
    lon = pd.to_numeric(df["Longitude"], errors="coerce")
    tgt_col = "occured" if "occured" in df.columns else "occurred"
    if tgt_col not in df.columns:
        raise ValueError("landslide: need 'occured' or 'occurred' column")
    y = pd.to_numeric(df[tgt_col], errors="coerce")
    n = len(df)
    rain_vals = rain.to_numpy(dtype=float, copy=True)
    temp = 25.0 + 0.1 * rain_vals
    temp = np.clip(temp, 20.0, 30.0)
    temp = np.where(np.isnan(rain_vals), rng.uniform(20.0, 30.0, size=n), temp)
    hum = 50.0 + 0.25 * rain_vals
    hum = np.clip(hum, 30.0, 90.0)
    hum = np.where(np.isnan(rain_vals), rng.uniform(35.0, 75.0, size=n), hum)
    return pd.DataFrame(
        {
            "temperature": temp,
            "humidity": hum,
            "rainfall": rain,
            "wind_speed": rng.uniform(5.0, 15.0, size=n),
            "pressure": rng.uniform(1000.0, 1015.0, size=n),
            "lat": lat,
            "lon": lon,
            "target": y,
        }
    )


TRANSFORMERS: dict[str, Callable[[pd.DataFrame, np.random.Generator], pd.DataFrame]] = {
    "flood": transform_flood,
    "wildfire": transform_wildfire,
    "landslide": transform_landslide,
    "cyclone": transform_cyclone,
    "earthquake": transform_earthquake,
}


def clean_unified_df(df: pd.DataFrame) -> pd.DataFrame:
    """Keep only unified schema columns, coerce numerics, impute X, drop bad targets."""
    missing_feats = [f for f in FEATURES if f not in df.columns]
    if missing_feats:
        raise ValueError(f"Unified schema missing feature columns: {missing_feats}")
    if TARGET_COL not in df.columns:
        raise ValueError(f"Missing target column {TARGET_COL!r}")

    out = df[FEATURES + [TARGET_COL]].copy()
    for c in FEATURES + [TARGET_COL]:
        out[c] = pd.to_numeric(out[c], errors="coerce")
    out = out.replace([np.inf, -np.inf], np.nan)

    for c in FEATURES:
        med = out[c].median()
        fill = float(med) if pd.notna(med) else 0.0
        out[c] = out[c].fillna(fill)

    out = out.dropna(subset=[TARGET_COL])
    out = out[np.isfinite(out[TARGET_COL])]
    out[TARGET_COL] = out[TARGET_COL].astype(int)
    return out.drop_duplicates()


def train_unified_model(
    X: pd.DataFrame,
    y: pd.Series,
    disaster_key: str,
) -> tuple[Any, StandardScaler, float, str, dict[str, float], str]:
    """
    Fit StandardScaler on train; compare RandomForest vs XGBoost (if available) on holdout.
    Returns: model, scaler, test_accuracy, best_name, all_scores, classification_report
    """
    if y.nunique() < 2:
        raise ValueError(f"{disaster_key}: target has a single class — cannot train classifier.")

    strat = y if y.value_counts().min() >= 2 else None
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=strat,
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    scores: dict[str, float] = {}
    models: dict[str, Any] = {}

    rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=16,
        min_samples_split=4,
        class_weight="balanced_subsample",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    rf.fit(X_train_s, y_train)
    y_pred_rf = rf.predict(X_test_s)
    scores["rf"] = float(accuracy_score(y_test, y_pred_rf))
    models["rf"] = rf

    if _HAS_XGB and XGBClassifier is not None:
        xgb = XGBClassifier(
            n_estimators=200,
            max_depth=8,
            learning_rate=0.08,
            subsample=0.9,
            colsample_bytree=0.9,
            random_state=RANDOM_STATE,
            n_jobs=-1,
            eval_metric="logloss",
        )
        xgb.fit(X_train_s, y_train)
        y_pred_x = xgb.predict(X_test_s)
        scores["xgb"] = float(accuracy_score(y_test, y_pred_x))
        models["xgb"] = xgb
    else:
        logger.warning("xgboost not installed; training only RandomForest for %s", disaster_key)

    best_name = max(scores, key=lambda k: scores[k])
    best_model = models[best_name]
    y_pred = best_model.predict(X_test_s)
    acc = float(accuracy_score(y_test, y_pred))
    report = classification_report(y_test, y_pred, digits=4)

    return best_model, scaler, acc, best_name, scores, report


def save_model_bundle(
    model: Any,
    scaler: StandardScaler,
    features: list[str],
    disaster_key: str,
    label_description: str,
) -> Path:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    out_name = OUTPUT_NAMES[disaster_key]
    path = MODELS_DIR / out_name
    bundle = {
        "model": model,
        "scaler": scaler,
        "features": list(features),
        "disaster_key": disaster_key,
        "label_description": label_description,
        "schema_version": 2,
    }
    joblib.dump(bundle, path)
    return path


def run_pipeline_for_file(path: Path) -> dict[str, Any]:
    key = infer_disaster_key(path)
    if not key:
        raise ValueError(f"Unmapped file: {path}")

    rng = np.random.default_rng(RANDOM_STATE)
    raw = pd.read_csv(path, low_memory=False)
    transformer = TRANSFORMERS[key]
    df = transformer(raw, rng)
    df = clean_unified_df(df)

    if key == "wildfire" and len(df) > MAX_WILDFIRE_ROWS:
        strat = df[TARGET_COL] if df[TARGET_COL].value_counts().min() >= 2 else None
        try:
            _, df = train_test_split(
                df,
                train_size=MAX_WILDFIRE_ROWS,
                stratify=strat,
                random_state=RANDOM_STATE,
            )
        except ValueError:
            df = df.sample(MAX_WILDFIRE_ROWS, random_state=RANDOM_STATE)
        df = df.reset_index(drop=True)

    print(f"Training {key}: unified FEATURES = {FEATURES}")
    for f in FEATURES:
        if f not in df.columns:
            raise ValueError(f"Missing required feature {f!r} after cleaning.")

    X = df[FEATURES]
    y = df[TARGET_COL]

    labels_desc = {
        "flood": "Flood Occurred (1=yes)",
        "wildfire": "MODIS type > 0",
        "landslide": "Landslide occurred (occured=1)",
        "cyclone": "Hurricane status (Status == HU)",
        "earthquake": "Magnitude >= 4.0",
    }[key]

    model, scaler, acc, best_name, scores, report = train_unified_model(X, y, disaster_key=key)
    out_path = save_model_bundle(model, scaler, list(FEATURES), key, labels_desc)

    return {
        "disaster_key": key,
        "file": str(path),
        "output_path": str(out_path),
        "best_model": best_name,
        "test_accuracy": acc,
        "all_scores": scores,
        "classification_report": report,
    }
