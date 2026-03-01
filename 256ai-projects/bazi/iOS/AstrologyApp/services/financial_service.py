"""
Financial Service for revenue tracking and transaction management.
Handles payment logging, revenue statistics, and financial reporting.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
import json

from models import Payment, User, SubscriptionPlan, UserSubscription, AdminUser


class FinancialService:
    """Service class for financial operations and reporting."""

    def __init__(self, db: Session):
        self.db = db

    # ==================== Payment Logging ====================

    def log_payment(
        self,
        user_id: int,
        amount: float,
        transaction_type: str,
        source: str,
        currency: str = "USD",
        product_id: Optional[str] = None,
        plan_id: Optional[int] = None,
        subscription_id: Optional[int] = None,
        external_transaction_id: Optional[str] = None,
        external_customer_id: Optional[str] = None,
        admin_id: Optional[int] = None,
        notes: Optional[str] = None,
        status: str = "completed",
        metadata: Optional[Dict] = None
    ) -> Payment:
        """Log a financial transaction."""
        payment = Payment(
            user_id=user_id,
            amount=amount,
            currency=currency,
            transaction_type=transaction_type,
            source=source,
            product_id=product_id,
            plan_id=plan_id,
            subscription_id=subscription_id,
            external_transaction_id=external_transaction_id,
            external_customer_id=external_customer_id,
            admin_id=admin_id,
            notes=notes,
            status=status,
            metadata=json.dumps(metadata) if metadata else None
        )
        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        return payment

    def log_refund(
        self,
        original_payment_id: int,
        refund_amount: float,
        admin_id: Optional[int] = None,
        reason: Optional[str] = None
    ) -> Payment:
        """Log a refund transaction."""
        original = self.db.query(Payment).filter(Payment.id == original_payment_id).first()
        if not original:
            raise ValueError(f"Original payment {original_payment_id} not found")

        # Update original payment status
        original.status = "refunded"
        original.updated_at = datetime.utcnow()

        # Create refund record (negative amount)
        refund = Payment(
            user_id=original.user_id,
            amount=-abs(refund_amount),  # Ensure negative
            currency=original.currency,
            transaction_type="refund",
            source=original.source,
            product_id=original.product_id,
            plan_id=original.plan_id,
            subscription_id=original.subscription_id,
            admin_id=admin_id,
            notes=reason or f"Refund for payment #{original_payment_id}",
            status="completed",
            metadata=json.dumps({"original_payment_id": original_payment_id})
        )
        self.db.add(refund)
        self.db.commit()
        self.db.refresh(refund)
        return refund

    # ==================== Revenue Statistics ====================

    def get_revenue_overview(self) -> Dict[str, Any]:
        """Get overall revenue statistics."""
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())
        month_start = today_start.replace(day=1)
        year_start = today_start.replace(month=1, day=1)

        # Total revenue (all time)
        total_revenue = self.db.query(func.sum(Payment.amount)).filter(
            Payment.status == "completed"
        ).scalar() or 0

        # Revenue today
        revenue_today = self.db.query(func.sum(Payment.amount)).filter(
            and_(
                Payment.status == "completed",
                Payment.created_at >= today_start
            )
        ).scalar() or 0

        # Revenue this week
        revenue_week = self.db.query(func.sum(Payment.amount)).filter(
            and_(
                Payment.status == "completed",
                Payment.created_at >= week_start
            )
        ).scalar() or 0

        # Revenue this month
        revenue_month = self.db.query(func.sum(Payment.amount)).filter(
            and_(
                Payment.status == "completed",
                Payment.created_at >= month_start
            )
        ).scalar() or 0

        # Revenue this year
        revenue_year = self.db.query(func.sum(Payment.amount)).filter(
            and_(
                Payment.status == "completed",
                Payment.created_at >= year_start
            )
        ).scalar() or 0

        # Transaction counts
        total_transactions = self.db.query(func.count(Payment.id)).filter(
            Payment.status == "completed"
        ).scalar() or 0

        transactions_today = self.db.query(func.count(Payment.id)).filter(
            and_(
                Payment.status == "completed",
                Payment.created_at >= today_start
            )
        ).scalar() or 0

        # Refund totals
        total_refunds = self.db.query(func.sum(Payment.amount)).filter(
            and_(
                Payment.transaction_type == "refund",
                Payment.status == "completed"
            )
        ).scalar() or 0

        return {
            "total_revenue": round(total_revenue, 2),
            "revenue_today": round(revenue_today, 2),
            "revenue_week": round(revenue_week, 2),
            "revenue_month": round(revenue_month, 2),
            "revenue_year": round(revenue_year, 2),
            "total_transactions": total_transactions,
            "transactions_today": transactions_today,
            "total_refunds": round(abs(total_refunds), 2),
            "net_revenue": round(total_revenue, 2),  # Already includes refunds as negative
        }

    def get_revenue_by_source(self) -> List[Dict[str, Any]]:
        """Get revenue breakdown by source (RevenueCat, Stripe, etc.)."""
        results = self.db.query(
            Payment.source,
            func.sum(Payment.amount).label("total"),
            func.count(Payment.id).label("count")
        ).filter(
            Payment.status == "completed"
        ).group_by(Payment.source).all()

        total = sum(r.total for r in results if r.total)

        return [
            {
                "source": r.source,
                "total": round(r.total or 0, 2),
                "count": r.count,
                "percentage": round((r.total / total * 100) if total > 0 else 0, 1)
            }
            for r in results
        ]

    def get_revenue_by_plan(self) -> List[Dict[str, Any]]:
        """Get revenue breakdown by subscription plan."""
        results = self.db.query(
            SubscriptionPlan.name,
            func.sum(Payment.amount).label("total"),
            func.count(Payment.id).label("count")
        ).join(
            SubscriptionPlan, Payment.plan_id == SubscriptionPlan.id
        ).filter(
            Payment.status == "completed"
        ).group_by(SubscriptionPlan.name).all()

        # Also get payments without a plan
        no_plan = self.db.query(
            func.sum(Payment.amount).label("total"),
            func.count(Payment.id).label("count")
        ).filter(
            and_(
                Payment.status == "completed",
                Payment.plan_id == None
            )
        ).first()

        total = sum(r.total for r in results if r.total) + (no_plan.total or 0)

        breakdown = [
            {
                "plan": r.name,
                "total": round(r.total or 0, 2),
                "count": r.count,
                "percentage": round((r.total / total * 100) if total > 0 else 0, 1)
            }
            for r in results
        ]

        if no_plan.total and no_plan.total > 0:
            breakdown.append({
                "plan": "Other/Custom",
                "total": round(no_plan.total, 2),
                "count": no_plan.count,
                "percentage": round((no_plan.total / total * 100) if total > 0 else 0, 1)
            })

        return breakdown

    def get_revenue_by_type(self) -> List[Dict[str, Any]]:
        """Get revenue breakdown by transaction type."""
        results = self.db.query(
            Payment.transaction_type,
            func.sum(Payment.amount).label("total"),
            func.count(Payment.id).label("count")
        ).filter(
            Payment.status == "completed"
        ).group_by(Payment.transaction_type).all()

        return [
            {
                "type": r.transaction_type,
                "total": round(r.total or 0, 2),
                "count": r.count
            }
            for r in results
        ]

    def get_revenue_over_time(self, days: int = 30) -> List[Dict[str, Any]]:
        """Get daily revenue for the last N days."""
        now = datetime.utcnow()
        start_date = now - timedelta(days=days)

        # Query daily totals
        results = self.db.query(
            func.date(Payment.created_at).label("date"),
            func.sum(Payment.amount).label("total"),
            func.count(Payment.id).label("count")
        ).filter(
            and_(
                Payment.status == "completed",
                Payment.created_at >= start_date
            )
        ).group_by(func.date(Payment.created_at)).order_by("date").all()

        # Create a map of existing data
        data_map = {str(r.date): {"total": round(r.total or 0, 2), "count": r.count} for r in results}

        # Fill in missing days with zeros
        daily_data = []
        current = start_date.date()
        end = now.date()
        while current <= end:
            date_str = str(current)
            if date_str in data_map:
                daily_data.append({
                    "date": date_str,
                    "revenue": data_map[date_str]["total"],
                    "transactions": data_map[date_str]["count"]
                })
            else:
                daily_data.append({
                    "date": date_str,
                    "revenue": 0,
                    "transactions": 0
                })
            current += timedelta(days=1)

        return daily_data

    def get_monthly_revenue(self, months: int = 12) -> List[Dict[str, Any]]:
        """Get monthly revenue for the last N months."""
        now = datetime.utcnow()

        monthly_data = []
        for i in range(months - 1, -1, -1):
            # Calculate month start/end
            month_date = now - timedelta(days=i * 30)
            month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if month_start.month == 12:
                month_end = month_start.replace(year=month_start.year + 1, month=1)
            else:
                month_end = month_start.replace(month=month_start.month + 1)

            # Query revenue for this month
            revenue = self.db.query(func.sum(Payment.amount)).filter(
                and_(
                    Payment.status == "completed",
                    Payment.created_at >= month_start,
                    Payment.created_at < month_end
                )
            ).scalar() or 0

            count = self.db.query(func.count(Payment.id)).filter(
                and_(
                    Payment.status == "completed",
                    Payment.created_at >= month_start,
                    Payment.created_at < month_end
                )
            ).scalar() or 0

            monthly_data.append({
                "month": month_start.strftime("%Y-%m"),
                "month_name": month_start.strftime("%b %Y"),
                "revenue": round(revenue, 2),
                "transactions": count
            })

        return monthly_data

    # ==================== Transaction Logs ====================

    def get_transactions(
        self,
        page: int = 1,
        per_page: int = 20,
        user_id: Optional[int] = None,
        transaction_type: Optional[str] = None,
        source: Optional[str] = None,
        status: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get paginated transaction log with filters."""
        query = self.db.query(Payment)

        # Apply filters
        if user_id:
            query = query.filter(Payment.user_id == user_id)
        if transaction_type:
            query = query.filter(Payment.transaction_type == transaction_type)
        if source:
            query = query.filter(Payment.source == source)
        if status:
            query = query.filter(Payment.status == status)
        if start_date:
            query = query.filter(Payment.created_at >= start_date)
        if end_date:
            query = query.filter(Payment.created_at <= end_date)

        # Get total count
        total = query.count()

        # Get paginated results
        payments = query.order_by(desc(Payment.created_at)).offset(
            (page - 1) * per_page
        ).limit(per_page).all()

        return {
            "transactions": [self._payment_to_dict(p) for p in payments],
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page
        }

    def get_recent_transactions(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get most recent transactions."""
        payments = self.db.query(Payment).order_by(
            desc(Payment.created_at)
        ).limit(limit).all()

        return [self._payment_to_dict(p) for p in payments]

    # ==================== Helper Methods ====================

    def _payment_to_dict(self, payment: Payment) -> Dict[str, Any]:
        """Convert Payment to dictionary."""
        return {
            "id": payment.id,
            "user_id": payment.user_id,
            "user_name": payment.user.name if payment.user else None,
            "user_email": payment.user.email if payment.user else None,
            "amount": payment.amount,
            "currency": payment.currency,
            "transaction_type": payment.transaction_type,
            "source": payment.source,
            "product_id": payment.product_id,
            "plan_id": payment.plan_id,
            "plan_name": payment.plan.name if payment.plan else None,
            "subscription_id": payment.subscription_id,
            "external_transaction_id": payment.external_transaction_id,
            "status": payment.status,
            "admin_id": payment.admin_id,
            "admin_name": payment.admin.name if payment.admin else None,
            "notes": payment.notes,
            "created_at": payment.created_at.isoformat() if payment.created_at else None,
        }
