"""
Yearly Reading Model
Stores AI-generated yearly forecasts for users.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from models.base import Base


class YearlyReading(Base):
    """Yearly AI-generated reading for a user."""
    __tablename__ = "yearly_readings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)

    # Generated content
    content_en = Column(Text, nullable=True)
    content_zh = Column(Text, nullable=True)

    # Metadata
    llm_provider = Column(String(50), default="ollama")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="yearly_readings")

    def __repr__(self):
        return f"<YearlyReading user={self.user_id} year={self.year}>"
