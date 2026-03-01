"""
Subscription model for managing user premium access.
Tracks subscription packages granted by admin or purchased by users.
"""
from datetime import datetime
import json
from typing import List
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Float, Text
from sqlalchemy.orm import relationship

from .base import Base


# Valid entitlement IDs (must match mobile app)
VALID_ENTITLEMENTS = [
    "future_7_day",      # 7-day future readings
    "weekly_forecast",   # Weekly forecasts
    "monthly_forecast",  # Monthly forecasts
    "yearly_forecast",   # Yearly forecasts
    "remove_ads",        # Ad-free experience
    "screenshot_mode",   # Dev/screenshot mode - hides ads, enables dev features
    "premium_annual",    # All features (master entitlement)
]


class SubscriptionPlan(Base):
    """Available subscription plans/packages."""
    __tablename__ = "subscription_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)  # e.g., "Weekly", "Monthly", "Yearly"
    duration_days = Column(Integer, nullable=False)  # 7, 30, 365, etc.
    price = Column(Float, default=0.0)  # Price in USD (0 for free/admin grants)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)  # Can be purchased/granted
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<SubscriptionPlan(id={self.id}, name='{self.name}', days={self.duration_days})>"


class UserSubscription(Base):
    """User subscription records - tracks all subscriptions granted or purchased."""
    __tablename__ = "user_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=True)

    # Subscription period
    starts_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False, index=True)

    # Status
    status = Column(String(20), default="active")  # active, expired, cancelled, refunded

    # Source of subscription
    source = Column(String(50), default="admin_grant")  # admin_grant, purchase, promo, revenucat

    # Payment info (if purchased)
    amount_paid = Column(Float, default=0.0)
    currency = Column(String(10), default="USD")
    payment_provider = Column(String(50), nullable=True)  # stripe, apple, google, revenucat
    transaction_id = Column(String(255), nullable=True)  # External transaction reference

    # Admin grant info
    granted_by_admin_id = Column(Integer, ForeignKey("admin_users.id"), nullable=True)
    grant_reason = Column(Text, nullable=True)

    # Entitlements - JSON array of granted features
    # Valid values: future_7_day, weekly_forecast, monthly_forecast, yearly_forecast, remove_ads, premium_annual
    # premium_annual grants all features
    entitlements = Column(Text, nullable=True)  # JSON array, e.g., '["weekly_forecast", "remove_ads"]'

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    notes = Column(Text, nullable=True)  # Admin notes

    # Relationships
    plan = relationship("SubscriptionPlan", backref="subscriptions")
    granted_by = relationship("AdminUser", backref="granted_subscriptions")

    def __repr__(self):
        return f"<UserSubscription(id={self.id}, user_id={self.user_id}, status='{self.status}')>"

    @property
    def is_active(self) -> bool:
        """Check if subscription is currently active."""
        return self.status == "active" and self.expires_at > datetime.utcnow()

    @property
    def days_remaining(self) -> int:
        """Get days remaining on subscription."""
        if not self.is_active:
            return 0
        delta = self.expires_at - datetime.utcnow()
        return max(0, delta.days)

    def get_entitlements(self) -> List[str]:
        """Get the list of entitlements for this subscription."""
        if not self.entitlements:
            # Default: premium_annual (all features) for backwards compatibility
            return ["premium_annual"]
        try:
            return json.loads(self.entitlements)
        except (json.JSONDecodeError, TypeError):
            return ["premium_annual"]

    def set_entitlements(self, entitlements: List[str]) -> None:
        """Set the entitlements for this subscription."""
        # Validate entitlements
        valid = [e for e in entitlements if e in VALID_ENTITLEMENTS]
        self.entitlements = json.dumps(valid) if valid else None

    def has_entitlement(self, entitlement: str) -> bool:
        """Check if this subscription grants a specific entitlement."""
        if not self.is_active:
            return False
        ents = self.get_entitlements()
        # premium_annual grants everything
        if "premium_annual" in ents:
            return True
        return entitlement in ents
