"""
Payment/Transaction model for tracking all financial transactions.
Logs purchases, refunds, and admin grants for financial reporting.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Boolean
from sqlalchemy.orm import relationship

from .base import Base


class Payment(Base):
    """Financial transaction records for revenue tracking."""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)

    # User info
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Transaction details
    amount = Column(Float, nullable=False)  # Positive for income, negative for refunds
    currency = Column(String(10), default="USD")

    # Transaction type and source
    transaction_type = Column(String(50), nullable=False)  # purchase, refund, admin_grant, promo
    source = Column(String(50), nullable=False)  # revenucat, stripe, apple, google, admin

    # Product/Plan info
    product_id = Column(String(255), nullable=True)  # e.g., com.baziastrology.premium
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=True)
    subscription_id = Column(Integer, ForeignKey("user_subscriptions.id"), nullable=True)

    # External references
    external_transaction_id = Column(String(255), nullable=True, index=True)  # RevenueCat/Stripe transaction ID
    external_customer_id = Column(String(255), nullable=True)  # RevenueCat customer ID

    # Status
    status = Column(String(50), default="completed")  # pending, completed, failed, refunded

    # Admin info (for admin grants/refunds)
    admin_id = Column(Integer, ForeignKey("admin_users.id"), nullable=True)
    notes = Column(Text, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Additional data (JSON string for flexible storage)
    extra_data = Column(Text, nullable=True)  # JSON for extra data like receipt info

    # Relationships
    user = relationship("User", backref="payments")
    plan = relationship("SubscriptionPlan", backref="payments")
    subscription = relationship("UserSubscription", backref="payments")
    admin = relationship("AdminUser", backref="processed_payments")

    def __repr__(self):
        return f"<Payment(id={self.id}, amount={self.amount}, type='{self.transaction_type}')>"

    @property
    def is_revenue(self) -> bool:
        """Check if this transaction counts as revenue."""
        return self.amount > 0 and self.status == "completed"
