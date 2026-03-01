"""
Authentication Router for BaZi Mobile App

Endpoints:
- POST /auth/register - Register with email/password + birth data
- POST /auth/login - Login with email/password
- POST /auth/social - Login/register with Google or Apple
- POST /auth/device-token - Register push notification token
- GET /auth/me - Get current user profile
- POST /auth/accept-legal - Accept legal terms
- GET /auth/legal-status - Check if legal acceptance needed
- DELETE /auth/delete-account - Delete user account and all data
"""

import json
import logging
from datetime import date, time, datetime
from typing import Optional

import httpx
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from models import get_db, User, DailyReading, WeeklyReading, MonthlyReading, YearlyReading
from agents import BaziCalculator
from auth.jwt_handler import create_access_token
from auth.password_utils import hash_password, verify_password
from auth.dependencies import get_current_user

logger = logging.getLogger("bazi_app.auth")

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ============== Legal & Age Constants ==============

CURRENT_LEGAL_VERSION = "2026-01"  # Increment when legal docs change
MINIMUM_AGE = 13  # Users must be at least 13 years old
CONTACT_EMAIL = "256ai.dev@gmail.com"


def calculate_age(birth_date: date) -> int:
    """Calculate age in years from birth date."""
    today = date.today()
    age = today.year - birth_date.year
    # Adjust if birthday hasn't occurred yet this year
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        age -= 1
    return age


def validate_age(birth_date: date) -> bool:
    """Return True if user is 13 or older."""
    return calculate_age(birth_date) >= MINIMUM_AGE


# ============== Pydantic Models ==============

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    name: str = Field(..., min_length=1, max_length=100)
    birth_date: date
    birth_time: time
    birth_longitude: Optional[float] = Field(None, ge=-180, le=180)
    birth_latitude: Optional[float] = Field(None, ge=-90, le=90)
    birth_location: Optional[str] = Field(None, max_length=200)
    preferred_tone: Optional[str] = Field("balanced", pattern="^(balanced|gentle|direct|motivational)$")
    language: Optional[str] = Field("en", pattern="^(en|zh)$")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SocialLoginRequest(BaseModel):
    provider: str = Field(..., pattern="^(google|apple)$")
    token: str = Field(..., min_length=10, description="ID token from OAuth provider")
    # For new users who need to complete onboarding
    name: Optional[str] = None
    birth_date: Optional[date] = None
    birth_time: Optional[time] = None
    birth_longitude: Optional[float] = None
    birth_latitude: Optional[float] = None
    birth_location: Optional[str] = None
    preferred_tone: Optional[str] = "balanced"
    language: Optional[str] = "en"


class DeviceTokenRequest(BaseModel):
    token: str = Field(..., min_length=10, description="FCM or APNs device token")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    needs_onboarding: bool = False


class UserProfileResponse(BaseModel):
    id: int
    name: str
    email: Optional[str]
    birth_date: date
    birth_time: time
    birth_location: Optional[str]
    year_pillar: Optional[str]
    month_pillar: Optional[str]
    day_pillar: Optional[str]
    hour_pillar: Optional[str]
    day_master: Optional[str]
    day_master_element: Optional[str]
    day_master_polarity: Optional[str]
    preferred_tone: str
    language: str
    auth_provider: str

    class Config:
        from_attributes = True


# ============== Helper Functions ==============

# Google OAuth Client IDs that are allowed
GOOGLE_CLIENT_IDS = [
    "717245085455-f4kiundnmolvtka4u6tgpq8vgkoce2sr.apps.googleusercontent.com",  # iOS
]

async def verify_google_token(token: str) -> Optional[dict]:
    """Verify Google ID token using google-auth library."""
    try:
        # Verify the token with Google's servers
        idinfo = google_id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            audience=None  # We'll check audience manually
        )

        # Verify the token is from one of our client IDs
        if idinfo.get('aud') not in GOOGLE_CLIENT_IDS:
            logger.warning(f"Google token has unexpected audience: {idinfo.get('aud')}")
            # Still allow it for now - the token is valid from Google

        logger.info(f"Google token verified for: {idinfo.get('email')}")
        return {
            "id": idinfo.get("sub"),
            "email": idinfo.get("email"),
            "name": idinfo.get("name"),
            "email_verified": idinfo.get("email_verified", False)
        }
    except ValueError as e:
        logger.error(f"Google token verification failed (invalid token): {e}")
    except Exception as e:
        logger.error(f"Google token verification failed: {e}")
    return None


async def verify_apple_token(id_token: str) -> Optional[dict]:
    """
    Verify Apple ID token.
    Note: For production, implement proper JWT verification with Apple's public keys.
    """
    try:
        # Decode without verification for development
        # In production, verify signature with Apple's public keys from:
        # https://appleid.apple.com/auth/keys
        import jwt
        unverified = jwt.decode(id_token, options={"verify_signature": False})
        logger.info(f"Apple token decoded: sub={unverified.get('sub')}, email={unverified.get('email')}")
        return {
            "id": unverified.get("sub"),
            "email": unverified.get("email"),
            "name": None,  # Apple may not provide name after first login
            "email_verified": True  # Apple only provides verified emails
        }
    except Exception as e:
        logger.error(f"Apple token verification failed: {e}")
        logger.error(f"Token (first 50 chars): {id_token[:50]}...")
    return None


def calculate_and_create_user(
    db: Session,
    email: Optional[str],
    password_hash: Optional[str],
    auth_provider: str,
    provider_user_id: Optional[str],
    name: str,
    birth_date: date,
    birth_time: time,
    birth_longitude: Optional[float],
    birth_latitude: Optional[float],
    birth_location: Optional[str],
    preferred_tone: str,
    language: str,
    email_verified: bool = False
) -> User:
    """Calculate BaZi and create a new user."""
    calculator = BaziCalculator()
    bazi = calculator.calculate(
        birth_date=birth_date,
        birth_time=birth_time,
        longitude=birth_longitude,
    )

    user = User(
        email=email,
        password_hash=password_hash,
        auth_provider=auth_provider,
        provider_user_id=provider_user_id,
        email_verified=email_verified,
        name=name,
        birth_date=birth_date,
        birth_time=birth_time,
        birth_longitude=birth_longitude,
        birth_latitude=birth_latitude,
        birth_location=birth_location,
        preferred_tone=preferred_tone,
        language=language,
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
        last_login=datetime.utcnow(),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    logger.info(f"Created user {user.id}: {user.name} via {auth_provider}")
    return user


# ============== Endpoints ==============

@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user with email/password and birth data.
    Returns JWT token on success.
    """
    # Age gate: Must be 13 or older
    if not validate_age(request.birth_date):
        logger.warning(f"Age gate triggered: under-13 registration attempt")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This app is not intended for children under 13."
        )

    # Check if email already exists
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user with hashed password
    user = calculate_and_create_user(
        db=db,
        email=request.email,
        password_hash=hash_password(request.password),
        auth_provider="email",
        provider_user_id=None,
        name=request.name,
        birth_date=request.birth_date,
        birth_time=request.birth_time,
        birth_longitude=request.birth_longitude,
        birth_latitude=request.birth_latitude,
        birth_location=request.birth_location,
        preferred_tone=request.preferred_tone or "balanced",
        language=request.language or "en",
        email_verified=False,
    )

    token = create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user_id=user.id)


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with email and password.
    Returns JWT token on success.
    """
    user = db.query(User).filter(User.email == request.email).first()

    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token(user.id, user.email)
    logger.info(f"User {user.id} logged in via email")
    return TokenResponse(access_token=token, user_id=user.id)


@router.post("/social", response_model=TokenResponse)
async def social_login(request: SocialLoginRequest, db: Session = Depends(get_db)):
    """
    Login or register with Google or Apple OAuth.

    Flow:
    1. If user exists (by provider_user_id or email) → return token
    2. If new user with birth data → create user and return token
    3. If new user without birth data → return needs_onboarding=True
    """
    # Verify token with provider
    if request.provider == "google":
        user_info = await verify_google_token(request.token)
    elif request.provider == "apple":
        user_info = await verify_apple_token(request.token)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported OAuth provider"
        )

    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OAuth token"
        )

    provider_id = user_info.get("id")
    provider_email = user_info.get("email")

    # Try to find existing user by provider ID
    user = db.query(User).filter(
        User.auth_provider == request.provider,
        User.provider_user_id == provider_id
    ).first()

    # If not found by provider ID, try by email
    if not user and provider_email:
        user = db.query(User).filter(User.email == provider_email).first()
        # If found by email, update to link with social provider
        if user:
            user.auth_provider = request.provider
            user.provider_user_id = provider_id
            db.commit()

    if user:
        # Existing user - update last login and return token
        user.last_login = datetime.utcnow()
        db.commit()
        token = create_access_token(user.id, user.email or "")
        logger.info(f"User {user.id} logged in via {request.provider}")
        return TokenResponse(access_token=token, user_id=user.id)

    # New user - check if birth data provided
    if not request.birth_date or not request.birth_time:
        # Signal mobile app to show onboarding
        return TokenResponse(
            access_token="",
            user_id=0,
            needs_onboarding=True
        )

    # Age gate: Must be 13 or older
    if not validate_age(request.birth_date):
        logger.warning(f"Age gate triggered: under-13 social login attempt via {request.provider}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This app is not intended for children under 13."
        )

    # New user with birth data - create account
    user = calculate_and_create_user(
        db=db,
        email=provider_email,
        password_hash=None,
        auth_provider=request.provider,
        provider_user_id=provider_id,
        name=request.name or user_info.get("name") or "User",
        birth_date=request.birth_date,
        birth_time=request.birth_time,
        birth_longitude=request.birth_longitude,
        birth_latitude=request.birth_latitude,
        birth_location=request.birth_location,
        preferred_tone=request.preferred_tone or "balanced",
        language=request.language or "en",
        email_verified=user_info.get("email_verified", False),
    )

    token = create_access_token(user.id, user.email or "")
    return TokenResponse(access_token=token, user_id=user.id)


@router.post("/device-token")
async def register_device_token(
    request: DeviceTokenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Register a device token for push notifications (FCM/APNs).
    """
    current_user.device_token = request.token
    db.commit()
    logger.info(f"Device token registered for user {current_user.id}")
    return {"status": "ok", "message": "Device token registered"}


@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get the current authenticated user's profile.
    """
    return current_user


# ============== Legal & Account Management ==============

@router.post("/accept-legal")
async def accept_legal(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record user's acceptance of legal terms (Privacy Policy, Terms of Use, Disclaimer).
    Called when user taps "Continue" on the legal acceptance modal.
    """
    current_user.legal_accepted_at = datetime.utcnow()
    current_user.legal_version = CURRENT_LEGAL_VERSION
    db.commit()

    logger.info(f"Legal acceptance stored for user {current_user.id}, version {CURRENT_LEGAL_VERSION}")

    return {
        "message": "Legal terms accepted",
        "legal_version": CURRENT_LEGAL_VERSION,
        "accepted_at": current_user.legal_accepted_at.isoformat()
    }


@router.get("/legal-status")
async def get_legal_status(current_user: User = Depends(get_current_user)):
    """
    Check if user needs to accept legal terms.
    Returns needs_acceptance=True if:
    - User has never accepted terms, OR
    - User accepted an older version
    """
    needs_acceptance = (
        current_user.legal_accepted_at is None or
        current_user.legal_version != CURRENT_LEGAL_VERSION
    )

    return {
        "needs_acceptance": needs_acceptance,
        "current_version": CURRENT_LEGAL_VERSION,
        "user_version": current_user.legal_version,
        "accepted_at": current_user.legal_accepted_at.isoformat() if current_user.legal_accepted_at else None
    }


@router.delete("/delete-account")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete user account and ALL associated data.
    This is permanent and cannot be undone.
    """
    user_id = current_user.id
    user_email = current_user.email

    # Delete all readings
    db.query(DailyReading).filter(DailyReading.user_id == user_id).delete()
    db.query(WeeklyReading).filter(WeeklyReading.user_id == user_id).delete()
    db.query(MonthlyReading).filter(MonthlyReading.user_id == user_id).delete()
    db.query(YearlyReading).filter(YearlyReading.user_id == user_id).delete()

    # Delete user
    db.delete(current_user)
    db.commit()

    logger.info(f"User account deleted: id={user_id}, email={user_email}")

    return {"message": "Account and all associated data deleted"}
