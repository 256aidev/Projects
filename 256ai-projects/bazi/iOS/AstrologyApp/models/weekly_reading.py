"""
Weekly Reading Model

Stores AI-generated weekly readings (via Ollama or OpenAI fallback).
Generated once per week to reduce LLM costs.
"""

from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, Text, DateTime, ForeignKey, UniqueConstraint
from .base import Base


class WeeklyReading(Base):
    __tablename__ = "weekly_readings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    week_start = Column(Date, nullable=False, index=True)  # Monday of the week

    # AI-generated comprehensive weekly reading (bilingual)
    content_en = Column(Text, nullable=True)
    content_zh = Column(Text, nullable=True)

    # LLM provider used for this reading
    llm_provider = Column(String(50))  # "ollama", "openai", "template"

    # Week's pillar summary (for reference)
    week_pillars_json = Column(Text)  # JSON with all 7 days' pillars

    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "week_start", name="uix_user_week"),
    )

    def __repr__(self):
        return f"<WeeklyReading(user_id={self.user_id}, week_start='{self.week_start}')>"

    def get_content(self, language: str = "en") -> str:
        """Get content in the specified language."""
        if language == "zh":
            return self.content_zh or self.content_en or ""
        return self.content_en or self.content_zh or ""

    @staticmethod
    def get_week_start(target_date: date) -> date:
        """Get the Monday of the week for a given date."""
        # Monday is weekday 0
        days_since_monday = target_date.weekday()
        return target_date - timedelta(days=days_since_monday)


from datetime import timedelta
