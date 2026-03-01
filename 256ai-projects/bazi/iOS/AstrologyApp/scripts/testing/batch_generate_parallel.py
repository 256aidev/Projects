#!/usr/bin/env python3
"""
Parallel Batch Generate Readings Script

Pre-generates all reading types using concurrent requests to maximize Ollama throughput.
Usage: python batch_generate_parallel.py [--type daily|weekly|monthly|yearly|all] [--workers 16]
"""

import sys
import os
import argparse
import time
from datetime import date, datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

# Add parent directories to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from models import get_db, User, Base
from models.daily_reading import DailyReading
from models.weekly_reading import WeeklyReading
from models.monthly_reading import MonthlyReading
from models.yearly_reading import YearlyReading

# Create engine with larger pool for parallel workers
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://bazi:bazipass@localhost:5432/bazi")
engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=30,
    pool_timeout=60,
    pool_pre_ping=True
)
SessionFactory = sessionmaker(bind=engine)
ScopedSession = scoped_session(SessionFactory)

def get_thread_db():
    """Get a thread-local database session."""
    return ScopedSession()


def get_test_users(db, user_ids=None):
    """Get test users to generate readings for."""
    if user_ids:
        users = db.query(User).filter(User.id.in_(user_ids)).all()
    else:
        users = db.query(User).filter(User.auth_provider == "test").all()
        if not users:
            users = db.query(User).filter(User.id > 3).all()
    return users


def generate_single_daily(user_id, user_name, target_date):
    """Generate a single daily reading (thread-safe)."""
    from app import generate_daily_reading_for_user

    db = get_thread_db()
    try:
        user = db.query(User).filter(User.id == user_id).first()

        # Check cache
        existing = db.query(DailyReading).filter_by(user_id=user_id, date=target_date).first()
        if existing:
            return {"user_id": user_id, "status": "cached", "time": 0}

        start = time.time()
        reading = generate_daily_reading_for_user(user, target_date)
        elapsed = time.time() - start

        if reading:
            db.add(reading)
            db.commit()
            return {"user_id": user_id, "status": "success", "time": elapsed}
        else:
            return {"user_id": user_id, "status": "failed", "time": elapsed}
    except Exception as e:
        db.rollback()
        return {"user_id": user_id, "status": "error", "error": str(e), "time": 0}
    finally:
        ScopedSession.remove()


def generate_single_weekly(user_id, user_name, week_start):
    """Generate a single weekly reading (thread-safe)."""
    from app import generate_weekly_reading_for_user

    db = get_thread_db()
    try:
        user = db.query(User).filter(User.id == user_id).first()

        existing = db.query(WeeklyReading).filter_by(user_id=user_id, week_start=week_start).first()
        if existing:
            return {"user_id": user_id, "status": "cached", "time": 0}

        start = time.time()
        reading = generate_weekly_reading_for_user(user, week_start)
        elapsed = time.time() - start

        if reading:
            db.add(reading)
            db.commit()
            return {"user_id": user_id, "status": "success", "time": elapsed}
        else:
            return {"user_id": user_id, "status": "failed", "time": elapsed}
    except Exception as e:
        db.rollback()
        return {"user_id": user_id, "status": "error", "error": str(e), "time": 0}
    finally:
        ScopedSession.remove()


def generate_single_monthly(user_id, user_name, month_start):
    """Generate a single monthly reading (thread-safe)."""
    from app import generate_monthly_reading_for_user

    db = get_thread_db()
    try:
        user = db.query(User).filter(User.id == user_id).first()

        existing = db.query(MonthlyReading).filter_by(user_id=user_id, month_start=month_start).first()
        if existing:
            return {"user_id": user_id, "status": "cached", "time": 0}

        start = time.time()
        reading = generate_monthly_reading_for_user(user, month_start)
        elapsed = time.time() - start

        if reading:
            db.add(reading)
            db.commit()
            return {"user_id": user_id, "status": "success", "time": elapsed}
        else:
            return {"user_id": user_id, "status": "failed", "time": elapsed}
    except Exception as e:
        db.rollback()
        return {"user_id": user_id, "status": "error", "error": str(e), "time": 0}
    finally:
        ScopedSession.remove()


def generate_single_yearly(user_id, user_name, year):
    """Generate a single yearly reading (thread-safe)."""
    from app import generate_yearly_reading_for_user

    db = get_thread_db()
    try:
        user = db.query(User).filter(User.id == user_id).first()

        existing = db.query(YearlyReading).filter_by(user_id=user_id, year=year).first()
        if existing:
            return {"user_id": user_id, "status": "cached", "time": 0}

        start = time.time()
        reading = generate_yearly_reading_for_user(user, year)
        elapsed = time.time() - start

        if reading:
            db.add(reading)
            db.commit()
            return {"user_id": user_id, "status": "success", "time": elapsed}
        else:
            return {"user_id": user_id, "status": "failed", "time": elapsed}
    except Exception as e:
        db.rollback()
        return {"user_id": user_id, "status": "error", "error": str(e), "time": 0}
    finally:
        ScopedSession.remove()


def generate_parallel(users, reading_type, workers, period_value):
    """Generate readings in parallel using ThreadPoolExecutor."""
    print(f"\nGenerating {reading_type.upper()} readings for {len(users)} users with {workers} workers...")

    results = {"success": 0, "failed": 0, "cached": 0, "errors": []}
    start_time = time.time()

    # Select generator function
    generators = {
        "daily": generate_single_daily,
        "weekly": generate_single_weekly,
        "monthly": generate_single_monthly,
        "yearly": generate_single_yearly,
    }
    generator = generators[reading_type]

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {}
        for user in users:
            future = executor.submit(generator, user.id, user.name, period_value)
            futures[future] = user

        completed = 0
        for future in as_completed(futures):
            user = futures[future]
            result = future.result()
            completed += 1

            status = result["status"]
            if status == "success":
                results["success"] += 1
                print(f"  [{completed}/{len(users)}] User {result['user_id']}: OK ({result['time']:.1f}s)")
            elif status == "cached":
                results["cached"] += 1
                print(f"  [{completed}/{len(users)}] User {result['user_id']}: CACHED")
            elif status == "failed":
                results["failed"] += 1
                print(f"  [{completed}/{len(users)}] User {result['user_id']}: FAILED")
            else:
                results["failed"] += 1
                results["errors"].append(f"User {result['user_id']}: {result.get('error', 'Unknown')}")
                print(f"  [{completed}/{len(users)}] User {result['user_id']}: ERROR - {result.get('error', 'Unknown')}")

    elapsed = time.time() - start_time
    print(f"  Completed {reading_type} in {elapsed:.1f}s ({elapsed/60:.1f} min)")

    return results


def main():
    parser = argparse.ArgumentParser(description="Parallel batch generate readings")
    parser.add_argument("--type", choices=["daily", "weekly", "monthly", "yearly", "all"],
                        default="all", help="Type of reading to generate")
    parser.add_argument("--user-ids", type=str, help="Comma-separated list of user IDs")
    parser.add_argument("--workers", "-w", type=int, default=16,
                        help="Number of parallel workers (default: 16)")
    args = parser.parse_args()

    user_ids = None
    if args.user_ids:
        user_ids = [int(x.strip()) for x in args.user_ids.split(",")]

    db = next(get_db())
    users = get_test_users(db, user_ids)

    if not users:
        print("No test users found. Run seed_test_users.py first.")
        return

    print(f"\n{'='*60}")
    print(f"PARALLEL Batch Reading Generation")
    print(f"{'='*60}")
    print(f"Users: {len(users)}")
    print(f"Workers: {args.workers}")
    print(f"Type: {args.type}")
    print(f"User IDs: {[u.id for u in users]}")

    # Get period values
    from app import get_current_week_start, get_current_month_start
    target_date = date.today()
    week_start = get_current_week_start()
    month_start = get_current_month_start()
    year = target_date.year

    results = {}
    total_start = time.time()

    if args.type in ("daily", "all"):
        results["daily"] = generate_parallel(users, "daily", args.workers, target_date)

    if args.type in ("weekly", "all"):
        results["weekly"] = generate_parallel(users, "weekly", args.workers, week_start)

    if args.type in ("monthly", "all"):
        results["monthly"] = generate_parallel(users, "monthly", args.workers, month_start)

    if args.type in ("yearly", "all"):
        results["yearly"] = generate_parallel(users, "yearly", args.workers, year)

    total_elapsed = time.time() - total_start

    print(f"\n{'='*60}")
    print(f"SUMMARY")
    print(f"{'='*60}")
    for rtype, stats in results.items():
        print(f"  {rtype.upper():10} - Success: {stats['success']}, Failed: {stats['failed']}, Cached: {stats['cached']}")
    print(f"\nTotal time: {total_elapsed:.1f}s ({total_elapsed/60:.1f} minutes)")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
