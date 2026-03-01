"""
Subscription Service for managing user premium access.
Handles granting, checking, and managing subscriptions.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from models import User, SubscriptionPlan, UserSubscription, AdminAuditLog, Payment
from models.subscription import VALID_ENTITLEMENTS
import json


class SubscriptionService:
    """Service class for subscription management."""

    def __init__(self, db: Session):
        self.db = db

    # ==================== Plan Management ====================

    def get_all_plans(self, include_inactive: bool = False) -> List[Dict[str, Any]]:
        """Get all subscription plans."""
        query = self.db.query(SubscriptionPlan)
        if not include_inactive:
            query = query.filter(SubscriptionPlan.is_active == True)
        plans = query.order_by(SubscriptionPlan.duration_days).all()
        return [self._plan_to_dict(p) for p in plans]

    def get_plan(self, plan_id: int) -> Optional[SubscriptionPlan]:
        """Get a specific plan by ID."""
        return self.db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()

    def create_plan(
        self,
        name: str,
        duration_days: int,
        price: float = 0.0,
        description: Optional[str] = None
    ) -> SubscriptionPlan:
        """Create a new subscription plan."""
        plan = SubscriptionPlan(
            name=name,
            duration_days=duration_days,
            price=price,
            description=description,
        )
        self.db.add(plan)
        self.db.commit()
        self.db.refresh(plan)
        return plan

    def update_plan(
        self,
        plan_id: int,
        name: Optional[str] = None,
        duration_days: Optional[int] = None,
        price: Optional[float] = None,
        description: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Optional[SubscriptionPlan]:
        """Update an existing plan."""
        plan = self.get_plan(plan_id)
        if not plan:
            return None

        if name is not None:
            plan.name = name
        if duration_days is not None:
            plan.duration_days = duration_days
        if price is not None:
            plan.price = price
        if description is not None:
            plan.description = description
        if is_active is not None:
            plan.is_active = is_active

        self.db.commit()
        self.db.refresh(plan)
        return plan

    def seed_default_plans(self) -> List[SubscriptionPlan]:
        """Create default subscription plans if they don't exist."""
        default_plans = [
            {"name": "Weekly", "duration_days": 7, "price": 2.99, "description": "7 days of premium access"},
            {"name": "Monthly", "duration_days": 30, "price": 7.99, "description": "30 days of premium access"},
            {"name": "Quarterly", "duration_days": 90, "price": 19.99, "description": "90 days of premium access"},
            {"name": "Yearly", "duration_days": 365, "price": 59.99, "description": "365 days of premium access"},
            {"name": "Lifetime", "duration_days": 36500, "price": 149.99, "description": "Lifetime premium access"},
        ]

        created = []
        for plan_data in default_plans:
            existing = self.db.query(SubscriptionPlan).filter(
                SubscriptionPlan.name == plan_data["name"]
            ).first()
            if not existing:
                plan = self.create_plan(**plan_data)
                created.append(plan)

        return created

    # ==================== Subscription Management ====================

    def grant_subscription(
        self,
        user_id: int,
        plan_id: Optional[int] = None,
        duration_days: Optional[int] = None,
        admin_id: Optional[int] = None,
        reason: Optional[str] = None,
        notes: Optional[str] = None,
        source: str = "admin_grant",
        entitlements: Optional[List[str]] = None
    ) -> UserSubscription:
        """
        Grant a subscription to a user.
        Either plan_id OR duration_days must be provided.

        Args:
            entitlements: List of feature entitlements to grant.
                         Valid: future_7_day, weekly_forecast, monthly_forecast,
                                yearly_forecast, remove_ads, premium_annual
                         If None or empty, defaults to premium_annual (all features).
        """
        # Get duration from plan or use custom duration
        if plan_id:
            plan = self.get_plan(plan_id)
            if not plan:
                raise ValueError(f"Plan {plan_id} not found")
            days = plan.duration_days
        elif duration_days:
            days = duration_days
        else:
            raise ValueError("Either plan_id or duration_days must be provided")

        # Check for existing active subscription
        existing = self.get_active_subscription(user_id)

        # Calculate start and end dates
        if existing:
            # Extend from current expiry
            starts_at = existing.expires_at
        else:
            starts_at = datetime.utcnow()

        expires_at = starts_at + timedelta(days=days)

        # Default to premium_annual if no entitlements specified
        if not entitlements:
            entitlements = ["premium_annual"]

        # Create subscription record
        subscription = UserSubscription(
            user_id=user_id,
            plan_id=plan_id,
            starts_at=starts_at,
            expires_at=expires_at,
            status="active",
            source=source,
            granted_by_admin_id=admin_id,
            grant_reason=reason,
            notes=notes,
        )
        subscription.set_entitlements(entitlements)
        self.db.add(subscription)

        # If extending existing subscription, update the old one
        if existing:
            existing.status = "extended"
            existing.notes = (existing.notes or "") + f"\nExtended on {datetime.utcnow().isoformat()}"

        self.db.commit()
        self.db.refresh(subscription)

        # Log the action if admin granted
        if admin_id:
            self._log_admin_action(
                admin_id=admin_id,
                action="subscription_granted",
                target_type="user",
                target_id=user_id,
                details={
                    "plan_id": plan_id,
                    "duration_days": days,
                    "expires_at": expires_at.isoformat(),
                    "reason": reason,
                    "entitlements": subscription.get_entitlements(),
                }
            )

        # Log payment/transaction for financial tracking
        plan_price = plan.price if plan else 0
        payment = Payment(
            user_id=user_id,
            amount=plan_price,
            currency="USD",
            transaction_type="admin_grant" if source == "admin_grant" else "purchase",
            source=source,
            plan_id=plan_id,
            subscription_id=subscription.id,
            admin_id=admin_id,
            notes=reason,
            status="completed"
        )
        self.db.add(payment)
        self.db.commit()

        return subscription

    def get_active_subscription(self, user_id: int) -> Optional[UserSubscription]:
        """Get the current active subscription for a user."""
        return self.db.query(UserSubscription).filter(
            and_(
                UserSubscription.user_id == user_id,
                UserSubscription.status == "active",
                UserSubscription.expires_at > datetime.utcnow()
            )
        ).order_by(UserSubscription.expires_at.desc()).first()

    def get_user_subscriptions(self, user_id: int) -> List[UserSubscription]:
        """Get all subscriptions for a user (history)."""
        return self.db.query(UserSubscription).filter(
            UserSubscription.user_id == user_id
        ).order_by(UserSubscription.created_at.desc()).all()

    def get_user_subscription_status(self, user_id: int) -> Dict[str, Any]:
        """Get comprehensive subscription status for a user."""
        active = self.get_active_subscription(user_id)
        history = self.get_user_subscriptions(user_id)

        # Get entitlements from active subscription
        entitlements = active.get_entitlements() if active else []
        has_premium = "premium_annual" in entitlements

        return {
            "is_premium": active is not None,
            "active_subscription": self._subscription_to_dict(active) if active else None,
            "days_remaining": active.days_remaining if active else 0,
            "expires_at": active.expires_at.isoformat() if active else None,
            "total_subscriptions": len(history),
            "history": [self._subscription_to_dict(s) for s in history[:10]],  # Last 10
            # Granular entitlements for mobile app
            "entitlements": entitlements,
            "has_future_7_day": has_premium or "future_7_day" in entitlements,
            "has_weekly_forecast": has_premium or "weekly_forecast" in entitlements,
            "has_monthly_forecast": has_premium or "monthly_forecast" in entitlements,
            "has_yearly_forecast": has_premium or "yearly_forecast" in entitlements,
            "has_remove_ads": has_premium or "remove_ads" in entitlements,
            "has_screenshot_mode": "screenshot_mode" in entitlements,  # Dev mode - NOT included in premium_annual
            "has_premium_annual": has_premium,
        }

    def cancel_subscription(
        self,
        subscription_id: int,
        admin_id: Optional[int] = None,
        reason: Optional[str] = None
    ) -> Optional[UserSubscription]:
        """Cancel an active subscription."""
        subscription = self.db.query(UserSubscription).filter(
            UserSubscription.id == subscription_id
        ).first()

        if not subscription:
            return None

        subscription.status = "cancelled"
        subscription.notes = (subscription.notes or "") + f"\nCancelled: {reason or 'No reason provided'}"
        subscription.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(subscription)

        if admin_id:
            self._log_admin_action(
                admin_id=admin_id,
                action="subscription_cancelled",
                target_type="subscription",
                target_id=subscription_id,
                details={"user_id": subscription.user_id, "reason": reason}
            )

        return subscription

    def refund_subscription(
        self,
        subscription_id: int,
        admin_id: Optional[int] = None,
        reason: Optional[str] = None
    ) -> Optional[UserSubscription]:
        """Mark a subscription as refunded."""
        subscription = self.db.query(UserSubscription).filter(
            UserSubscription.id == subscription_id
        ).first()

        if not subscription:
            return None

        subscription.status = "refunded"
        subscription.notes = (subscription.notes or "") + f"\nRefunded: {reason or 'No reason provided'}"
        subscription.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(subscription)

        if admin_id:
            self._log_admin_action(
                admin_id=admin_id,
                action="subscription_refunded",
                target_type="subscription",
                target_id=subscription_id,
                details={
                    "user_id": subscription.user_id,
                    "amount": subscription.amount_paid,
                    "reason": reason
                }
            )

        return subscription

    # ==================== Statistics ====================

    def get_subscription_stats(self) -> Dict[str, Any]:
        """Get overall subscription statistics."""
        now = datetime.utcnow()

        # Total active subscriptions
        active_count = self.db.query(func.count(UserSubscription.id)).filter(
            and_(
                UserSubscription.status == "active",
                UserSubscription.expires_at > now
            )
        ).scalar() or 0

        # Total revenue (from paid subscriptions)
        total_revenue = self.db.query(func.sum(UserSubscription.amount_paid)).filter(
            UserSubscription.source != "admin_grant"
        ).scalar() or 0

        # Subscriptions by source
        by_source = self.db.query(
            UserSubscription.source,
            func.count(UserSubscription.id)
        ).group_by(UserSubscription.source).all()

        # Subscriptions by plan
        by_plan = self.db.query(
            SubscriptionPlan.name,
            func.count(UserSubscription.id)
        ).join(SubscriptionPlan, UserSubscription.plan_id == SubscriptionPlan.id).group_by(
            SubscriptionPlan.name
        ).all()

        # Recent grants (last 30 days)
        thirty_days_ago = now - timedelta(days=30)
        recent_grants = self.db.query(func.count(UserSubscription.id)).filter(
            and_(
                UserSubscription.source == "admin_grant",
                UserSubscription.created_at >= thirty_days_ago
            )
        ).scalar() or 0

        # Expiring soon (next 7 days)
        seven_days = now + timedelta(days=7)
        expiring_soon = self.db.query(func.count(UserSubscription.id)).filter(
            and_(
                UserSubscription.status == "active",
                UserSubscription.expires_at > now,
                UserSubscription.expires_at <= seven_days
            )
        ).scalar() or 0

        return {
            "active_subscriptions": active_count,
            "total_revenue": round(total_revenue, 2),
            "by_source": {s[0]: s[1] for s in by_source},
            "by_plan": {p[0]: p[1] for p in by_plan if p[0]},
            "recent_admin_grants": recent_grants,
            "expiring_in_7_days": expiring_soon,
        }

    # ==================== Helper Methods ====================

    def _plan_to_dict(self, plan: SubscriptionPlan) -> Dict[str, Any]:
        """Convert SubscriptionPlan to dictionary."""
        return {
            "id": plan.id,
            "name": plan.name,
            "duration_days": plan.duration_days,
            "price": plan.price,
            "description": plan.description,
            "is_active": plan.is_active,
            "created_at": plan.created_at.isoformat() if plan.created_at else None,
        }

    def _subscription_to_dict(self, sub: UserSubscription) -> Dict[str, Any]:
        """Convert UserSubscription to dictionary."""
        return {
            "id": sub.id,
            "user_id": sub.user_id,
            "plan_id": sub.plan_id,
            "plan_name": sub.plan.name if sub.plan else None,
            "starts_at": sub.starts_at.isoformat() if sub.starts_at else None,
            "expires_at": sub.expires_at.isoformat() if sub.expires_at else None,
            "status": sub.status,
            "source": sub.source,
            "amount_paid": sub.amount_paid,
            "currency": sub.currency,
            "payment_provider": sub.payment_provider,
            "transaction_id": sub.transaction_id,
            "granted_by_admin_id": sub.granted_by_admin_id,
            "grant_reason": sub.grant_reason,
            "notes": sub.notes,
            "is_active": sub.is_active,
            "days_remaining": sub.days_remaining,
            "created_at": sub.created_at.isoformat() if sub.created_at else None,
            "entitlements": sub.get_entitlements(),
        }

    def _log_admin_action(
        self,
        admin_id: int,
        action: str,
        target_type: str,
        target_id: int,
        details: Dict
    ):
        """Log an admin action to the audit log."""
        log = AdminAuditLog(
            admin_id=admin_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=json.dumps(details),
        )
        self.db.add(log)
        self.db.commit()
