"""Shared extension instances (initialized in application factory)."""

from apscheduler.schedulers.background import BackgroundScheduler
from pymongo import MongoClient

mongo_client: MongoClient | None = None
scheduler: BackgroundScheduler | None = None


def get_db():
    """Return the default database handle."""
    if mongo_client is None:
        raise RuntimeError("MongoDB client is not initialized")
    return mongo_client.get_default_database()
