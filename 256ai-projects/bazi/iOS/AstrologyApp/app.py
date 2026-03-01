"""
Bazi Four Pillars App - FastAPI Application

A bilingual (English/Chinese) personalized daily content app using
Bazi (Four Pillars of Destiny / 八字) Chinese metaphysics system.
"""

import json
import logging
from datetime import date, time, datetime
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from models import Base, engine, get_db, User, DailyReading, WeeklyReading, SubscriptionPlan, UserSubscription
from agents import BaziCalculator, DailyEnergyAgent, NarrativeAgent
from agents.template_engine import TemplateEngine
from tasks import start_scheduler, shutdown_scheduler, run_daily_generation_job
from services import SubscriptionService
from auth import get_current_user
from tasks.scheduler import (
    generate_daily_reading_for_user,
    generate_weekly_reading_for_user,
    run_weekly_generation_job,
    get_current_week_start,
)
from routers import auth_router, admin_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("bazi_app")


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Bazi Four Pillars App...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified.")
    start_scheduler()
    yield
    # Shutdown
    shutdown_scheduler()
    logger.info("App shutdown complete.")


# Rate limiter setup
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI app
app = FastAPI(
    title="Bazi Four Pillars App",
    description="Personalized daily readings based on Chinese Bazi (Four Pillars of Destiny) astrology",
    version="1.0.0",
    lifespan=lifespan,
)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests for monitoring dashboard."""
    import time
    from models import SessionLocal
    from models.system_health import RequestLog

    start_time = time.time()
    response = await call_next(request)
    duration_ms = int((time.time() - start_time) * 1000)

    # Skip logging for health checks and static files
    path = request.url.path
    if path in ["/", "/docs", "/openapi.json", "/redoc"] or path.startswith("/static"):
        return response

    # Log to database (async-safe)
    try:
        db = SessionLocal()
        try:
            error_msg = None
            if response.status_code >= 400:
                error_msg = f"HTTP {response.status_code}"

            log_entry = RequestLog(
                endpoint=path,
                method=request.method,
                status_code=response.status_code,
                response_time_ms=duration_ms,
                ip_address=request.client.host if request.client else None,
                error_message=error_msg
            )
            db.add(log_entry)
            db.commit()
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"Failed to log request: {e}")

    return response


# Include authentication router
app.include_router(auth_router)

# Include admin router
app.include_router(admin_router)


# ============== Pydantic Models ==============

class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    birth_date: date
    birth_time: time
    birth_longitude: Optional[float] = Field(None, ge=-180, le=180)
    birth_latitude: Optional[float] = Field(None, ge=-90, le=90)
    birth_location: Optional[str] = Field(None, max_length=200)
    preferred_tone: Optional[str] = Field("balanced", pattern="^(balanced|gentle|direct|motivational)$")
    language: Optional[str] = Field("en", pattern="^(en|zh)$")


class UserUpdate(BaseModel):
    preferred_tone: Optional[str] = Field(None, pattern="^(balanced|gentle|direct|motivational)$")
    language: Optional[str] = Field(None, pattern="^(en|zh)$")


class UserResponse(BaseModel):
    id: int
    name: str
    birth_date: date
    birth_time: time
    birth_location: Optional[str]

    # Four Pillars
    year_pillar: Optional[str]
    month_pillar: Optional[str]
    day_pillar: Optional[str]
    hour_pillar: Optional[str]

    # Day Master
    day_master: Optional[str]
    day_master_element: Optional[str]
    day_master_polarity: Optional[str]

    # Ten Gods
    year_ten_god: Optional[str]
    month_ten_god: Optional[str]
    hour_ten_god: Optional[str]

    # Preferences
    preferred_tone: str
    language: str

    class Config:
        from_attributes = True


class DailyReadingResponse(BaseModel):
    user_id: int
    date: date
    daily_pillar: Optional[str]
    daily_element: Optional[str]
    content: str
    template_id: Optional[str] = None
    generation_method: Optional[str] = None
    generated_at: datetime

    class Config:
        from_attributes = True


class WeeklyReadingResponse(BaseModel):
    user_id: int
    week_start: date
    week_end: date
    content: str
    llm_provider: Optional[str] = None
    generated_at: datetime

    class Config:
        from_attributes = True


class PillarInfo(BaseModel):
    date: str
    pillar: str
    stem: str
    branch: str
    element: str
    polarity: str


# ============== API Endpoints ==============

@app.get("/")
async def root():
    """Health check and welcome message."""
    return {
        "message": "Bazi Four Pillars App",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# ---------- User Endpoints ----------

@app.post("/users", response_model=UserResponse)
async def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user with birth data.
    Automatically calculates Bazi Four Pillars.
    """
    # Calculate Bazi
    calculator = BaziCalculator()
    bazi = calculator.calculate(
        birth_date=user_in.birth_date,
        birth_time=user_in.birth_time,
        longitude=user_in.birth_longitude,
    )

    # Create user
    user = User(
        name=user_in.name,
        birth_date=user_in.birth_date,
        birth_time=user_in.birth_time,
        birth_longitude=user_in.birth_longitude,
        birth_latitude=user_in.birth_latitude,
        birth_location=user_in.birth_location,
        preferred_tone=user_in.preferred_tone or "balanced",
        language=user_in.language or "en",

        # Four Pillars
        year_pillar=bazi.year_pillar,
        month_pillar=bazi.month_pillar,
        day_pillar=bazi.day_pillar,
        hour_pillar=bazi.hour_pillar,

        # Stems and Branches
        year_stem=bazi.year_stem,
        year_branch=bazi.year_branch,
        month_stem=bazi.month_stem,
        month_branch=bazi.month_branch,
        day_stem=bazi.day_stem,
        day_branch=bazi.day_branch,
        hour_stem=bazi.hour_stem,
        hour_branch=bazi.hour_branch,

        # Day Master
        day_master=bazi.day_master,
        day_master_element=bazi.day_master_element,
        day_master_polarity=bazi.day_master_polarity,

        # Ten Gods
        year_ten_god=bazi.year_ten_god,
        month_ten_god=bazi.month_ten_god,
        hour_ten_god=bazi.hour_ten_god,

        # Element counts
        element_counts=json.dumps(bazi.element_counts),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    logger.info(f"Created user {user.id}: {user.name} (Day Master: {user.day_master})")
    return user


@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user profile with Bazi data."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    """Update user preferences (tone, language)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_update.preferred_tone is not None:
        user.preferred_tone = user_update.preferred_tone
    if user_update.language is not None:
        user.language = user_update.language

    db.commit()
    db.refresh(user)
    return user


@app.get("/users", response_model=List[UserResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """List all users."""
    users = db.query(User).offset(skip).limit(limit).all()
    return users


# ---------- Daily Reading Endpoints ----------

@app.get("/daily/{user_id}")
async def get_daily_reading(
    user_id: int,
    language: Optional[str] = Query(None, pattern="^(en|zh)$"),
    db: Session = Depends(get_db)
):
    """
    Get today's reading for a user.
    If no reading exists, generates one on-demand.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    today = date.today()
    lang = language or user.language

    # Check for existing reading
    reading = db.query(DailyReading).filter_by(user_id=user_id, date=today).first()

    if not reading:
        # Generate on-demand using templates (FREE)
        logger.info(f"Generating on-demand reading for user {user_id} (using templates - FREE)")
        reading = generate_daily_reading_for_user(user, today)

        if not reading:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate daily reading. Check API key configuration."
            )

        db.add(reading)
        db.commit()
        db.refresh(reading)

    # Return content in requested language
    content = reading.content_zh if lang == "zh" else reading.content_en
    if not content:
        content = reading.content_en or reading.content_zh or "Content not available"

    return {
        "user_id": user_id,
        "user_name": user.name,
        "date": today.isoformat(),
        "daily_pillar": reading.daily_pillar,
        "daily_element": reading.daily_element,
        "content": content,
        "language": lang,
        "template_id": reading.template_id,
        "generation_method": reading.generation_method,
        "generated_at": reading.created_at.isoformat(),
    }


@app.get("/daily/{user_id}/{target_date}")
async def get_reading_for_date(
    user_id: int,
    target_date: date,
    language: Optional[str] = Query(None, pattern="^(en|zh)$"),
    db: Session = Depends(get_db)
):
    """Get reading for a specific date."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    lang = language or user.language

    # Check for existing reading
    reading = db.query(DailyReading).filter_by(user_id=user_id, date=target_date).first()

    if not reading:
        # Check if this is a future date
        if target_date > date.today():
            # Check if user has future date entitlement
            sub_service = SubscriptionService(db)
            status = sub_service.get_user_subscription_status(user_id)
            has_future_access = status.get('has_future_7_day', False) or status.get('has_premium_annual', False)

            # Only allow up to 7 days in the future
            days_ahead = (target_date - date.today()).days
            if not has_future_access:
                raise HTTPException(status_code=400, detail="Future readings require premium access")
            if days_ahead > 7:
                raise HTTPException(status_code=400, detail="Cannot generate readings more than 7 days ahead")

        logger.info(f"Generating reading for user {user_id} on {target_date} (using templates - FREE)")
        reading = generate_daily_reading_for_user(user, target_date)

        if not reading:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate daily reading"
            )

        db.add(reading)
        db.commit()
        db.refresh(reading)

    content = reading.content_zh if lang == "zh" else reading.content_en
    if not content:
        content = reading.content_en or reading.content_zh or "Content not available"

    return {
        "user_id": user_id,
        "user_name": user.name,
        "date": target_date.isoformat(),
        "daily_pillar": reading.daily_pillar,
        "daily_element": reading.daily_element,
        "content": content,
        "language": lang,
        "generated_at": reading.created_at.isoformat(),
    }


@app.post("/daily/{user_id}/regenerate")
async def regenerate_reading(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Force regenerate today's reading for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    today = date.today()

    # Delete existing reading if any
    db.query(DailyReading).filter_by(user_id=user_id, date=today).delete()
    db.commit()

    # Generate new reading using templates (FREE)
    reading = generate_daily_reading_for_user(user, today)

    if not reading:
        raise HTTPException(
            status_code=500,
            detail="Failed to regenerate daily reading"
        )

    db.add(reading)
    db.commit()
    db.refresh(reading)

    return {
        "message": "Reading regenerated successfully",
        "user_id": user_id,
        "date": today.isoformat(),
        "daily_pillar": reading.daily_pillar,
    }


# ---------- Weekly Reading Endpoints ----------

@app.get("/weekly/{user_id}")
async def get_weekly_reading(
    user_id: int,
    language: Optional[str] = Query(None, pattern="^(en|zh)$"),
    db: Session = Depends(get_db)
):
    """
    Get this week's AI-generated reading for a user.
    If no reading exists, generates one on-demand using Ollama (FREE).
    """
    from datetime import timedelta

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    week_start = get_current_week_start()
    week_end = week_start + timedelta(days=6)
    lang = language or user.language

    # Check for existing reading
    reading = db.query(WeeklyReading).filter_by(
        user_id=user_id,
        week_start=week_start
    ).first()

    if not reading:
        # Generate on-demand using Ollama (FREE)
        logger.info(f"Generating on-demand weekly reading for user {user_id} (using Ollama - FREE)")
        reading = generate_weekly_reading_for_user(user, week_start)

        if not reading:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate weekly reading. Ensure Ollama is running or check OpenAI key."
            )

        db.add(reading)
        db.commit()
        db.refresh(reading)

    # Return content in requested language
    content = reading.content_zh if lang == "zh" else reading.content_en
    if not content:
        content = reading.content_en or reading.content_zh or "Content not available"

    return {
        "user_id": user_id,
        "user_name": user.name,
        "week_start": week_start.isoformat(),
        "week_end": week_end.isoformat(),
        "content": content,
        "language": lang,
        "llm_provider": reading.llm_provider,
        "generated_at": reading.created_at.isoformat(),
    }


@app.post("/weekly/{user_id}/regenerate")
async def regenerate_weekly_reading(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Force regenerate this week's reading for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    week_start = get_current_week_start()

    # Delete existing reading if any
    db.query(WeeklyReading).filter_by(user_id=user_id, week_start=week_start).delete()
    db.commit()

    # Generate new reading using Ollama (FREE)
    reading = generate_weekly_reading_for_user(user, week_start)

    if not reading:
        raise HTTPException(
            status_code=500,
            detail="Failed to regenerate weekly reading"
        )

    db.add(reading)
    db.commit()
    db.refresh(reading)

    return {
        "message": "Weekly reading regenerated successfully",
        "user_id": user_id,
        "week_start": week_start.isoformat(),
        "llm_provider": reading.llm_provider,
    }


# ---------- Utility Endpoints ----------

@app.get("/pillars/{target_date}", response_model=PillarInfo)
async def get_pillar_for_date(target_date: date):
    """Get the day pillar for any date (no user context needed)."""
    calculator = BaziCalculator()
    pillar_info = calculator.get_pillar_for_date(target_date)
    return pillar_info


@app.get("/pillars")
async def get_today_pillar():
    """Get today's pillar."""
    calculator = BaziCalculator()
    return calculator.get_pillar_for_date(date.today())


# ---------- Subscription Endpoints (for mobile app) ----------

@app.get("/subscription/status")
async def get_my_subscription_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's subscription status.
    This is the endpoint the mobile app should call to check premium access.
    """
    sub_service = SubscriptionService(db)
    status = sub_service.get_user_subscription_status(current_user.id)
    return status


@app.get("/subscription/plans")
async def get_available_plans(db: Session = Depends(get_db)):
    """
    Get available subscription plans (public endpoint for displaying prices).
    """
    sub_service = SubscriptionService(db)
    return {"plans": sub_service.get_all_plans()}


@app.post("/admin/trigger-daily-job")
async def trigger_daily_job():
    """
    Manually trigger the daily generation job (admin endpoint).
    Generates readings for all users who don't have one for today.
    Uses templates (FREE - no LLM cost).
    """
    run_daily_generation_job()
    return {"message": "Daily generation job triggered (using templates - FREE)"}


@app.post("/admin/trigger-weekly-job")
async def trigger_weekly_job():
    """
    Manually trigger the weekly generation job (admin endpoint).
    Generates weekly readings for all users using Ollama (FREE).
    """
    run_weekly_generation_job()
    return {"message": "Weekly generation job triggered (using Ollama - FREE)"}


# ============== Run with Uvicorn ==============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
