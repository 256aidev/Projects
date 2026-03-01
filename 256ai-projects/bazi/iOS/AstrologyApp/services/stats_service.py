"""
Stats Service for Admin Dashboard
Provides analytics and metrics for the admin console.
"""
from datetime import datetime, date, timedelta
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct, and_

from models import User, DailyReading, WeeklyReading


class StatsService:
    """Service class for calculating dashboard statistics."""

    def __init__(self, db: Session):
        self.db = db

    def get_overview_stats(self) -> Dict[str, Any]:
        """Get high-level overview statistics for the dashboard."""
        today = date.today()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)

        # Total users
        total_users = self.db.query(func.count(User.id)).scalar() or 0

        # Users registered today
        users_today = self.db.query(func.count(User.id)).filter(
            func.date(User.created_at) == today
        ).scalar() or 0

        # Users this week
        users_this_week = self.db.query(func.count(User.id)).filter(
            func.date(User.created_at) >= week_ago
        ).scalar() or 0

        # Users this month
        users_this_month = self.db.query(func.count(User.id)).filter(
            func.date(User.created_at) >= month_ago
        ).scalar() or 0

        # Active users (logged in within last 7 days)
        active_users = self.db.query(func.count(User.id)).filter(
            User.last_login >= datetime.utcnow() - timedelta(days=7)
        ).scalar() or 0

        # Total readings generated
        total_daily_readings = self.db.query(func.count(DailyReading.id)).scalar() or 0
        total_weekly_readings = self.db.query(func.count(WeeklyReading.id)).scalar() or 0

        # Readings generated today
        readings_today = self.db.query(func.count(DailyReading.id)).filter(
            DailyReading.date == today
        ).scalar() or 0

        return {
            "total_users": total_users,
            "users_today": users_today,
            "users_this_week": users_this_week,
            "users_this_month": users_this_month,
            "active_users_7d": active_users,
            "total_daily_readings": total_daily_readings,
            "total_weekly_readings": total_weekly_readings,
            "readings_today": readings_today,
        }

    def get_user_growth(self, days: int = 30) -> List[Dict[str, Any]]:
        """Get daily user signups for the last N days."""
        start_date = date.today() - timedelta(days=days - 1)

        # Query daily signups
        results = self.db.query(
            func.date(User.created_at).label("date"),
            func.count(User.id).label("count")
        ).filter(
            func.date(User.created_at) >= start_date
        ).group_by(
            func.date(User.created_at)
        ).order_by(
            func.date(User.created_at)
        ).all()

        # Create a map of date -> count
        count_map = {str(r.date): r.count for r in results}

        # Fill in missing dates with 0
        data = []
        current_date = start_date
        while current_date <= date.today():
            data.append({
                "date": str(current_date),
                "signups": count_map.get(str(current_date), 0)
            })
            current_date += timedelta(days=1)

        return data

    def get_auth_provider_breakdown(self) -> List[Dict[str, Any]]:
        """Get breakdown of users by authentication provider."""
        results = self.db.query(
            User.auth_provider,
            func.count(User.id).label("count")
        ).group_by(
            User.auth_provider
        ).all()

        total = sum(r.count for r in results)
        return [
            {
                "provider": r.auth_provider or "email",
                "count": r.count,
                "percentage": round((r.count / total * 100), 1) if total > 0 else 0
            }
            for r in results
        ]

    def get_retention_stats(self) -> Dict[str, Any]:
        """Get user retention metrics."""
        today = date.today()
        now = datetime.utcnow()

        # DAU - Users who logged in today
        dau = self.db.query(func.count(distinct(User.id))).filter(
            func.date(User.last_login) == today
        ).scalar() or 0

        # WAU - Users who logged in within last 7 days
        wau = self.db.query(func.count(distinct(User.id))).filter(
            User.last_login >= now - timedelta(days=7)
        ).scalar() or 0

        # MAU - Users who logged in within last 30 days
        mau = self.db.query(func.count(distinct(User.id))).filter(
            User.last_login >= now - timedelta(days=30)
        ).scalar() or 0

        # DAU/MAU ratio (stickiness)
        dau_mau_ratio = round((dau / mau * 100), 1) if mau > 0 else 0

        return {
            "dau": dau,
            "wau": wau,
            "mau": mau,
            "dau_mau_ratio": dau_mau_ratio,
        }

    def get_reading_stats(self, days: int = 30) -> Dict[str, Any]:
        """Get reading generation statistics."""
        start_date = date.today() - timedelta(days=days - 1)

        # Daily readings per day
        daily_results = self.db.query(
            DailyReading.date,
            func.count(DailyReading.id).label("count")
        ).filter(
            DailyReading.date >= start_date
        ).group_by(
            DailyReading.date
        ).order_by(
            DailyReading.date
        ).all()

        # Generation method breakdown
        method_results = self.db.query(
            DailyReading.generation_method,
            func.count(DailyReading.id).label("count")
        ).group_by(
            DailyReading.generation_method
        ).all()

        return {
            "daily_readings_by_date": [
                {"date": str(r.date), "count": r.count}
                for r in daily_results
            ],
            "generation_methods": [
                {"method": r.generation_method or "template", "count": r.count}
                for r in method_results
            ],
        }

    def get_recent_signups(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get most recent user signups."""
        users = self.db.query(User).order_by(
            User.created_at.desc()
        ).limit(limit).all()

        return [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "auth_provider": u.auth_provider,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ]

    def get_day_master_distribution(self) -> List[Dict[str, Any]]:
        """Get distribution of users by day master element."""
        results = self.db.query(
            User.day_master_element,
            func.count(User.id).label("count")
        ).filter(
            User.day_master_element.isnot(None)
        ).group_by(
            User.day_master_element
        ).all()

        total = sum(r.count for r in results)
        return [
            {
                "element": r.day_master_element,
                "count": r.count,
                "percentage": round((r.count / total * 100), 1) if total > 0 else 0
            }
            for r in results
        ]

    def search_users(
        self,
        query: Optional[str] = None,
        auth_provider: Optional[str] = None,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """Search and paginate users."""
        base_query = self.db.query(User)

        # Apply search filter
        if query:
            search_term = f"%{query}%"
            base_query = base_query.filter(
                (User.name.ilike(search_term)) |
                (User.email.ilike(search_term))
            )

        # Apply auth provider filter
        if auth_provider:
            base_query = base_query.filter(User.auth_provider == auth_provider)

        # Get total count
        total = base_query.count()

        # Apply pagination
        users = base_query.order_by(
            User.created_at.desc()
        ).offset(
            (page - 1) * per_page
        ).limit(per_page).all()

        return {
            "users": [self._user_to_dict(u) for u in users],
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page,
        }

    def get_user_detail(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get detailed user information including readings."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        # Get recent readings
        recent_daily = self.db.query(DailyReading).filter(
            DailyReading.user_id == user_id
        ).order_by(DailyReading.date.desc()).limit(7).all()

        recent_weekly = self.db.query(WeeklyReading).filter(
            WeeklyReading.user_id == user_id
        ).order_by(WeeklyReading.week_start.desc()).limit(4).all()

        # Get reading counts
        daily_count = self.db.query(func.count(DailyReading.id)).filter(
            DailyReading.user_id == user_id
        ).scalar() or 0

        weekly_count = self.db.query(func.count(WeeklyReading.id)).filter(
            WeeklyReading.user_id == user_id
        ).scalar() or 0

        return {
            "user": self._user_to_dict(user, include_bazi=True),
            "stats": {
                "total_daily_readings": daily_count,
                "total_weekly_readings": weekly_count,
            },
            "recent_daily_readings": [
                {
                    "id": r.id,
                    "date": str(r.date),
                    "daily_pillar": r.daily_pillar,
                    "generation_method": r.generation_method,
                }
                for r in recent_daily
            ],
            "recent_weekly_readings": [
                {
                    "id": r.id,
                    "week_start": str(r.week_start),
                    "llm_provider": r.llm_provider,
                }
                for r in recent_weekly
            ],
        }

    def _user_to_dict(self, user: User, include_bazi: bool = False) -> Dict[str, Any]:
        """Convert User model to dictionary."""
        data = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "auth_provider": user.auth_provider,
            "email_verified": user.email_verified,
            "language": user.language,
            "preferred_tone": user.preferred_tone,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.last_login.isoformat() if user.last_login else None,
        }

        if include_bazi:
            data.update({
                "birth_date": str(user.birth_date) if user.birth_date else None,
                "birth_time": str(user.birth_time) if user.birth_time else None,
                "birth_location": user.birth_location,
                "year_pillar": user.year_pillar,
                "month_pillar": user.month_pillar,
                "day_pillar": user.day_pillar,
                "hour_pillar": user.hour_pillar,
                "day_master": user.day_master,
                "day_master_element": user.day_master_element,
                "day_master_polarity": user.day_master_polarity,
                "year_ten_god": user.year_ten_god,
                "month_ten_god": user.month_ten_god,
                "hour_ten_god": user.hour_ten_god,
            })

        return data
