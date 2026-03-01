"""
Admin Router for the Admin Console
Provides endpoints for user management, statistics, and administrative actions.
"""
import json
from datetime import datetime, date
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from models import get_db, User, AdminUser, AdminAuditLog, DailyReading, WeeklyReading, SubscriptionPlan, UserSubscription
from models.subscription import VALID_ENTITLEMENTS
from auth import (
    hash_password,
    verify_password,
    create_admin_token,
    get_current_admin,
    get_super_admin,
    get_client_ip,
)
from services import StatsService, SubscriptionService, FinancialService


router = APIRouter(prefix="/admin", tags=["Admin"])


# =============================================================================
# Pydantic Schemas
# =============================================================================

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: dict


class AdminProfileResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    is_active: bool
    created_at: Optional[datetime]
    last_login: Optional[datetime]


class CreateAdminRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "admin"


class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    language: Optional[str] = None
    preferred_tone: Optional[str] = None


class GrantPremiumRequest(BaseModel):
    duration_days: int = 30
    reason: Optional[str] = None


class UserListResponse(BaseModel):
    users: List[dict]
    total: int
    page: int
    per_page: int
    total_pages: int


class StatsOverviewResponse(BaseModel):
    total_users: int
    users_today: int
    users_this_week: int
    users_this_month: int
    active_users_7d: int
    total_daily_readings: int
    total_weekly_readings: int
    readings_today: int


class RetentionStatsResponse(BaseModel):
    dau: int
    wau: int
    mau: int
    dau_mau_ratio: float


# Subscription Schemas
class CreatePlanRequest(BaseModel):
    name: str
    duration_days: int
    price: float = 0.0
    description: Optional[str] = None


class UpdatePlanRequest(BaseModel):
    name: Optional[str] = None
    duration_days: Optional[int] = None
    price: Optional[float] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class GrantSubscriptionRequest(BaseModel):
    plan_id: Optional[int] = None
    duration_days: Optional[int] = None  # Custom duration if no plan
    reason: Optional[str] = None
    notes: Optional[str] = None
    entitlements: Optional[List[str]] = None  # List of features to grant


class CancelSubscriptionRequest(BaseModel):
    reason: Optional[str] = None


# =============================================================================
# Helper Functions
# =============================================================================

def log_admin_action(
    db: Session,
    admin_id: int,
    action: str,
    target_type: Optional[str] = None,
    target_id: Optional[int] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None
):
    """Log an admin action to the audit log."""
    log_entry = AdminAuditLog(
        admin_id=admin_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=json.dumps(details) if details else None,
        ip_address=ip_address,
    )
    db.add(log_entry)
    db.commit()


# =============================================================================
# Auth Endpoints
# =============================================================================

@router.post("/auth/login", response_model=AdminLoginResponse)
async def admin_login(
    request: AdminLoginRequest,
    req: Request,
    db: Session = Depends(get_db)
):
    """
    Authenticate an admin user and return a JWT token.
    """
    admin = db.query(AdminUser).filter(AdminUser.email == request.email).first()

    if not admin or not verify_password(request.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is disabled",
        )

    # Update last login
    admin.last_login = datetime.utcnow()
    db.commit()

    # Log the login
    log_admin_action(
        db=db,
        admin_id=admin.id,
        action="admin_login",
        ip_address=get_client_ip(req),
    )

    # Create token
    token = create_admin_token(admin.id, admin.email, admin.role)

    return AdminLoginResponse(
        access_token=token,
        admin={
            "id": admin.id,
            "email": admin.email,
            "name": admin.name,
            "role": admin.role,
        }
    )


@router.get("/auth/me", response_model=AdminProfileResponse)
async def get_admin_profile(admin: AdminUser = Depends(get_current_admin)):
    """Get the current admin's profile."""
    return AdminProfileResponse(
        id=admin.id,
        email=admin.email,
        name=admin.name,
        role=admin.role,
        is_active=admin.is_active,
        created_at=admin.created_at,
        last_login=admin.last_login,
    )


@router.post("/auth/create-admin", response_model=AdminProfileResponse)
async def create_admin(
    request: CreateAdminRequest,
    req: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_super_admin)
):
    """
    Create a new admin user. Requires super_admin role.
    """
    # Check if email already exists
    existing = db.query(AdminUser).filter(AdminUser.email == request.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create admin user
    admin = AdminUser(
        email=request.email,
        password_hash=hash_password(request.password),
        name=request.name,
        role=request.role,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    # Log the action
    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="admin_created",
        target_type="admin_user",
        target_id=admin.id,
        details={"email": admin.email, "role": admin.role},
        ip_address=get_client_ip(req),
    )

    return AdminProfileResponse(
        id=admin.id,
        email=admin.email,
        name=admin.name,
        role=admin.role,
        is_active=admin.is_active,
        created_at=admin.created_at,
        last_login=admin.last_login,
    )


# =============================================================================
# User Management Endpoints
# =============================================================================

@router.get("/users", response_model=UserListResponse)
async def list_users(
    query: Optional[str] = Query(None, description="Search by name or email"),
    auth_provider: Optional[str] = Query(None, description="Filter by auth provider"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """
    List all users with pagination and search.
    """
    stats_service = StatsService(db)
    result = stats_service.search_users(
        query=query,
        auth_provider=auth_provider,
        page=page,
        per_page=per_page
    )
    return UserListResponse(**result)


@router.get("/users/{user_id}")
async def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """
    Get detailed information about a specific user.
    """
    stats_service = StatsService(db)
    result = stats_service.get_user_detail(user_id)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return result


@router.patch("/users/{user_id}")
async def update_user(
    user_id: int,
    request: UpdateUserRequest,
    req: Request,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """
    Update a user's information.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    changes = {}

    if request.name is not None:
        changes["name"] = {"old": user.name, "new": request.name}
        user.name = request.name

    if request.email is not None:
        # Check for duplicate email
        existing = db.query(User).filter(
            User.email == request.email,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use",
            )
        changes["email"] = {"old": user.email, "new": request.email}
        user.email = request.email

    if request.language is not None:
        changes["language"] = {"old": user.language, "new": request.language}
        user.language = request.language

    if request.preferred_tone is not None:
        changes["preferred_tone"] = {"old": user.preferred_tone, "new": request.preferred_tone}
        user.preferred_tone = request.preferred_tone

    if changes:
        user.updated_at = datetime.utcnow()
        db.commit()

        # Log the action
        log_admin_action(
            db=db,
            admin_id=admin.id,
            action="user_updated",
            target_type="user",
            target_id=user_id,
            details=changes,
            ip_address=get_client_ip(req),
        )

    return {"message": "User updated successfully", "changes": changes}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    req: Request,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_super_admin)
):
    """
    Delete a user and all their data. Requires super_admin role.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Store user info for logging before deletion
    user_info = {"email": user.email, "name": user.name}

    # Delete related readings first
    db.query(DailyReading).filter(DailyReading.user_id == user_id).delete()
    db.query(WeeklyReading).filter(WeeklyReading.user_id == user_id).delete()

    # Delete the user
    db.delete(user)
    db.commit()

    # Log the action
    log_admin_action(
        db=db,
        admin_id=admin.id,
        action="user_deleted",
        target_type="user",
        target_id=user_id,
        details=user_info,
        ip_address=get_client_ip(req),
    )

    return {"message": "User deleted successfully"}


@router.post("/users/{user_id}/grant-premium")
async def grant_premium(
    user_id: int,
    request: GrantPremiumRequest,
    req: Request,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """
    Grant premium access to a user (legacy endpoint - redirects to subscription system).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Use subscription service
    sub_service = SubscriptionService(db)
    subscription = sub_service.grant_subscription(
        user_id=user_id,
        duration_days=request.duration_days,
        admin_id=admin.id,
        reason=request.reason,
        source="admin_grant"
    )

    return {
        "message": f"Premium access granted for {request.duration_days} days",
        "user_id": user_id,
        "subscription_id": subscription.id,
        "expires_at": subscription.expires_at.isoformat(),
    }


# =============================================================================
# Statistics Endpoints
# =============================================================================

@router.get("/stats/overview", response_model=StatsOverviewResponse)
async def get_stats_overview(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """
    Get dashboard overview statistics.
    """
    stats_service = StatsService(db)
    return stats_service.get_overview_stats()


@router.get("/stats/users")
async def get_user_growth_stats(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """
    Get user growth statistics over time.
    """
    stats_service = StatsService(db)
    return {
        "user_growth": stats_service.get_user_growth(days),
        "auth_providers": stats_service.get_auth_provider_breakdown(),
        "day_master_distribution": stats_service.get_day_master_distribution(),
    }


@router.get("/stats/retention", response_model=RetentionStatsResponse)
async def get_retention_stats(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """
    Get user retention metrics (DAU, WAU, MAU).
    """
    stats_service = StatsService(db)
    return stats_service.get_retention_stats()


@router.get("/stats/readings")
async def get_reading_stats(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """
    Get reading generation statistics.
    """
    stats_service = StatsService(db)
    return stats_service.get_reading_stats(days)


@router.get("/stats/recent-signups")
async def get_recent_signups(
    limit: int = Query(10, ge=1, le=50, description="Number of recent signups to return"),
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """
    Get most recent user signups.
    """
    stats_service = StatsService(db)
    return {"recent_signups": stats_service.get_recent_signups(limit)}


# =============================================================================
# Audit Log Endpoints
# =============================================================================

@router.get("/audit-logs")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    admin_id: Optional[int] = Query(None, description="Filter by admin ID"),
    action: Optional[str] = Query(None, description="Filter by action type"),
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_super_admin)
):
    """
    Get admin audit logs. Requires super_admin role.
    """
    query = db.query(AdminAuditLog)

    if admin_id:
        query = query.filter(AdminAuditLog.admin_id == admin_id)
    if action:
        query = query.filter(AdminAuditLog.action == action)

    total = query.count()
    logs = query.order_by(
        AdminAuditLog.timestamp.desc()
    ).offset(
        (page - 1) * per_page
    ).limit(per_page).all()

    return {
        "logs": [
            {
                "id": log.id,
                "admin_id": log.admin_id,
                "admin_email": log.admin.email if log.admin else None,
                "action": log.action,
                "target_type": log.target_type,
                "target_id": log.target_id,
                "details": json.loads(log.details) if log.details else None,
                "ip_address": log.ip_address,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            }
            for log in logs
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    }


# =============================================================================
# Bootstrap Endpoint (for initial setup)
# =============================================================================

@router.post("/bootstrap")
async def bootstrap_admin(
    request: CreateAdminRequest,
    db: Session = Depends(get_db)
):
    """
    Create the first super_admin user. Only works if no admin users exist.
    This endpoint should be disabled or protected in production.
    """
    # Check if any admin exists
    existing = db.query(AdminUser).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin users already exist. Use /admin/auth/create-admin instead.",
        )

    # Create super admin
    admin = AdminUser(
        email=request.email,
        password_hash=hash_password(request.password),
        name=request.name,
        role="super_admin",  # First admin is always super_admin
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    return {
        "message": "Super admin created successfully",
        "admin": {
            "id": admin.id,
            "email": admin.email,
            "name": admin.name,
            "role": admin.role,
        }
    }


# =============================================================================
# Subscription Plan Management
# =============================================================================

@router.get("/subscriptions/plans")
async def list_subscription_plans(
    include_inactive: bool = Query(False, description="Include inactive plans"),
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Get all subscription plans."""
    sub_service = SubscriptionService(db)
    return {"plans": sub_service.get_all_plans(include_inactive)}


@router.post("/subscriptions/plans")
async def create_subscription_plan(
    request: CreatePlanRequest,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Create a new subscription plan."""
    sub_service = SubscriptionService(db)
    plan = sub_service.create_plan(
        name=request.name,
        duration_days=request.duration_days,
        price=request.price,
        description=request.description
    )
    return {"message": "Plan created", "plan": sub_service._plan_to_dict(plan)}


@router.patch("/subscriptions/plans/{plan_id}")
async def update_subscription_plan(
    plan_id: int,
    request: UpdatePlanRequest,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Update a subscription plan."""
    sub_service = SubscriptionService(db)
    plan = sub_service.update_plan(
        plan_id=plan_id,
        name=request.name,
        duration_days=request.duration_days,
        price=request.price,
        description=request.description,
        is_active=request.is_active
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"message": "Plan updated", "plan": sub_service._plan_to_dict(plan)}


@router.post("/subscriptions/seed-plans")
async def seed_default_plans(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Create default subscription plans (Weekly, Monthly, Yearly, etc.)."""
    sub_service = SubscriptionService(db)
    created = sub_service.seed_default_plans()
    return {
        "message": f"Created {len(created)} default plans",
        "plans": [sub_service._plan_to_dict(p) for p in created]
    }


# =============================================================================
# User Subscription Management
# =============================================================================

@router.get("/users/{user_id}/subscription")
async def get_user_subscription_status(
    user_id: int,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Get detailed subscription status for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    sub_service = SubscriptionService(db)
    return sub_service.get_user_subscription_status(user_id)


@router.post("/users/{user_id}/subscription")
async def grant_user_subscription(
    user_id: int,
    request: GrantSubscriptionRequest,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Grant a subscription to a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not request.plan_id and not request.duration_days:
        raise HTTPException(
            status_code=400,
            detail="Either plan_id or duration_days must be provided"
        )

    sub_service = SubscriptionService(db)
    try:
        subscription = sub_service.grant_subscription(
            user_id=user_id,
            plan_id=request.plan_id,
            duration_days=request.duration_days,
            admin_id=admin.id,
            reason=request.reason,
            notes=request.notes,
            source="admin_grant",
            entitlements=request.entitlements
        )
        return {
            "message": "Subscription granted successfully",
            "subscription": sub_service._subscription_to_dict(subscription)
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/subscriptions/{subscription_id}")
async def cancel_subscription(
    subscription_id: int,
    request: CancelSubscriptionRequest,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Cancel an active subscription."""
    sub_service = SubscriptionService(db)
    subscription = sub_service.cancel_subscription(
        subscription_id=subscription_id,
        admin_id=admin.id,
        reason=request.reason
    )
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return {
        "message": "Subscription cancelled",
        "subscription": sub_service._subscription_to_dict(subscription)
    }


@router.post("/subscriptions/{subscription_id}/refund")
async def refund_subscription(
    subscription_id: int,
    request: CancelSubscriptionRequest,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Mark a subscription as refunded."""
    sub_service = SubscriptionService(db)
    subscription = sub_service.refund_subscription(
        subscription_id=subscription_id,
        admin_id=admin.id,
        reason=request.reason
    )
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return {
        "message": "Subscription refunded",
        "subscription": sub_service._subscription_to_dict(subscription)
    }


@router.get("/stats/subscriptions")
async def get_subscription_stats(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Get subscription statistics."""
    sub_service = SubscriptionService(db)
    return sub_service.get_subscription_stats()


@router.get("/subscriptions/entitlements")
async def get_available_entitlements(
    admin: AdminUser = Depends(get_current_admin)
):
    """Get list of valid entitlements that can be granted."""
    return {
        "entitlements": [
            {"id": "future_7_day", "name": "Future 7-Day Readings", "description": "Access to 7-day future predictions"},
            {"id": "weekly_forecast", "name": "Weekly Forecast", "description": "Weekly horoscope forecasts"},
            {"id": "monthly_forecast", "name": "Monthly Forecast", "description": "Monthly horoscope forecasts"},
            {"id": "yearly_forecast", "name": "Yearly Forecast", "description": "Yearly horoscope forecasts"},
            {"id": "remove_ads", "name": "Remove Ads", "description": "Ad-free experience"},
            {"id": "premium_annual", "name": "Premium (All Features)", "description": "Full access to all premium features"},
        ]
    }


# =============================================================================
# Financial/Revenue Endpoints
# =============================================================================

@router.get("/financials/overview")
async def get_financial_overview(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Get financial overview statistics."""
    fin_service = FinancialService(db)
    return fin_service.get_revenue_overview()


@router.get("/financials/revenue-by-source")
async def get_revenue_by_source(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Get revenue breakdown by source."""
    fin_service = FinancialService(db)
    return {"breakdown": fin_service.get_revenue_by_source()}


@router.get("/financials/revenue-by-plan")
async def get_revenue_by_plan(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Get revenue breakdown by subscription plan."""
    fin_service = FinancialService(db)
    return {"breakdown": fin_service.get_revenue_by_plan()}


@router.get("/financials/revenue-by-type")
async def get_revenue_by_type(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Get revenue breakdown by transaction type."""
    fin_service = FinancialService(db)
    return {"breakdown": fin_service.get_revenue_by_type()}


@router.get("/financials/revenue-over-time")
async def get_revenue_over_time(
    days: int = Query(30, ge=1, le=365, description="Number of days"),
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Get daily revenue for the last N days."""
    fin_service = FinancialService(db)
    return {"data": fin_service.get_revenue_over_time(days)}


@router.get("/financials/monthly-revenue")
async def get_monthly_revenue(
    months: int = Query(12, ge=1, le=24, description="Number of months"),
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Get monthly revenue for the last N months."""
    fin_service = FinancialService(db)
    return {"data": fin_service.get_monthly_revenue(months)}


@router.get("/financials/transactions")
async def get_transactions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    transaction_type: Optional[str] = Query(None, description="Filter by type"),
    source: Optional[str] = Query(None, description="Filter by source"),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Get paginated transaction logs."""
    fin_service = FinancialService(db)
    return fin_service.get_transactions(
        page=page,
        per_page=per_page,
        user_id=user_id,
        transaction_type=transaction_type,
        source=source,
        status=status
    )


@router.get("/financials/recent-transactions")
async def get_recent_transactions(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Get recent transactions."""
    fin_service = FinancialService(db)
    return {"transactions": fin_service.get_recent_transactions(limit)}


# =============================================================================
# System Monitoring Endpoints
# =============================================================================

from models.system_health import SystemHealthLog, RequestLog

@router.get("/system/health")
async def get_system_health(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Get health status of all system services."""
    import httpx
    import os
    import time

    services = []

    # Check Ollama
    ollama_host = os.getenv("OLLAMA_HOST", "http://10.0.1.147:11434")
    try:
        start = time.time()
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{ollama_host}/api/tags")
            response_time = int((time.time() - start) * 1000)
            if response.status_code == 200:
                services.append({
                    "service": "ollama",
                    "status": "healthy",
                    "message": "Ollama responding normally",
                    "last_check": datetime.utcnow().isoformat(),
                    "response_time_ms": response_time
                })
            else:
                services.append({
                    "service": "ollama",
                    "status": "down",
                    "message": f"Ollama returned status {response.status_code}",
                    "last_check": datetime.utcnow().isoformat(),
                    "response_time_ms": response_time
                })
    except Exception as e:
        services.append({
            "service": "ollama",
            "status": "down",
            "message": f"Cannot connect to Ollama: {str(e)}",
            "last_check": datetime.utcnow().isoformat()
        })

    # Check Database
    try:
        from sqlalchemy import text
        start = time.time()
        db.execute(text("SELECT 1"))
        response_time = int((time.time() - start) * 1000)
        services.append({
            "service": "database",
            "status": "healthy",
            "message": "PostgreSQL responding normally",
            "last_check": datetime.utcnow().isoformat(),
            "response_time_ms": response_time
        })
    except Exception as e:
        services.append({
            "service": "database",
            "status": "down",
            "message": f"Database error: {str(e)}",
            "last_check": datetime.utcnow().isoformat()
        })

    # API is healthy if we got here
    services.append({
        "service": "api",
        "status": "healthy",
        "message": "API server running",
        "last_check": datetime.utcnow().isoformat()
    })

    # Get recent health events from DB
    history = []
    try:
        logs = db.query(SystemHealthLog).order_by(
            SystemHealthLog.timestamp.desc()
        ).limit(20).all()
        history = [
            {
                "id": log.id,
                "service": log.service,
                "status": log.status,
                "message": log.message,
                "last_check": log.timestamp.isoformat() if log.timestamp else None
            }
            for log in logs
        ]
    except Exception:
        pass  # Table may not exist yet

    return {"services": services, "history": history}


@router.post("/system/health-report")
async def receive_health_report(
    request: Request,
    db: Session = Depends(get_db)
):
    """Receive health status reports from external monitors (like PowerShell script)."""
    try:
        body = await request.json()
        log = SystemHealthLog(
            service=body.get("service", "unknown"),
            status=body.get("status", "unknown"),
            message=body.get("message", ""),
            host=body.get("host"),
            timestamp=datetime.utcnow()
        )
        db.add(log)
        db.commit()
        return {"message": "Health report received"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/system/request-logs")
async def get_request_logs(
    filter: str = Query("all", description="Filter: all, success, error"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Get recent API request logs."""
    try:
        query = db.query(RequestLog)

        if filter == "success":
            query = query.filter(RequestLog.status_code < 400)
        elif filter == "error":
            query = query.filter(RequestLog.status_code >= 400)

        logs = query.order_by(RequestLog.timestamp.desc()).limit(limit).all()

        return {
            "logs": [
                {
                    "id": log.id,
                    "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                    "endpoint": log.endpoint,
                    "method": log.method,
                    "status_code": log.status_code,
                    "response_time_ms": log.response_time_ms,
                    "user_id": log.user_id,
                    "error_message": log.error_message
                }
                for log in logs
            ]
        }
    except Exception:
        # Table may not exist yet
        return {"logs": []}


@router.get("/system/metrics")
async def get_system_metrics(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """Get system metrics for the last 24 hours."""
    from datetime import timedelta
    from sqlalchemy import func

    try:
        yesterday = datetime.utcnow() - timedelta(hours=24)

        # Total requests
        total = db.query(func.count(RequestLog.id)).filter(
            RequestLog.timestamp >= yesterday
        ).scalar() or 0

        # Successful requests
        successful = db.query(func.count(RequestLog.id)).filter(
            RequestLog.timestamp >= yesterday,
            RequestLog.status_code < 400
        ).scalar() or 0

        # Failed requests
        failed = db.query(func.count(RequestLog.id)).filter(
            RequestLog.timestamp >= yesterday,
            RequestLog.status_code >= 400
        ).scalar() or 0

        # Average response time
        avg_time = db.query(func.avg(RequestLog.response_time_ms)).filter(
            RequestLog.timestamp >= yesterday
        ).scalar() or 0

        # Response times over time (hourly)
        response_times = []
        for i in range(24):
            hour_start = yesterday + timedelta(hours=i)
            hour_end = hour_start + timedelta(hours=1)
            avg = db.query(func.avg(RequestLog.response_time_ms)).filter(
                RequestLog.timestamp >= hour_start,
                RequestLog.timestamp < hour_end
            ).scalar()
            if avg:
                response_times.append({
                    "timestamp": hour_start.isoformat(),
                    "avg_ms": int(avg)
                })

        return {
            "total_requests_24h": total,
            "successful_requests_24h": successful,
            "failed_requests_24h": failed,
            "avg_response_time_ms": int(avg_time),
            "response_times": response_times
        }
    except Exception:
        # Tables may not exist yet
        return {
            "total_requests_24h": 0,
            "successful_requests_24h": 0,
            "failed_requests_24h": 0,
            "avg_response_time_ms": 0,
            "response_times": []
        }


# =============================================================================
# Scheduler Job Recovery Endpoints (for health monitor)
# =============================================================================

from models.monthly_reading import MonthlyReading
from models.yearly_reading import YearlyReading


@router.get("/scheduler/check-readings")
async def check_readings_status(
    type: str = Query(..., description="Reading type: daily, weekly, monthly, yearly"),
    db: Session = Depends(get_db)
):
    """
    Check if readings have been generated for the current period.
    Used by the health monitor to detect failed jobs.
    """
    from datetime import date, timedelta
    from sqlalchemy import func

    today = date.today()
    total_users = db.query(func.count(User.id)).scalar() or 0

    if total_users == 0:
        return {"complete": True, "message": "No users to generate readings for", "generated": 0, "total": 0}

    if type == "daily":
        generated = db.query(func.count(DailyReading.id)).filter(
            DailyReading.date == today
        ).scalar() or 0
        complete = generated >= total_users
        return {
            "complete": complete,
            "type": "daily",
            "date": today.isoformat(),
            "generated": generated,
            "total": total_users
        }

    elif type == "weekly":
        # Monday of current week
        week_start = today - timedelta(days=today.weekday())
        generated = db.query(func.count(WeeklyReading.id)).filter(
            WeeklyReading.week_start == week_start
        ).scalar() or 0
        complete = generated >= total_users
        return {
            "complete": complete,
            "type": "weekly",
            "week_start": week_start.isoformat(),
            "generated": generated,
            "total": total_users
        }

    elif type == "monthly":
        month_start = today.replace(day=1)
        generated = db.query(func.count(MonthlyReading.id)).filter(
            MonthlyReading.month_start == month_start
        ).scalar() or 0
        complete = generated >= total_users
        return {
            "complete": complete,
            "type": "monthly",
            "month_start": month_start.isoformat(),
            "generated": generated,
            "total": total_users
        }

    elif type == "yearly":
        year = today.year
        generated = db.query(func.count(YearlyReading.id)).filter(
            YearlyReading.year == year
        ).scalar() or 0
        complete = generated >= total_users
        return {
            "complete": complete,
            "type": "yearly",
            "year": year,
            "generated": generated,
            "total": total_users
        }

    else:
        raise HTTPException(status_code=400, detail=f"Invalid reading type: {type}")


@router.post("/scheduler/trigger-daily")
async def trigger_daily_readings(
    db: Session = Depends(get_db)
):
    """
    Trigger daily reading generation.
    Used by the health monitor to recover from failed jobs.
    """
    from tasks import trigger_daily_generation_now

    try:
        trigger_daily_generation_now()
        return {"success": True, "message": "Daily reading generation triggered"}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/scheduler/trigger-weekly")
async def trigger_weekly_readings(
    db: Session = Depends(get_db)
):
    """
    Trigger weekly reading generation.
    Used by the health monitor to recover from failed jobs.
    """
    from tasks import trigger_weekly_generation_now

    try:
        trigger_weekly_generation_now()
        return {"success": True, "message": "Weekly reading generation triggered"}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/scheduler/trigger-monthly")
async def trigger_monthly_readings(
    db: Session = Depends(get_db)
):
    """
    Trigger monthly reading generation.
    Used by the health monitor to recover from failed jobs.
    """
    from tasks import trigger_monthly_generation_now

    try:
        trigger_monthly_generation_now()
        return {"success": True, "message": "Monthly reading generation triggered"}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/scheduler/trigger-yearly")
async def trigger_yearly_readings(
    db: Session = Depends(get_db)
):
    """
    Trigger yearly reading generation.
    Used by the health monitor to recover from failed jobs.
    """
    from tasks import trigger_yearly_generation_now

    try:
        trigger_yearly_generation_now()
        return {"success": True, "message": "Yearly reading generation triggered"}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.get("/scheduler/status")
async def get_scheduler_status(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """
    Get the status of all scheduled jobs.
    """
    from datetime import date, timedelta
    from sqlalchemy import func

    today = date.today()
    total_users = db.query(func.count(User.id)).scalar() or 0

    # Get latest health logs for each scheduler job
    jobs = ["daily_readings", "weekly_readings", "monthly_readings", "yearly_readings"]
    job_statuses = []

    for job_name in jobs:
        latest_log = db.query(SystemHealthLog).filter(
            SystemHealthLog.service == f"scheduler_{job_name}"
        ).order_by(SystemHealthLog.timestamp.desc()).first()

        job_statuses.append({
            "job": job_name,
            "last_status": latest_log.status if latest_log else "unknown",
            "last_message": latest_log.message if latest_log else "No logs available",
            "last_run": latest_log.timestamp.isoformat() if latest_log and latest_log.timestamp else None
        })

    # Check reading completion for each type
    readings_status = {
        "daily": {
            "date": today.isoformat(),
            "generated": db.query(func.count(DailyReading.id)).filter(
                DailyReading.date == today
            ).scalar() or 0,
            "total": total_users
        },
        "weekly": {
            "week_start": (today - timedelta(days=today.weekday())).isoformat(),
            "generated": db.query(func.count(WeeklyReading.id)).filter(
                WeeklyReading.week_start == today - timedelta(days=today.weekday())
            ).scalar() or 0,
            "total": total_users
        },
        "monthly": {
            "month_start": today.replace(day=1).isoformat(),
            "generated": db.query(func.count(MonthlyReading.id)).filter(
                MonthlyReading.month_start == today.replace(day=1)
            ).scalar() or 0,
            "total": total_users
        },
        "yearly": {
            "year": today.year,
            "generated": db.query(func.count(YearlyReading.id)).filter(
                YearlyReading.year == today.year
            ).scalar() or 0,
            "total": total_users
        }
    }

    return {
        "jobs": job_statuses,
        "readings": readings_status,
        "total_users": total_users
    }


# =============================================================================
# Launch Health Dashboard Endpoint
# =============================================================================

@router.get("/launch-health")
async def get_launch_health(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    """
    Launch health dashboard with latency percentiles and threshold indicators.
    Used by the admin dashboard for at-a-glance system health monitoring.
    """
    from datetime import datetime, timedelta
    from sqlalchemy import func

    now = datetime.utcnow()
    last_24h = now - timedelta(hours=24)
    last_1h = now - timedelta(hours=1)
    today = date.today()

    # Get response times for percentile calculation
    response_times = db.query(RequestLog.response_time_ms).filter(
        RequestLog.timestamp >= last_24h,
        RequestLog.response_time_ms.isnot(None)
    ).all()
    times = sorted([r[0] for r in response_times if r[0] is not None])

    # Calculate percentiles
    def percentile(data, p):
        if not data:
            return 0
        k = (len(data) - 1) * p / 100
        f = int(k)
        c = f + 1 if f + 1 < len(data) else f
        if c == f:
            return data[f]
        return data[f] + (k - f) * (data[c] - data[f])

    p50 = percentile(times, 50)
    p95 = percentile(times, 95)
    p99 = percentile(times, 99)

    # Error rates (5xx errors)
    total_requests = len(times) if times else 1  # Avoid division by zero
    errors_5xx = db.query(func.count(RequestLog.id)).filter(
        RequestLog.timestamp >= last_24h,
        RequestLog.status_code >= 500
    ).scalar() or 0
    error_rate = (errors_5xx / total_requests * 100) if total_requests > 0 else 0

    # Rate limit hits (429s) in last hour
    rate_limits = db.query(func.count(RequestLog.id)).filter(
        RequestLog.timestamp >= last_1h,
        RequestLog.status_code == 429
    ).scalar() or 0

    # Get scheduler status (reuse logic from get_scheduler_status)
    total_users = db.query(func.count(User.id)).scalar() or 0
    jobs = ["daily_readings", "weekly_readings", "monthly_readings", "yearly_readings"]
    job_statuses = []
    job_failures = 0

    for job_name in jobs:
        latest_log = db.query(SystemHealthLog).filter(
            SystemHealthLog.service == f"scheduler_{job_name}"
        ).order_by(SystemHealthLog.timestamp.desc()).first()

        status = latest_log.status if latest_log else "unknown"
        if status in ("critical", "down"):
            job_failures += 1

        job_statuses.append({
            "job": job_name,
            "status": status,
            "last_run": latest_log.timestamp.isoformat() if latest_log and latest_log.timestamp else None
        })

    # Reading completion
    readings_status = {
        "daily": {
            "generated": db.query(func.count(DailyReading.id)).filter(
                DailyReading.date == today
            ).scalar() or 0,
            "total": total_users
        },
        "weekly": {
            "generated": db.query(func.count(WeeklyReading.id)).filter(
                WeeklyReading.week_start == today - timedelta(days=today.weekday())
            ).scalar() or 0,
            "total": total_users
        }
    }

    # Threshold status helpers
    def get_status(value, yellow_thresh, red_thresh, lower_is_better=True):
        if lower_is_better:
            if value >= red_thresh:
                return "red"
            if value >= yellow_thresh:
                return "yellow"
            return "green"
        else:
            if value <= red_thresh:
                return "red"
            if value <= yellow_thresh:
                return "yellow"
            return "green"

    # Scheduler status based on failures
    if job_failures >= 2:
        scheduler_status = "red"
    elif job_failures >= 1:
        scheduler_status = "yellow"
    else:
        scheduler_status = "green"

    return {
        "latency": {
            "p50_ms": round(p50),
            "p95_ms": round(p95),
            "p99_ms": round(p99),
            "status": get_status(p95, 1500, 2500)  # yellow > 1500ms, red > 2500ms
        },
        "errors": {
            "rate_percent": round(error_rate, 2),
            "count_24h": errors_5xx,
            "total_requests_24h": total_requests,
            "status": get_status(error_rate, 2, 5)  # yellow > 2%, red > 5%
        },
        "rate_limits": {
            "count_1h": rate_limits,
            "status": get_status(rate_limits, 10, 50)  # yellow > 10, red > 50
        },
        "scheduler": {
            "jobs": job_statuses,
            "readings": readings_status,
            "failures": job_failures,
            "status": scheduler_status
        },
        "timestamp": now.isoformat()
    }


# =============================================================================
# Data Management Endpoints
# =============================================================================

@router.post("/data/reset-relationship-analyses")
async def reset_relationship_analyses(
    req: Request,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_super_admin)
):
    """
    Reset all relationship analyses to trigger recalculation with new scoring engine.
    Requires super_admin role.
    """
    from sqlalchemy import text

    try:
        # Count existing analyses
        result = db.execute(text('SELECT COUNT(*) FROM relationship_analyses'))
        count = result.scalar() or 0

        if count == 0:
            return {
                "success": True,
                "message": "No relationship analyses to delete",
                "deleted": 0
            }

        # Delete all analyses
        db.execute(text('DELETE FROM relationship_analyses'))
        db.commit()

        # Log the action
        log_admin_action(
            db=db,
            admin_id=admin.id,
            action="reset_relationship_analyses",
            target_type="relationship_analyses",
            details={"deleted_count": count},
            ip_address=get_client_ip(req),
        )

        return {
            "success": True,
            "message": f"Deleted {count} relationship analyses. They will regenerate when users view relationships.",
            "deleted": count
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reset analyses: {str(e)}"
        )
