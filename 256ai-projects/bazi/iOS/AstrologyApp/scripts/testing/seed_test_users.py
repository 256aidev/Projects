#!/usr/bin/env python3
"""
Seed Test Users Script

Creates test users with varied birth data for cache and throughput testing.
Usage: python seed_test_users.py [--count 20] [--start-id 100]
"""

import sys
import os
import random
import argparse
from datetime import date, time, datetime

# Add parent directories to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from models import get_db, User
from agents.bazi_calculator import BaziCalculator
import json


# Sample data for generating realistic test users
FIRST_NAMES = [
    "Emma", "Liam", "Olivia", "Noah", "Ava", "William", "Sophia", "James",
    "Isabella", "Oliver", "Mia", "Benjamin", "Charlotte", "Elijah", "Amelia",
    "Lucas", "Harper", "Mason", "Evelyn", "Logan", "Wei", "Mei", "Chen", "Yan",
    "Ming", "Xiu", "Jun", "Ling", "Hong", "Fei", "Raj", "Priya", "Arun", "Devi",
    "Sanjay", "Anita", "Vikram", "Lakshmi", "Arjun", "Kavita"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
    "Davis", "Rodriguez", "Martinez", "Wang", "Li", "Zhang", "Liu", "Chen",
    "Yang", "Huang", "Zhao", "Wu", "Zhou", "Patel", "Singh", "Kumar", "Shah",
    "Gupta", "Sharma", "Reddy", "Joshi", "Kapoor", "Mehta"
]

# Major cities with coordinates for birth location variety
CITIES = [
    {"name": "New York", "lat": 40.7128, "lon": -74.0060},
    {"name": "Los Angeles", "lat": 34.0522, "lon": -118.2437},
    {"name": "Chicago", "lat": 41.8781, "lon": -87.6298},
    {"name": "Houston", "lat": 29.7604, "lon": -95.3698},
    {"name": "Shanghai", "lat": 31.2304, "lon": 121.4737},
    {"name": "Beijing", "lat": 39.9042, "lon": 116.4074},
    {"name": "Hong Kong", "lat": 22.3193, "lon": 114.1694},
    {"name": "Tokyo", "lat": 35.6762, "lon": 139.6503},
    {"name": "Mumbai", "lat": 19.0760, "lon": 72.8777},
    {"name": "London", "lat": 51.5074, "lon": -0.1278},
    {"name": "Paris", "lat": 48.8566, "lon": 2.3522},
    {"name": "Sydney", "lat": -33.8688, "lon": 151.2093},
    {"name": "Singapore", "lat": 1.3521, "lon": 103.8198},
    {"name": "Dubai", "lat": 25.2048, "lon": 55.2708},
    {"name": "Toronto", "lat": 43.6532, "lon": -79.3832},
]

TONES = ["balanced", "gentle", "direct", "motivational"]
LANGUAGES = ["en", "zh"]


def generate_random_user_data(user_num: int, start_id: int = 100):
    """Generate random but realistic user data."""
    first_name = random.choice(FIRST_NAMES)
    last_name = random.choice(LAST_NAMES)
    name = f"{first_name} {last_name}"

    # Generate birth date between 1960 and 2005
    year = random.randint(1960, 2005)
    month = random.randint(1, 12)
    day = random.randint(1, 28)  # Safe for all months
    birth_date = date(year, month, day)

    # Generate birth time (all hours covered)
    hour = random.randint(0, 23)
    minute = random.choice([0, 15, 30, 45])
    birth_time = time(hour, minute)

    # Random city
    city = random.choice(CITIES)

    # Email based on user number
    email = f"testuser{start_id + user_num}@test.bazi.app"

    return {
        "name": name,
        "email": email,
        "birth_date": birth_date,
        "birth_time": birth_time,
        "birth_longitude": city["lon"],
        "birth_latitude": city["lat"],
        "birth_location": city["name"],
        "preferred_tone": random.choice(TONES),
        "language": random.choice(LANGUAGES),
    }


def create_test_user(db, user_data: dict, calculator: BaziCalculator) -> User:
    """Create a single test user with calculated BaZi pillars."""

    # Calculate BaZi
    bazi = calculator.calculate(
        user_data["birth_date"],
        user_data["birth_time"],
        user_data["birth_longitude"]
    )

    # Create user
    user = User(
        name=user_data["name"],
        email=user_data["email"],
        password_hash=None,  # No password for test users
        auth_provider="test",
        email_verified=True,
        birth_date=user_data["birth_date"],
        birth_time=user_data["birth_time"],
        birth_longitude=user_data["birth_longitude"],
        birth_latitude=user_data["birth_latitude"],
        birth_location=user_data["birth_location"],
        preferred_tone=user_data["preferred_tone"],
        language=user_data["language"],
        # Pillars
        year_pillar=bazi.year_pillar,
        month_pillar=bazi.month_pillar,
        day_pillar=bazi.day_pillar,
        hour_pillar=bazi.hour_pillar,
        # Stems and branches
        year_stem=bazi.year_stem,
        year_branch=bazi.year_branch,
        month_stem=bazi.month_stem,
        month_branch=bazi.month_branch,
        day_stem=bazi.day_stem,
        day_branch=bazi.day_branch,
        hour_stem=bazi.hour_stem,
        hour_branch=bazi.hour_branch,
        # Day Master
        day_master=bazi.day_master,
        day_master_element=bazi.day_master_element,
        day_master_polarity=bazi.day_master_polarity,
        # Ten Gods
        year_ten_god=bazi.year_ten_god,
        month_ten_god=bazi.month_ten_god,
        hour_ten_god=bazi.hour_ten_god,
        # Elements
        element_counts=json.dumps(bazi.element_counts),
    )

    db.add(user)
    return user


def seed_users(count: int = 20, start_id: int = 100):
    """Create the specified number of test users."""
    print(f"\n{'='*60}")
    print(f"Seeding {count} test users starting from ID offset {start_id}")
    print(f"{'='*60}\n")

    db = next(get_db())
    calculator = BaziCalculator()

    created_users = []
    skipped = 0

    for i in range(count):
        user_data = generate_random_user_data(i, start_id)

        # Check if email already exists
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if existing:
            print(f"  [{i+1}/{count}] SKIP - {user_data['email']} already exists (ID: {existing.id})")
            skipped += 1
            continue

        try:
            user = create_test_user(db, user_data, calculator)
            db.commit()
            db.refresh(user)
            created_users.append(user)

            print(f"  [{i+1}/{count}] Created: {user.name} (ID: {user.id})")
            print(f"           Birth: {user.birth_date} {user.birth_time} @ {user.birth_location}")
            print(f"           Day Master: {user.day_master} ({user.day_master_element})")

        except Exception as e:
            print(f"  [{i+1}/{count}] ERROR - {user_data['email']}: {e}")
            db.rollback()

    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Created: {len(created_users)} users")
    print(f"  Skipped: {skipped} (already existed)")
    print(f"  User IDs: {[u.id for u in created_users]}")
    print(f"{'='*60}\n")

    return created_users


def main():
    parser = argparse.ArgumentParser(description="Seed test users for BaZi app")
    parser.add_argument("--count", type=int, default=20, help="Number of users to create")
    parser.add_argument("--start-id", type=int, default=100, help="Starting ID offset for email generation")
    args = parser.parse_args()

    seed_users(count=args.count, start_id=args.start_id)


if __name__ == "__main__":
    main()
