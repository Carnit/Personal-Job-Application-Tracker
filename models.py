from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Enum
from datetime import datetime, timezone
import enum
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from database import Base


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


class JobApplication(Base):
    """Model representing a job application."""

    __tablename__ = "job_applications"

    id: Column = Column(Integer, primary_key=True, index=True)
    company: Column = Column(String, index=True, nullable=False)
    position_title: Column = Column(String, nullable=False)
    current_stage: Column = Column(
        Enum(ApplicationStage), default=ApplicationStage.RESUME_SCREENING, index=True
    )
    status: Column = Column(
        Enum(ApplicationStatus), default=ApplicationStatus.PENDING, index=True
    )
    application_date: Column = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), index=True
    )
    rejection_reason: Column = Column(String, nullable=True)
    job_url: Column = Column(String, nullable=True)
    notes: Column = Column(Text, nullable=True)
    salary_min: Column = Column(Float, nullable=True)
    salary_max: Column = Column(Float, nullable=True)
    location: Column = Column(String, nullable=True)
    application_source: Column = Column(
        Enum(ApplicationSource), default=ApplicationSource.OTHER, index=True
    )
    follow_up_date: Column = Column(DateTime, nullable=True)
    created_at: Column = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), index=True
    )
    updated_at: Column = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<JobApplication(id={self.id}, company={self.company}, position={self.position_title})>"


# Pydantic Models
class JobApplicationBase(BaseModel):
    """Base model for job application."""

    company: str = Field(..., min_length=1, max_length=255)
    position_title: str = Field(..., min_length=1, max_length=255)
    current_stage: ApplicationStage = ApplicationStage.RESUME_SCREENING
    status: ApplicationStatus = ApplicationStatus.PENDING
    application_date: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    rejection_reason: Optional[str] = None
    job_url: Optional[str] = None
    notes: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    location: Optional[str] = None
    application_source: ApplicationSource = ApplicationSource.OTHER
    follow_up_date: Optional[datetime] = None


class JobApplicationCreate(JobApplicationBase):
    """Model for creating a job application."""

    pass


class JobApplicationUpdate(BaseModel):
    """Model for updating a job application."""

    company: Optional[str] = None
    position_title: Optional[str] = None
    current_stage: Optional[ApplicationStage] = None
    status: Optional[ApplicationStatus] = None
    rejection_reason: Optional[str] = None
    job_url: Optional[str] = None
    notes: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    location: Optional[str] = None
    application_source: Optional[ApplicationSource] = None
    follow_up_date: Optional[datetime] = None


class JobApplicationResponse(JobApplicationBase):
    """Response model for job application."""

    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnalyticsOverviewResponse(BaseModel):
    """Analytics overview response."""

    total_applications: int
    active_applications: int
    rejection_rate: float
    interview_conversion_rate: float
    average_response_time_days: float
    offers_received: int
    applications_by_stage: dict
    applications_by_source: dict
    top_rejecting_companies: list


class RejectionAnalysisResponse(BaseModel):
    """Rejection analysis response."""

    rejections_by_stage: dict
    rejections_by_company: dict
    total_rejections: int
    rejection_rate: float


class PredictionResponse(BaseModel):
    """ML prediction response."""

    success_probability: float
    confidence: float
    recommendations: List[str]
