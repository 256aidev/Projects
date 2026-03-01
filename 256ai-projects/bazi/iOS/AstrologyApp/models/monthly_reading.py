"""
Monthly Reading Model
Stores AI-generated monthly forecasts for users.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from models.base import Base


class MonthlyReading(Base):
    """Monthly AI-generated reading for a user."""
    __tablename__ = "monthly_readings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    month_start = Column(Date, nullable=False, index=True)  # First day of month

    # Generated content
    content_en = Column(Text, nullable=True)
    content_zh = Column(Text, nullable=True)

    # Metadata
    llm_provider = Column(String(50), default="ollama")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="monthly_readings")

    def __repr__(self):
        return f"<MonthlyReading user={self.user_id} month={self.month_start}>"
