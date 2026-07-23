"""Central configuration loaded from environment variables."""

import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


class Config:
    """Default application configuration."""

    SECRET_KEY = os.getenv("SECRET_KEY", os.getenv("JWT_SECRET", "dev-secret-change-me"))
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/intelliguard")
    JWT_SECRET = os.getenv("JWT_SECRET", "dev-jwt-secret-change-me")
    JWT_EXPIRES = timedelta(hours=int(os.getenv("JWT_EXPIRES_HOURS", "24")))

    EMAIL_USER = os.getenv("EMAIL_USER", "")
    EMAIL_PASS = os.getenv("EMAIL_PASS", "")
    SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))

    DAILY_ALERT_HOUR = int(os.getenv("DAILY_ALERT_HOUR", "7"))
    DAILY_ALERT_MINUTE = int(os.getenv("DAILY_ALERT_MINUTE", "0"))
    PREDICTION_REFRESH_MINUTES = int(os.getenv("PREDICTION_REFRESH_MINUTES", "10"))

    PREDICTION_TTL_SECONDS = int(os.getenv("PREDICTION_TTL_SECONDS", "259200"))  # 3 days
    ALERT_TTL_SECONDS = int(os.getenv("ALERT_TTL_SECONDS", "259200"))  # 3 days


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}


def get_config():
    env = os.getenv("FLASK_ENV", "development")
    return config_by_name.get(env, DevelopmentConfig)
