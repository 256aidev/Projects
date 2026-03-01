from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from .base import Base


class DailyReading(Base):
    __tablename__ = "daily_readings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)

    # Today's pillar info (for reference)
    daily_pillar = Column(String(10))   # e.g., "丙寅"
    daily_stem = Column(String(5))      # e.g., "丙"
    daily_branch = Column(String(5))    # e.g., "寅"
    daily_element = Column(String(20))  # e.g., "Fire"

    # Interaction analysis (structured data before LLM processing)
    interactions_json = Column(Text)  # JSON with clashes, combinations, element flow

    # Template-generated content (NO LLM cost for daily!)
    content_en = Column(Text, nullable=True)   # English reading
    content_zh = Column(Text, nullable=True)   # Chinese reading (中文)

    # Which template was used (for debugging/analytics)
    template_id = Column(String(100), nullable=True)

    # Generation method: "template", "ollama", "openai"
    generation_method = Column(String(20), default="template")

    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uix_user_date"),
    )

    def __repr__(self):
        return f"<DailyReading(user_id={self.user_id}, date='{self.date}')>"

    def get_content(self, language: str = "en") -> str:
        """Get content in the specified language."""
        if language == "zh":
            return self.content_zh or self.content_en or ""
        return self.content_en or self.content_zh or ""
