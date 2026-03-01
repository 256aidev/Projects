"""
System Health and Request Logging Models
For monitoring Ollama, API, and database health.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Integer, String, DateTime, Text
from models.base import Base


class SystemHealthLog(Base):
    """Stores health status reports from monitoring scripts."""
    __tablename__ = "system_health_logs"

    id = Column(Integer, primary_key=True, index=True)
    service = Column(String(50), nullable=False, index=True)  # ollama, api, database
    status = Column(String(20), nullable=False, index=True)  # healthy, down, recovered, critical
    message = Column(Text, nullable=True)
    host = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class RequestLog(Base):
    """Stores API request logs for monitoring success/failure rates."""
    __tablename__ = "request_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    endpoint = Column(String(255), nullable=False, index=True)
    method = Column(String(10), nullable=False)
    status_code = Column(Integer, nullable=False, index=True)
    response_time_ms = Column(Integer, nullable=True)
    user_id = Column(Integer, nullable=True, index=True)
    error_message = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
