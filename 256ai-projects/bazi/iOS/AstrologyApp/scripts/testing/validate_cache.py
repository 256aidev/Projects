#!/usr/bin/env python3
"""
Validate Cache Script

Verifies that cached readings are being returned correctly and quickly.
Usage: python validate_cache.py [--user-ids 4,5,6]
"""

import sys
import os
import argparse
import time
import requests
from datetime import date

# Add parent directories to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from models import get_db, User
from models.daily_reading import DailyReading
from models.weekly_reading import WeeklyReading
from models.monthly_reading import MonthlyReading
from models.yearly_reading import YearlyReading

# API base URL
API_BASE = os.getenv("API_BASE", "http://localhost:8000")


def get_test_users(db, user_ids=None, limit=10):
    """Get test users to validate."""
    if user_ids:
        users = db.query(User).filter(User.id.in_(user_ids)).all()
    else:
        users = db.query(User).filter(User.auth_provider == "test").limit(limit).all()
        if not users:
            users = db.query(User).filter(User.id > 3).limit(limit).all()
    return users


def count_cached_readings(db, user_ids):
    """Count how many readings are cached for the given users."""
    today = date.today()

    # Get current period starts (simplified)
    from app import get_current_week_start, get_current_month_start
    week_start = get_current_week_start()
    month_start = get_current_month_start()
    year = today.year

    daily_count = db.query(DailyReading).filter(
        DailyReading.user_id.in_(user_ids),
        DailyReading.date == today
    ).count()

    weekly_count = db.query(WeeklyReading).filter(
        WeeklyReading.user_id.in_(user_ids),
        WeeklyReading.week_start == week_start
    ).count()

    monthly_count = db.query(MonthlyReading).filter(
        MonthlyReading.user_id.in_(user_ids),
        MonthlyReading.month_start == month_start
    ).count()

    yearly_count = db.query(YearlyReading).filter(
        YearlyReading.user_id.in_(user_ids),
        YearlyReading.year == year
    ).count()

    return {
        "daily": daily_count,
        "weekly": weekly_count,
        "monthly": monthly_count,
        "yearly": yearly_count,
    }


def test_api_response_time(user_id, endpoint_type):
    """Test API response time for a cached reading."""
    endpoints = {
        "daily": f"{API_BASE}/daily/{user_id}",
        "weekly": f"{API_BASE}/weekly/{user_id}",
        "monthly": f"{API_BASE}/monthly/{user_id}",
        "yearly": f"{API_BASE}/yearly/{user_id}",
    }

    url = endpoints.get(endpoint_type)
    if not url:
        return None, "Invalid endpoint type"

    try:
        start = time.time()
        response = requests.get(url, timeout=120)
        elapsed = time.time() - start

        if response.status_code == 200:
            data = response.json()
            content_length = len(data.get("content", ""))
            return {
                "status": "OK",
                "latency_ms": round(elapsed * 1000, 1),
                "content_length": content_length,
                "is_fast": elapsed < 1.0,  # Less than 1 second = cached
            }, None
        else:
            return {
                "status": "ERROR",
                "status_code": response.status_code,
                "latency_ms": round(elapsed * 1000, 1),
            }, response.text

    except requests.exceptions.Timeout:
        return {"status": "TIMEOUT"}, "Request timed out"
    except Exception as e:
        return {"status": "ERROR"}, str(e)


def validate_users(users, test_endpoints=True):
    """Validate cache for all users."""
    print(f"\n{'='*70}")
    print(f"Cache Validation Results")
    print(f"{'='*70}")

    results = {
        "daily": {"fast": 0, "slow": 0, "error": 0, "latencies": []},
        "weekly": {"fast": 0, "slow": 0, "error": 0, "latencies": []},
        "monthly": {"fast": 0, "slow": 0, "error": 0, "latencies": []},
        "yearly": {"fast": 0, "slow": 0, "error": 0, "latencies": []},
    }

    for i, user in enumerate(users):
        print(f"\n[{i+1}/{len(users)}] User {user.id} ({user.name}):")

        for etype in ["daily", "weekly", "monthly", "yearly"]:
            if test_endpoints:
                result, error = test_api_response_time(user.id, etype)

                if result and result.get("status") == "OK":
                    latency = result["latency_ms"]
                    is_fast = result["is_fast"]
                    results[etype]["latencies"].append(latency)

                    if is_fast:
                        results[etype]["fast"] += 1
                        status = f"FAST ({latency}ms)"
                    else:
                        results[etype]["slow"] += 1
                        status = f"SLOW ({latency}ms) - possibly regenerated"

                    print(f"    {etype:10}: {status}")
                else:
                    results[etype]["error"] += 1
                    print(f"    {etype:10}: ERROR - {error}")
            else:
                print(f"    {etype:10}: (skipped - API test disabled)")

    # Summary
    print(f"\n{'='*70}")
    print(f"SUMMARY")
    print(f"{'='*70}")

    for etype, stats in results.items():
        total = stats["fast"] + stats["slow"] + stats["error"]
        if total > 0:
            fast_pct = (stats["fast"] / total) * 100
            avg_latency = sum(stats["latencies"]) / len(stats["latencies"]) if stats["latencies"] else 0
            print(f"  {etype.upper():10} - Fast: {stats['fast']}, Slow: {stats['slow']}, Error: {stats['error']}")
            print(f"              Cache hit rate: {fast_pct:.1f}%, Avg latency: {avg_latency:.1f}ms")

    # Cache hit target
    total_fast = sum(s["fast"] for s in results.values())
    total_all = sum(s["fast"] + s["slow"] + s["error"] for s in results.values())
    if total_all > 0:
        overall_hit_rate = (total_fast / total_all) * 100
        print(f"\n  OVERALL CACHE HIT RATE: {overall_hit_rate:.1f}%")
        if overall_hit_rate >= 90:
            print(f"  STATUS: PASS (target: 90%+)")
        elif overall_hit_rate >= 70:
            print(f"  STATUS: ACCEPTABLE (target: 90%+)")
        else:
            print(f"  STATUS: NEEDS IMPROVEMENT (target: 90%+)")

    print(f"{'='*70}\n")

    return results


def main():
    parser = argparse.ArgumentParser(description="Validate cache for test users")
    parser.add_argument("--user-ids", type=str, help="Comma-separated list of user IDs")
    parser.add_argument("--limit", type=int, default=10, help="Max users to test")
    parser.add_argument("--no-api", action="store_true", help="Skip API response tests")
    parser.add_argument("--api-base", type=str, default="http://localhost:8000",
                        help="API base URL")
    args = parser.parse_args()

    global API_BASE
    API_BASE = args.api_base

    user_ids = None
    if args.user_ids:
        user_ids = [int(x.strip()) for x in args.user_ids.split(",")]

    db = next(get_db())
    users = get_test_users(db, user_ids, args.limit)

    if not users:
        print("No test users found. Run seed_test_users.py first.")
        return

    print(f"\n{'='*70}")
    print(f"Cache Validation")
    print(f"{'='*70}")
    print(f"API Base: {API_BASE}")
    print(f"Users: {len(users)}")
    print(f"User IDs: {[u.id for u in users]}")

    # Show cache stats
    user_id_list = [u.id for u in users]
    cache_counts = count_cached_readings(db, user_id_list)
    print(f"\nCached readings in database:")
    for rtype, count in cache_counts.items():
        print(f"  {rtype}: {count}/{len(users)}")

    # Run validation
    validate_users(users, test_endpoints=not args.no_api)


if __name__ == "__main__":
    main()
