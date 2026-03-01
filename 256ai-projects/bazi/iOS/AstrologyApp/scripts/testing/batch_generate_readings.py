#!/usr/bin/env python3
"""
Batch Generate Readings Script

Pre-generates all reading types for test users to warm the cache.
Usage: python batch_generate_readings.py [--type daily|weekly|monthly|yearly|all] [--user-ids 4,5,6]
"""

import sys
import os
import argparse
import time
from datetime import date, datetime

# Add parent directories to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from models import get_db, User
from models.daily_reading import DailyReading
from models.weekly_reading import WeeklyReading
from models.monthly_reading import MonthlyReading
from models.yearly_reading import YearlyReading


def get_test_users(db, user_ids=None):
    """Get test users to generate readings for."""
    if user_ids:
        users = db.query(User).filter(User.id.in_(user_ids)).all()
    else:
        # Get all test users (auth_provider = 'test')
        users = db.query(User).filter(User.auth_provider == "test").all()
        if not users:
            # Fallback: get all users except ID 1-3 (assumed real users)
            users = db.query(User).filter(User.id > 3).all()
    return users


def generate_daily_readings(db, users, target_date=None):
    """Generate daily readings for all users."""
    # Import here to avoid circular imports
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

    target_date = target_date or date.today()
    print(f"\nGenerating DAILY readings for {len(users)} users (date: {target_date})...")

    success = 0
    failed = 0
    cached = 0

    for i, user in enumerate(users):
        # Check if already cached
        existing = db.query(DailyReading).filter_by(
            user_id=user.id,
            date=target_date
        ).first()

        if existing:
            print(f"  [{i+1}/{len(users)}] User {user.id} ({user.name}): CACHED")
            cached += 1
            continue

        try:
            start = time.time()

            # Import and call generation function
            from app import generate_daily_reading_for_user
            reading = generate_daily_reading_for_user(user, target_date)

            if reading:
                db.add(reading)
                db.commit()
                elapsed = time.time() - start
                print(f"  [{i+1}/{len(users)}] User {user.id} ({user.name}): OK ({elapsed:.1f}s)")
                success += 1
            else:
                print(f"  [{i+1}/{len(users)}] User {user.id} ({user.name}): FAILED (no reading)")
                failed += 1

        except Exception as e:
            print(f"  [{i+1}/{len(users)}] User {user.id} ({user.name}): ERROR - {e}")
            db.rollback()
            failed += 1

    return {"success": success, "failed": failed, "cached": cached}


def generate_weekly_readings(db, users):
    """Generate weekly readings for all users."""
    from app import generate_weekly_reading_for_user, get_current_week_start

    week_start = get_current_week_start()
    print(f"\nGenerating WEEKLY readings for {len(users)} users (week: {week_start})...")

    success = 0
    failed = 0
    cached = 0

    for i, user in enumerate(users):
        existing = db.query(WeeklyReading).filter_by(
            user_id=user.id,
            week_start=week_start
        ).first()

        if existing:
            print(f"  [{i+1}/{len(users)}] User {user.id} ({user.name}): CACHED")
            cached += 1
            continue

        try:
            start = time.time()
            reading = generate_weekly_reading_for_user(user, week_start)

            if reading:
                db.add(reading)
                db.commit()
                elapsed = time.time() - start
                print(f"  [{i+1}/{len(users)}] User {user.id} ({user.name}): OK ({elapsed:.1f}s)")
                success += 1
            else:
                print(f"  [{i+1}/{len(users)}] User {user.id} ({user.name}): FAILED")
                failed += 1

        except Exception as e:
            print(f"  [{i+1}/{len(users)}] User {user.id} ({user.name}): ERROR - {e}")
            db.rollback()
            failed += 1

    return {"success": success, "failed": failed, "cached": cached}


def generate_monthly_readings(db, users):
    """Generate monthly readings for all users."""
    from app import generate_monthly_reading_for_user, get_current_month_start

    month_start = get_current_month_start()
    print(f"\nGenerating MONTHLY readings for {len(users)} users (month: {month_start})...")

    success = 0
    failed = 0
    cached = 0

    for i, user in enumerate(users):
        existing = db.query(MonthlyReading).filter_by(
            user_id=user.id,
            month_start=month_start
        ).first()

        if existing:
            print(f"  [{i+1}/{len(users)}] User {user.id} ({user.name}): CACHED")
            cached += 1
            continue

        try:
            start = time.time()
            reading = generate_monthly_reading_for_user(user, month_start)

            if reading:
                db.add(reading)
                db.commit()
                elapsed = time.time() - start
                print(f"  [{i+1}/{len(users)}] User {user.id} ({user.name}): OK ({elapsed:.1f}s)")
                success += 1
            else:
                print(f"  [{i+1}/{len(users)}] User {user.id} ({user.name}): FAILED")
                failed += 1

        except Exception as e:
            print(f"  [{i+1}/{len(users)}] User {user.id} ({user.name}): ERROR - {e}")
            db.rollback()
            failed += 1

    return {"success": success, "failed": failed, "cached": cached}


def generate_yearly_readings(db, users):
    """Generate yearly readings for all users."""
    from app import generate_yearly_reading_for_user

    year = date.today().year
    print(f"\nGenerating YEARLY readings for {len(users)} users (year: {year})...")

    success = 0
    failed = 0
    cached = 0

    for i, user in enumerate(users):
        existing = db.query(YearlyReading).filter_by(
            user_id=user.id,
            year=year
        ).first()

        if existing:
            print(f"  [{i+1}/{len(users)}] User {user.id} ({user.name}): CACHED")
            cached += 1
            continue

        try:
            start = time.time()
            reading = generate_yearly_reading_for_user(user, year)

            if reading:
                db.add(reading)
                db.commit()
                elapsed = time.time() - start
                print(f"  [{i+1}/{len(users)}] User {user.id} ({user.name}): OK ({elapsed:.1f}s)")
                success += 1
            else:
                print(f"  [{i+1}/{len(users)}] User {user.id} ({user.name}): FAILED")
                failed += 1

        except Exception as e:
            print(f"  [{i+1}/{len(users)}] User {user.id} ({user.name}): ERROR - {e}")
            db.rollback()
            failed += 1

    return {"success": success, "failed": failed, "cached": cached}


def main():
    parser = argparse.ArgumentParser(description="Batch generate readings for test users")
    parser.add_argument("--type", choices=["daily", "weekly", "monthly", "yearly", "all"],
                        default="all", help="Type of reading to generate")
    parser.add_argument("--user-ids", type=str, help="Comma-separated list of user IDs")
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
    print(f"Batch Reading Generation")
    print(f"{'='*60}")
    print(f"Users: {len(users)}")
    print(f"Type: {args.type}")
    print(f"User IDs: {[u.id for u in users]}")

    results = {}
    total_start = time.time()

    if args.type in ("daily", "all"):
        results["daily"] = generate_daily_readings(db, users)

    if args.type in ("weekly", "all"):
        results["weekly"] = generate_weekly_readings(db, users)

    if args.type in ("monthly", "all"):
        results["monthly"] = generate_monthly_readings(db, users)

    if args.type in ("yearly", "all"):
        results["yearly"] = generate_yearly_readings(db, users)

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
