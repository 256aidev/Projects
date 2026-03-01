"""
Admin User model for the admin console.
Separate from app users - these are internal admin accounts.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime

from .base import Base


class AdminUser(Base):
    """Admin user account for the admin console."""
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(String(50), default="admin")  # "admin" or "super_admin"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<AdminUser(id={self.id}, email='{self.email}', role='{self.role}')>"
