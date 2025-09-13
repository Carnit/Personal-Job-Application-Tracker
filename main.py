# main.py
from fastapi import FastAPI, Depends, HTTPException, status  # noqa: F401
from sqlalchemy.orm import Session
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from database import SessionLocal, init_db, JobApplication  # type: ignore # to avoid import issues
from pydantic import BaseModel, Field  # noqa: F401
from datetime import datetime

# Initialize the database and create tables
init_db()

app = FastAPI()

# CORS settings
origins = [
    "http://localhost:5173",
]


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models for request and response validation
class JobApplicationBase(BaseModel):
    company: str
    role: str
    status: str = "Applied"
    date_applied: datetime = datetime.now()
    job_description: str
    link: str
    notes: str


class JobApplicationCreate(JobApplicationBase):
    pass


class JobApplicationResponse(JobApplicationBase):
    id: int
    date_applied: datetime

    class Config:
        from_attributes = True


# Dependency to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# API Endpoints
@app.get("/api/applications", response_model=List[JobApplicationResponse])
def get_applications(db: Session = Depends(get_db)):
    applications = db.query(JobApplication).all()
    return applications


@app.post("/api/applications",response_model=JobApplicationResponse,status_code=status.HTTP_201_CREATED,)
def create_application(application: JobApplicationCreate, db: Session = Depends(get_db)):
    db_application = JobApplication(
        company=application.company,
        role=application.role,
        status=application.status,
        date_applied=application.date_applied,
        job_description=application.job_description,
        link=application.link,
        notes=application.notes,
    )
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    return db_application


# Add more endpoints for PUT and DELETE as a practice exercise
@app.put("/api/applications/{application_id}", response_model=JobApplicationResponse)
def update_application(
    application_id: int,
    application: JobApplicationCreate,
    db: Session = Depends(get_db),
):
    db_application = (
        db.query(JobApplication).filter(JobApplication.id == application_id).first()
    )
    if not db_application:
        raise HTTPException(status_code=404, detail="Application not found")
    db_application.company = application.company # type: ignore
    db_application.role = application.role # type: ignore
    db_application.status = application.status # type: ignore
    db_application.date_applied = application.date_applied # type: ignore
    db_application.job_description = application.job_description # type: ignore
    db_application.link = application.link # type: ignore
    db_application.notes = application.notes # type: ignore
    db.commit()
    db.refresh(db_application)
    return db_application


@app.delete(
    "/api/applications/{application_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_application(application_id: int, db: Session = Depends(get_db)):
    db_application = (
        db.query(JobApplication).filter(JobApplication.id == application_id).first()
    )
    if not db_application:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(db_application)
    db.commit()
    return None
