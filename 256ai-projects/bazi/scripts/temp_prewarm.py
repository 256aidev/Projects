#!/usr/bin/env python3
"""
Script to add prewarm functionality to auth_router.py
"""

# Read the file
with open('/home/nazmin/AstrologyApp/routers/auth_router.py', 'r') as f:
    content = f.read()

# 1. Add BackgroundTasks to import
content = content.replace(
    'from fastapi import APIRouter, Depends, HTTPException, status',
    'from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks'
)

# 2. Add prewarm function before router definition
prewarm_function = '''

# Background task to prewarm readings cache for new users
def prewarm_readings_for_user(user_id: int):
    """
    Background task to pre-generate all readings for a new user.
    This runs after registration so readings are ready when user opens the app.
    """
    import threading
    from models import SessionLocal
    from datetime import date

    def generate_readings():
        from app import (
            get_current_week_start, get_current_month_start,
            generate_weekly_reading_for_user,
            generate_monthly_reading_for_user,
            generate_yearly_reading_for_user
        )
        from models.weekly_reading import WeeklyReading
        from models.monthly_reading import MonthlyReading
        from models.yearly_reading import YearlyReading

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                logger.warning(f"Prewarm: User {user_id} not found")
                return

            week_start = get_current_week_start()
            month_start = get_current_month_start()
            year = date.today().year

            logger.info(f"Prewarm: Starting reading generation for user {user_id}")

            # Generate weekly
            if not db.query(WeeklyReading).filter_by(user_id=user_id, week_start=week_start).first():
                reading = generate_weekly_reading_for_user(user, week_start)
                if reading:
                    db.add(reading)
                    db.commit()
                    logger.info(f"Prewarm: Weekly reading generated for user {user_id}")

            # Generate monthly
            if not db.query(MonthlyReading).filter_by(user_id=user_id, month_start=month_start).first():
                reading = generate_monthly_reading_for_user(user, month_start)
                if reading:
                    db.add(reading)
                    db.commit()
                    logger.info(f"Prewarm: Monthly reading generated for user {user_id}")

            # Generate yearly
            if not db.query(YearlyReading).filter_by(user_id=user_id, year=year).first():
                reading = generate_yearly_reading_for_user(user, year)
                if reading:
                    db.add(reading)
                    db.commit()
                    logger.info(f"Prewarm: Yearly reading generated for user {user_id}")

            logger.info(f"Prewarm: Completed for user {user_id}")
        except Exception as e:
            logger.error(f"Prewarm: Error for user {user_id}: {e}")
            db.rollback()
        finally:
            db.close()

    # Run in background thread
    thread = threading.Thread(target=generate_readings, daemon=True)
    thread.start()


'''

content = content.replace(
    'router = APIRouter(prefix="/auth", tags=["Authentication"])',
    prewarm_function + 'router = APIRouter(prefix="/auth", tags=["Authentication"])'
)

# 3. Add prewarm call after registration
# Find the return statement in register and add prewarm before it
content = content.replace(
    '    token = create_access_token(user.id, user.email)\n    return TokenResponse(access_token=token, user_id=user.id)\n\n\n@router.post("/login"',
    '    token = create_access_token(user.id, user.email)\n\n    # Prewarm readings cache in background\n    prewarm_readings_for_user(user.id)\n\n    return TokenResponse(access_token=token, user_id=user.id)\n\n\n@router.post("/login"'
)

# 4. Add prewarm call after social login new user creation
# Find the return statement after "New user with birth data - create account"
content = content.replace(
    '    token = create_access_token(user.id, user.email or "")\n    return TokenResponse(access_token=token, user_id=user.id)\n\n\n@router.post("/device-token"',
    '    token = create_access_token(user.id, user.email or "")\n\n    # Prewarm readings cache in background for new users\n    prewarm_readings_for_user(user.id)\n\n    return TokenResponse(access_token=token, user_id=user.id)\n\n\n@router.post("/device-token"'
)

# Write the modified content
with open('/home/nazmin/AstrologyApp/routers/auth_router.py', 'w') as f:
    f.write(content)

print("Successfully added prewarm functionality!")
