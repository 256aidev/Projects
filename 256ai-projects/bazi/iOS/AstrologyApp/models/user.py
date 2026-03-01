from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, Time, Float, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from .base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)

    # Authentication fields
    email = Column(String(255), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=True)  # Null for social login users
    auth_provider = Column(String(50), default="email")  # "email", "google", "apple"
    provider_user_id = Column(String(255), nullable=True)  # Social login provider ID
    email_verified = Column(Boolean, default=False)
    device_token = Column(String(500), nullable=True)  # FCM/APNs push notification token
    last_login = Column(DateTime, nullable=True)

    # Birth data (birth_time is REQUIRED for accurate 4-pillar reading)
    birth_date = Column(Date, nullable=False)
    birth_time = Column(Time, nullable=False)
    birth_longitude = Column(Float, nullable=True)  # For true solar time adjustment
    birth_latitude = Column(Float, nullable=True)
    birth_location = Column(String(200), nullable=True)  # Display name (e.g., "Shanghai")

    # Calculated Four Pillars (stored as Chinese characters)
    year_pillar = Column(String(10))   # e.g., "甲子"
    month_pillar = Column(String(10))  # e.g., "丙寅"
    day_pillar = Column(String(10))    # e.g., "辛巳"
    hour_pillar = Column(String(10))   # e.g., "壬辰"

    # Separate stems and branches for easier querying
    year_stem = Column(String(5))
    year_branch = Column(String(5))
    month_stem = Column(String(5))
    month_branch = Column(String(5))
    day_stem = Column(String(5))
    day_branch = Column(String(5))
    hour_stem = Column(String(5))
    hour_branch = Column(String(5))

    # Day Master (core identity element)
    day_master = Column(String(5))           # e.g., "辛" (Xin Metal)
    day_master_element = Column(String(20))  # e.g., "Metal"
    day_master_polarity = Column(String(10)) # "Yang" or "Yin"

    # Ten Gods for each pillar stem (relative to Day Master)
    year_ten_god = Column(String(20))
    month_ten_god = Column(String(20))
    hour_ten_god = Column(String(20))

    # Five Elements summary (JSON string)
    element_counts = Column(Text)  # JSON: {"Wood": 2, "Fire": 1, "Earth": 2, "Metal": 2, "Water": 1}

    # User preferences
    preferred_tone = Column(String(50), default="balanced")  # gentle, direct, motivational
    language = Column(String(10), default="en")  # "en" or "zh" for bilingual support

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Legal acceptance tracking
    legal_accepted_at = Column(DateTime, nullable=True)  # When user accepted terms
    legal_version = Column(String(20), nullable=True)    # Version of terms accepted (e.g., "2026-01")

    # Relationships
    monthly_readings = relationship("MonthlyReading", back_populates="user", cascade="all, delete-orphan")
    yearly_readings = relationship("YearlyReading", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, name='{self.name}', day_master='{self.day_master}')>"

    def get_all_branches(self) -> list:
        """Return all four branches for interaction checking."""
        return [self.year_branch, self.month_branch, self.day_branch, self.hour_branch]

    def get_all_stems(self) -> list:
        """Return all four stems."""
        return [self.year_stem, self.month_stem, self.day_stem, self.hour_stem]
