"""Flask application factory for IntelliGuard."""

from __future__ import annotations

import logging
import os
from typing import Any

from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler
from flask import Flask, jsonify
from pymongo import MongoClient

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))
print("OPENWEATHER_API_KEY:", os.getenv("OPENWEATHER_API_KEY"))

from app import extensions as ext
from app.config import get_config
from app.routes.alert_routes import alert_bp
from app.routes.analysis_routes import analysis_bp
from app.routes.analytics_routes import analytics_bp
from app.routes.auth_routes import auth_bp
from app.routes.dashboard_routes import dashboard_bp
from app.routes.history_routes import history_bp
from app.routes.news_routes import news_bp
from app.routes.prediction_routes import prediction_bp
from app.routes.route_routes import route_bp
from app.routes.safety_routes import safety_bp
from app.routes.weather_routes import weather_bp
from app.services.alert_service import run_daily_digest_for_all_users
from app.services.prediction_service import refresh_predictions_for_all_users

logger = logging.getLogger(__name__)


def _ensure_indexes(app: Flask) -> None:
    db = ext.mongo_client.get_default_database()  # type: ignore[union-attr]
    ttl = int(app.config.get("PREDICTION_TTL_SECONDS", 259200))
    alert_ttl = int(app.config.get("ALERT_TTL_SECONDS", ttl))

    db.users.create_index("email", unique=True)
    db.predictions.create_index([("subject_key", 1), ("disaster_type", 1)])
    db.prediction_history.create_index([("subject_key", 1), ("created_at", -1)])
    try:
        db.predictions.create_index([("created_at", 1)], expireAfterSeconds=ttl)
        db.prediction_history.create_index([("created_at", 1)], expireAfterSeconds=ttl)
    except Exception as exc:  # noqa: BLE001
        # If TTL options differ from an existing index, operators may need to drop the old index once.
        logger.warning("Could not ensure TTL index on predictions/prediction_history.created_at: %s", exc)

    db.alerts.create_index([("user_id", 1), ("created_at", -1)])
    try:
        db.alerts.create_index([("created_at", 1)], expireAfterSeconds=alert_ttl)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not ensure TTL index on alerts.created_at: %s", exc)


def _start_scheduler(app: Flask) -> None:
    if ext.scheduler and ext.scheduler.running:
        return

    sched = BackgroundScheduler()

    def job() -> None:
        with app.app_context():
            summary = run_daily_digest_for_all_users()
            logger.info("Daily digest completed: %s", summary)

    sched.add_job(
        job,
        "cron",
        hour=int(app.config.get("DAILY_ALERT_HOUR", 7)),
        minute=int(app.config.get("DAILY_ALERT_MINUTE", 0)),
        id="intelliguard_daily_digest",
        replace_existing=True,
    )

    def refresh_job() -> None:
        with app.app_context():
            summary = refresh_predictions_for_all_users()
            logger.info("10-minute prediction refresh completed: %s", summary)

    sched.add_job(
        refresh_job,
        "interval",
        minutes=int(app.config.get("PREDICTION_REFRESH_MINUTES", 10)),
        id="intelliguard_prediction_refresh_10min",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )

    # Avoid duplicate schedulers with Flask debug reloader parent process.
    if app.debug and os.environ.get("WERKZEUG_RUN_MAIN") != "true":
        logger.info("Skipping APScheduler start in Flask reloader parent process")
        return

    sched.start()
    ext.scheduler = sched


def create_app() -> Flask:
    app = Flask(__name__)
    cfg = get_config()
    app.config.from_object(cfg)

    logging.basicConfig(level=logging.INFO)

    ext.mongo_client = MongoClient(app.config["MONGO_URI"])

    with app.app_context():
        _ensure_indexes(app)

    @app.get("/health")
    def health() -> Any:
        return jsonify({"status": "ok", "service": "IntelliGuard API"})

    @app.get("/")
    def root() -> Any:
        """Avoid 404 when opening the server root in a browser."""
        return jsonify(
            {
                "service": "IntelliGuard API",
                "message": "REST API only — use the routes below (or import the Postman collection).",
                "routes": {
                    "health": "/health",
                    "auth": "/auth/register, /auth/login, /auth/me",
                    "weather": "/weather?lat=&lon=",
                    "predict": "POST /predict (body: disaster, lat, lon)",
                    "alerts": "GET /alerts, POST /alerts/test-email",
                    "route": "GET|POST /route/calculate",
                    "news": "GET /news/latest?disaster=<type>",
                    "analytics": "GET /analytics/summary, GET /analytics/trends?days=30",
                    "predictions_history": "GET /predictions/history?range=24h|7d|30d (auth required)",
                    "dashboard": "GET /dashboard/summary (auth required)",
                    "analysis": "GET /analysis/overview, GET /analysis/<disaster>",
                    "safety": "GET /safety/overview, GET /safety/<disaster>",
                },
            }
        )

    app.register_blueprint(auth_bp)
    app.register_blueprint(weather_bp)
    app.register_blueprint(prediction_bp)
    app.register_blueprint(alert_bp)
    app.register_blueprint(route_bp)
    app.register_blueprint(news_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(history_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(analysis_bp)
    app.register_blueprint(safety_bp)

    @app.errorhandler(404)
    def not_found(_e):  # noqa: ANN001
        return jsonify({"success": False, "error": "Not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(_e):  # noqa: ANN001
        return jsonify({"success": False, "error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def server_error(_e):  # noqa: ANN001
        return jsonify({"success": False, "error": "Internal server error"}), 500

    @app.after_request
    def add_cors_headers(response):  # noqa: ANN001
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        return response

    _start_scheduler(app)

    return app
