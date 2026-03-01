"""
Audit Log model for tracking admin actions.
Records all administrative operations for accountability.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from .base import Base


class AdminAuditLog(Base):
    """Audit log entry for admin actions."""
    __tablename__ = "admin_audit_log"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("admin_users.id"), nullable=False, index=True)
    action = Column(String(100), nullable=False)  # e.g., "user_deleted", "user_updated"
    target_type = Column(String(50), nullable=True)  # e.g., "user", "reading"
    target_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)  # JSON string with additional details
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationship to admin user
    admin = relationship("AdminUser", backref="audit_logs")

    def __repr__(self):
        return f"<AdminAuditLog(id={self.id}, action='{self.action}', admin_id={self.admin_id})>"
