# database.py
"""Database configuration and models for Job Application Tracker."""

import os
import urllib.parse
import hashlib
import logging
import redis
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Load environment variables from the .env file
load_dotenv()

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration with fallback defaults for development
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = (
    urllib.parse.quote_plus(os.getenv("DB_PASSWORD"))
    if os.getenv("DB_PASSWORD")
    else None
)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "job_tracker_db")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Redis connection
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_URL = os.getenv("REDIS_URL")

if REDIS_URL:
    redis_client = redis.from_url(
        REDIS_URL,
        decode_responses=True,
        socket_connect_timeout=5,
        socket_keepalive=True,
    )
else:
    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=6379,
        db=0,
        decode_responses=True,
        socket_connect_timeout=5,
        socket_keepalive=True,
    )


def init_db() -> None:
    """Initialize database and create all tables."""
    try:
        # Import models here to ensure they are registered with Base
        import models

        Base.metadata.create_all(bind=engine)
        print(f"Database initialized successfully at {DB_HOST}:{DB_PORT}/{DB_NAME}")
    except Exception as e:
        print(f"Warning: Could not initialize database: {e}")
        print(
            f"  Attempted connection: postgresql://{DB_USER}:***@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        )
        print("  Make sure PostgreSQL is running and accessible.")
        raise


def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_cache_key(*args) -> str:
    """Generate cache key from arguments."""
    key_str = ":".join(str(arg) for arg in args)
    return hashlib.md5(key_str.encode()).hexdigest()


def invalidate_cache(patterns: list[str]) -> None:
    """Invalidate cache for given patterns."""
    try:
        for pattern in patterns:
            keys = redis_client.keys(f"*{pattern}*")
            if keys:
                redis_client.delete(*keys)
    except redis.ConnectionError:
        logger.warning("Redis connection error during cache invalidation")
