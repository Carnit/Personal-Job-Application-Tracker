# database.py
"""Database configuration and models for Job Application Tracker."""

import os
from dotenv import load_dotenv
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    DateTime,
    Float,
    Text,
    Enum,
)
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime, timezone
import urllib.parse
import enum

# Load environment variables from the .env file
load_dotenv()

# Database configuration with fallback defaults for development
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = urllib.parse.quote_plus(os.getenv("DB_PASSWORD"))  # type: ignore
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "job_tracker_db")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class ApplicationStage(str, enum.Enum):
    """Enum for application pipeline stages."""

    RESUME_SCREENING = "resume_screening"
    PHONE_SCREEN = "phone_screen"
    TECHNICAL_ROUND = "technical_round"
    ONSITE = "onsite"
    OFFER = "offer"
    REJECTED = "rejected"


class ApplicationStatus(str, enum.Enum):
    """Enum for application status."""

    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class ApplicationSource(str, enum.Enum):
    """Enum for application source."""

    LINKEDIN = "linkedin"
    COMPANY_SITE = "company_site"
    REFERRAL = "referral"
    JOB_BOARD = "job_board"
    RECRUITER = "recruiter"
    OTHER = "other"


class JobApplication(Base):  # type: ignore
    """Model representing a job application."""

    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    company = Column(String, index=True, nullable=False)
    position_title = Column(String, nullable=False)
    current_stage = Column(
        Enum(ApplicationStage), default=ApplicationStage.RESUME_SCREENING, index=True
    )
    status = Column(
        Enum(ApplicationStatus), default=ApplicationStatus.PENDING, index=True
    )
    application_date = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), index=True
    )
    rejection_reason = Column(String, nullable=True)
    job_url = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    salary_min = Column(Float, nullable=True)
    salary_max = Column(Float, nullable=True)
    location = Column(String, nullable=True)
    application_source = Column(
        Enum(ApplicationSource), default=ApplicationSource.OTHER, index=True
    )
    follow_up_date = Column(DateTime, nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), index=True
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<JobApplication(id={self.id}, company={self.company}, position={self.position_title})>"


def init_db() -> None:
    """Initialize database and create all tables."""
    try:
        Base.metadata.create_all(bind=engine)
        print(f"✓ Database initialized successfully at {DB_HOST}:{DB_PORT}/{DB_NAME}")
    except Exception as e:
        print(f"⚠ Warning: Could not initialize database: {e}")
        print(
            f"  Attempted connection: postgresql://{DB_USER}:***@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        )
        print("  Make sure PostgreSQL is running and accessible.")
        raise
