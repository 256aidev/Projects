"""
Admin Authentication Dependencies
Separate from regular user auth - these are for admin console access.
"""

import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from dotenv import load_dotenv

from models import get_db, AdminUser

load_dotenv()

# Configuration - can use same secret or a different one for admin tokens
ADMIN_SECRET_KEY = os.getenv("ADMIN_JWT_SECRET_KEY", os.getenv("JWT_SECRET_KEY", "admin-secret-key-change-in-production"))
ALGORITHM = "HS256"
ADMIN_TOKEN_EXPIRE_HOURS = 8  # Admin sessions are shorter for security

# HTTP Bearer token security scheme for admin
admin_security = HTTPBearer(auto_error=False)


def create_admin_token(
    admin_id: int,
    email: str,
    role: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token for an admin user.

    Args:
        admin_id: The admin's database ID
        email: The admin's email address
        role: The admin's role (admin, super_admin)
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT token string
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ADMIN_TOKEN_EXPIRE_HOURS)

    payload = {
        "sub": str(admin_id),
        "email": email,
        "role": role,
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "admin_access"
    }

    return jwt.encode(payload, ADMIN_SECRET_KEY, algorithm=ALGORITHM)


def decode_admin_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate an admin JWT token.

    Args:
        token: The JWT token string

    Returns:
        Decoded payload dict if valid, None if invalid/expired
    """
    try:
        payload = jwt.decode(token, ADMIN_SECRET_KEY, algorithms=[ALGORITHM])
        # Verify this is an admin token
        if payload.get("type") != "admin_access":
            return None
        return payload
    except JWTError:
        return None


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(admin_security),
    db: Session = Depends(get_db)
) -> AdminUser:
    """
    FastAPI dependency to get the current authenticated admin user.

    Usage:
        @router.get("/admin/protected")
        async def admin_route(admin: AdminUser = Depends(get_current_admin)):
            return {"admin_id": admin.id}

    Raises:
        HTTPException 401 if token is missing, invalid, or expired
        HTTPException 401 if admin not found or inactive
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_admin_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired admin token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        admin_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    admin = db.query(AdminUser).filter(AdminUser.id == admin_id).first()

    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is disabled",
        )

    return admin


async def get_super_admin(
    admin: AdminUser = Depends(get_current_admin)
) -> AdminUser:
    """
    FastAPI dependency to require super_admin role.

    Usage:
        @router.delete("/admin/users/{id}")
        async def delete_user(admin: AdminUser = Depends(get_super_admin)):
            # Only super_admins can delete users
            ...
    """
    if admin.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin privileges required",
        )
    return admin


def get_client_ip(request: Request) -> str:
    """Extract client IP address from request."""
    # Check for forwarded header (behind proxy)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
