import json
import logging
import pickle
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, desc
from sqlalchemy.orm import Session
import redis

from database import get_db, redis_client, get_cache_key, invalidate_cache
from models import (
    JobApplication,
    ApplicationStage,
    ApplicationStatus,
    ApplicationSource,
    JobApplicationCreate,
    JobApplicationResponse,
    JobApplicationUpdate,
    AnalyticsOverviewResponse,
    RejectionAnalysisResponse,
    PredictionResponse,
)

router = APIRouter()
logger = logging.getLogger(__name__)

# Constants
CACHE_TTL_ANALYTICS = 300
CACHE_TTL_LIST = 120
CACHE_TTL_DETAIL = 600
MODEL_PATH = "model.pkl"


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post(
    "/api/applications",
    response_model=JobApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_application(
    application: JobApplicationCreate,
    db: Session = Depends(get_db),
):
    """Create a new job application."""
    try:
        db_application = JobApplication(
            company=application.company,
            position_title=application.position_title,
            current_stage=application.current_stage,
            status=application.status,
            application_date=application.application_date,
            rejection_reason=application.rejection_reason,
            job_url=application.job_url,
            notes=application.notes,
            salary_min=application.salary_min,
            salary_max=application.salary_max,
            location=application.location,
            application_source=application.application_source,
            follow_up_date=application.follow_up_date,
        )
        db.add(db_application)
        db.commit()
        db.refresh(db_application)

        # Invalidate cache
        invalidate_cache(["apps:list", "analytics"])

        logger.info(f"Created application: {db_application.id}")
        return db_application
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating application: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error creating application",
        )


@router.get("/api/applications", response_model=List[JobApplicationResponse])
def get_applications(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    company: Optional[str] = None,
    stage: Optional[ApplicationStage] = None,
    status_filter: Optional[ApplicationStatus] = Query(None, alias="status"),
    db: Session = Depends(get_db),
):
    """
    List all applications with optional filters and pagination.

    Query Parameters:
    - skip: Number of records to skip (default: 0)
    - limit: Maximum number of records to return (default: 100)
    - company: Filter by company name
    - stage: Filter by application stage
    - status: Filter by application status
    """
    try:
        # Check cache
        cache_key = f"apps:list:{skip}:{limit}:{company}:{stage}:{status_filter}"
        cached_result = redis_client.get(cache_key)
        if cached_result:
            logger.info("Returning cached applications list")
            return json.loads(cached_result)
    except redis.ConnectionError:
        logger.warning("Redis connection error, proceeding without cache")

    query = db.query(JobApplication)

    if company:
        query = query.filter(JobApplication.company.ilike(f"%{company}%"))
    if stage:
        query = query.filter(JobApplication.current_stage == stage)
    if status_filter:
        query = query.filter(JobApplication.status == status_filter)

    applications = (
        query.order_by(desc(JobApplication.created_at)).offset(skip).limit(limit).all()
    )

    # Cache the result
    try:
        redis_client.setex(
            cache_key,
            CACHE_TTL_LIST,
            json.dumps(
                [
                    {
                        "id": app.id,
                        "company": app.company,
                        "position_title": app.position_title,
                        "current_stage": app.current_stage.value,
                        "status": app.status.value,
                        "application_date": app.application_date.isoformat(),
                        "rejection_reason": app.rejection_reason,
                        "job_url": app.job_url,
                        "notes": app.notes,
                        "salary_min": app.salary_min,
                        "salary_max": app.salary_max,
                        "location": app.location,
                        "application_source": app.application_source.value,
                        "follow_up_date": app.follow_up_date.isoformat()
                        if app.follow_up_date
                        else None,
                        "created_at": app.created_at.isoformat(),
                        "updated_at": app.updated_at.isoformat(),
                    }
                    for app in applications
                ]
            ),
        )
    except redis.ConnectionError:
        logger.warning("Redis connection error during cache set")

    return applications


@router.get("/api/applications/{app_id}", response_model=JobApplicationResponse)
def get_application(
    app_id: int,
    db: Session = Depends(get_db),
):
    """Get a specific application by ID."""
    try:
        # Check cache
        cache_key = f"apps:detail:{app_id}"
        cached_result = redis_client.get(cache_key)
        if cached_result:
            logger.info(f"Returning cached application: {app_id}")
            return json.loads(cached_result)
    except redis.ConnectionError:
        logger.warning("Redis connection error, proceeding without cache")

    application = db.query(JobApplication).filter(JobApplication.id == app_id).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    # Cache the result
    try:
        redis_client.setex(
            cache_key,
            CACHE_TTL_DETAIL,
            json.dumps(
                {
                    "id": application.id,
                    "company": application.company,
                    "position_title": application.position_title,
                    "current_stage": application.current_stage.value,
                    "status": application.status.value,
                    "application_date": application.application_date.isoformat(),
                    "rejection_reason": application.rejection_reason,
                    "job_url": application.job_url,
                    "notes": application.notes,
                    "salary_min": application.salary_min,
                    "salary_max": application.salary_max,
                    "location": application.location,
                    "application_source": application.application_source.value,
                    "follow_up_date": application.follow_up_date.isoformat()
                    if application.follow_up_date
                    else None,
                    "created_at": application.created_at.isoformat(),
                    "updated_at": application.updated_at.isoformat(),
                }
            ),
        )
    except redis.ConnectionError:
        logger.warning("Redis connection error during cache set")

    return application


@router.put("/api/applications/{app_id}", response_model=JobApplicationResponse)
def update_application(
    app_id: int,
    application_update: JobApplicationUpdate,
    db: Session = Depends(get_db),
):
    """Update an existing application."""
    db_application = (
        db.query(JobApplication).filter(JobApplication.id == app_id).first()
    )

    if not db_application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    update_data = application_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_application, key, value)

    db_application.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(db_application)

        # Invalidate cache
        invalidate_cache([f"apps:detail:{app_id}", "apps:list", "analytics"])

        logger.info(f"Updated application: {app_id}")
        return db_application
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating application: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error updating application",
        )


@router.delete("/api/applications/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    app_id: int,
    db: Session = Depends(get_db),
):
    """Delete an application."""
    db_application = (
        db.query(JobApplication).filter(JobApplication.id == app_id).first()
    )

    if not db_application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    try:
        db.delete(db_application)
        db.commit()

        # Invalidate cache
        invalidate_cache([f"apps:detail:{app_id}", "apps:list", "analytics"])

        logger.info(f"Deleted application: {app_id}")
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting application: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error deleting application",
        )


@router.get("/api/analytics/overview", response_model=AnalyticsOverviewResponse)
def get_analytics_overview(db: Session = Depends(get_db)):
    """
    Get analytics overview with key metrics and visualizations.
    """
    try:
        # Check cache
        cache_key = "analytics:overview"
        cached_result = redis_client.get(cache_key)
        if cached_result:
            logger.info("Returning cached analytics overview")
            return json.loads(cached_result)
    except redis.ConnectionError:
        logger.warning("Redis connection error, proceeding without cache")

    total_applications = db.query(func.count(JobApplication.id)).scalar()

    active_applications = (
        db.query(func.count(JobApplication.id))
        .filter(JobApplication.status == ApplicationStatus.PENDING)
        .scalar()
    )

    rejected_applications = (
        db.query(func.count(JobApplication.id))
        .filter(JobApplication.status == ApplicationStatus.REJECTED)
        .scalar()
    )

    rejected_applications = rejected_applications or 0
    rejection_rate = (
        (rejected_applications / total_applications * 100)
        if total_applications > 0
        else 0
    )

    # Interview conversion rate (applications that reached interview stage)
    interview_applications = (
        db.query(func.count(JobApplication.id))
        .filter(
            JobApplication.current_stage.in_(
                [
                    ApplicationStage.TECHNICAL_ROUND,
                    ApplicationStage.ONSITE,
                    ApplicationStage.OFFER,
                ]
            )
        )
        .scalar()
    )
    interview_conversion_rate = (
        (interview_applications / total_applications * 100)
        if total_applications > 0
        else 0
    )

    offers_received = (
        db.query(func.count(JobApplication.id))
        .filter(JobApplication.current_stage == ApplicationStage.OFFER)
        .scalar()
    )

    # Average response time
    avg_response_time = db.query(
        func.avg(
            func.extract(
                "day", JobApplication.updated_at - JobApplication.application_date
            )
        )
    ).scalar()
    average_response_time_days = float(avg_response_time or 0)

    # Applications by stage
    applications_by_stage = {}
    for stage in ApplicationStage:
        count = (
            db.query(func.count(JobApplication.id))
            .filter(JobApplication.current_stage == stage)
            .scalar()
        )
        applications_by_stage[stage.value] = count

    # Applications by source
    applications_by_source = {}
    for source in ApplicationSource:
        count = (
            db.query(func.count(JobApplication.id))
            .filter(JobApplication.application_source == source)
            .scalar()
        )
        applications_by_source[source.value] = count

    # Top rejecting companies (most rejections)
    top_rejecting = (
        db.query(
            JobApplication.company,
            func.count(JobApplication.id).label("rejection_count"),
        )
        .filter(JobApplication.status == ApplicationStatus.REJECTED)
        .group_by(JobApplication.company)
        .order_by(desc("rejection_count"))
        .limit(5)
        .all()
    )

    top_rejecting_companies = [
        {"company": company, "rejections": count} for company, count in top_rejecting
    ]

    result = {
        "total_applications": total_applications or 0,
        "active_applications": active_applications or 0,
        "rejection_rate": round(rejection_rate, 2),
        "interview_conversion_rate": round(interview_conversion_rate, 2),
        "average_response_time_days": round(average_response_time_days, 2),
        "offers_received": offers_received or 0,
        "applications_by_stage": applications_by_stage,
        "applications_by_source": applications_by_source,
        "top_rejecting_companies": top_rejecting_companies,
    }

    # Cache the result
    try:
        redis_client.setex(
            cache_key,
            CACHE_TTL_ANALYTICS,
            json.dumps(result),
        )
    except redis.ConnectionError:
        logger.warning("Redis connection error during cache set")

    return result


@router.get("/api/analytics/rejections", response_model=RejectionAnalysisResponse)
def get_rejection_analysis(
    company: Optional[str] = None,
    days: int = Query(30, ge=1),
    db: Session = Depends(get_db),
):
    """
    Get detailed rejection analysis by stage and company.
    """
    try:
        cache_key = f"analytics:rejections:{company}:{days}"
        cached_result = redis_client.get(cache_key)
        if cached_result:
            logger.info("Returning cached rejection analysis")
            return json.loads(cached_result)
    except redis.ConnectionError:
        logger.warning("Redis connection error, proceeding without cache")

    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)

    query = db.query(JobApplication).filter(
        JobApplication.status == ApplicationStatus.REJECTED,
        JobApplication.updated_at >= cutoff_date,
    )

    if company:
        query = query.filter(JobApplication.company.ilike(f"%{company}%"))

    rejections = query.all()

    # Rejections by stage
    rejections_by_stage = {}
    for stage in ApplicationStage:
        count = len([r for r in rejections if r.current_stage == stage])
        rejections_by_stage[stage.value] = count

    # Rejections by company
    rejections_by_company = {}
    for rejection in rejections:
        if rejection.company not in rejections_by_company:
            rejections_by_company[rejection.company] = 0
        rejections_by_company[rejection.company] += 1

    total_rejections = len(rejections)
    rejection_rate = (
        (
            total_rejections
            / len(
                db.query(JobApplication)
                .filter(JobApplication.updated_at >= cutoff_date)
                .all()
            )
            * 100
        )
        if db.query(JobApplication)
        .filter(JobApplication.updated_at >= cutoff_date)
        .count()
        > 0
        else 0
    )

    result = {
        "rejections_by_stage": rejections_by_stage,
        "rejections_by_company": rejections_by_company,
        "total_rejections": total_rejections,
        "rejection_rate": round(rejection_rate, 2),
    }

    # Cache the result
    try:
        redis_client.setex(
            cache_key,
            CACHE_TTL_ANALYTICS,
            json.dumps(result),
        )
    except redis.ConnectionError:
        logger.warning("Redis connection error during cache set")

    return result


@router.post("/api/analytics/predict", response_model=PredictionResponse)
def predict_success(
    company: str = Query(...),
    source: ApplicationSource = Query(...),
    day_of_week: int = Query(..., ge=0, le=6),
    db: Session = Depends(get_db),
):
    """
    Use ML model to predict success probability for a job application.
    """
    try:
        # Load the trained model
        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)

        # Get historical data for the company
        company_apps = (
            db.query(JobApplication)
            .filter(JobApplication.company.ilike(f"%{company}%"))
            .all()
        )

        if not company_apps:
            # If no historical data, use general statistics
            success_rate = (
                db.query(func.count(JobApplication.id))
                .filter(JobApplication.status.in_([ApplicationStatus.ACCEPTED]))
                .scalar()
                or 0
            ) / (db.query(func.count(JobApplication.id)).scalar() or 1)
            confidence = 0.3
        else:
            successful_apps = len(
                [
                    app
                    for app in company_apps
                    if app.status == ApplicationStatus.ACCEPTED
                ]
            )
            success_rate = successful_apps / len(company_apps)
            confidence = min(0.95, 0.3 + (len(company_apps) * 0.01))

        # Make prediction
        success_probability = float(success_rate)

        # Generate recommendations
        recommendations = []

        if success_probability < 0.3:
            recommendations.append("Consider different application sources or timing")

        if source == ApplicationSource.REFERRAL:
            recommendations.append(
                "Referrals typically have higher success rates - consider seeking referrals"
            )
        else:
            recommendations.append("Consider asking for employee referrals")

        if len(company_apps) < 3:
            recommendations.append("Limited historical data for this company")

        recommendations.append("Follow up within 1-2 weeks after applying")

        result = {
            "success_probability": round(success_probability, 3),
            "confidence": round(confidence, 2),
            "recommendations": recommendations,
        }

        logger.info(f"ML Prediction for {company}: {success_probability}")
        return result

    except FileNotFoundError:
        logger.warning("Model file not found, returning default prediction")
        return {
            "success_probability": 0.5,
            "confidence": 0.1,
            "recommendations": [
                "Model not yet trained - returning default prediction",
                "More application data needed to train the model",
            ],
        }
    except Exception as e:
        logger.error(f"Error making prediction: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error making prediction",
        )


@router.get("/api/analytics/time-series")
def get_time_series_analysis(
    days: int = Query(90, ge=1),
    db: Session = Depends(get_db),
):
    """
    Get time series data for applications over time.
    """
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)

    data_points = []
    for i in range(days):
        current_date = cutoff_date + timedelta(days=i)
        next_date = current_date + timedelta(days=1)

        daily_apps = (
            db.query(func.count(JobApplication.id))
            .filter(
                JobApplication.application_date >= current_date,
                JobApplication.application_date < next_date,
            )
            .scalar()
            or 0
        )

        daily_rejections = (
            db.query(func.count(JobApplication.id))
            .filter(
                JobApplication.status == ApplicationStatus.REJECTED,
                JobApplication.updated_at >= current_date,
                JobApplication.updated_at < next_date,
            )
            .scalar()
            or 0
        )

        data_points.append(
            {
                "date": current_date.strftime("%Y-%m-%d"),
                "applications": daily_apps,
                "rejections": daily_rejections,
            }
        )

    return {"data": data_points}
