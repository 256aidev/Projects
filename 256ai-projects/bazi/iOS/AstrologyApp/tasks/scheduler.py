"""
Scheduler for Daily, Weekly, Monthly, and Yearly Reading Generation

Uses APScheduler to automatically generate:
- Daily templated readings (FREE - no LLM cost) at 00:05
- Weekly AI readings (Ollama - FREE) on Sundays at 23:00
- Monthly AI readings (Ollama - FREE) on 1st of each month at 01:00
- Yearly AI readings (Ollama - FREE) on January 1st at 02:00

Health Monitoring & Recovery:
- External bash script (bazi-health-monitor.sh) runs every 5 minutes via cron
- Checks Ollama health, restarts if down
- Checks if scheduled jobs completed, triggers recovery via API if not
- All job status is logged to system_health_logs for dashboard visibility
"""

import logging
from datetime import date, datetime, timedelta
from typing import Optional, List, Dict, Any

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from models import SessionLocal, User, DailyReading, WeeklyReading
from agents import BaziCalculator, DailyEnergyAgent, NarrativeAgent
from agents.template_engine import TemplateEngine

logger = logging.getLogger(__name__)


def _log_job_status(job_name: str, status: str, message: str):
    """Log job status to system_health_logs table for dashboard visibility."""
    try:
        from models.system_health import SystemHealthLog

        session = SessionLocal()
        try:
            log = SystemHealthLog(
                service=f"scheduler_{job_name}",
                status=status,
                message=message,
                host="app_server",
                timestamp=datetime.utcnow()
            )
            session.add(log)
            session.commit()
        finally:
            session.close()
    except Exception as e:
        logger.warning(f"Failed to log job status: {e}")

# Global scheduler instance
scheduler = BackgroundScheduler()


def generate_daily_reading_for_user(user: User, target_date: date) -> Optional[DailyReading]:
    """
    Generate a daily reading for a single user using TEMPLATES (FREE).

    Args:
        user: The user to generate reading for
        target_date: The date to generate reading for

    Returns:
        DailyReading object if successful, None otherwise
    """
    try:
        # Initialize agents
        energy_agent = DailyEnergyAgent()
        template_engine = TemplateEngine()

        # Get user's branches for interaction analysis
        user_branches = [
            user.year_branch,
            user.month_branch,
            user.day_branch,
            user.hour_branch
        ]

        # Analyze daily energy
        daily_analysis = energy_agent.analyze(
            target_date=target_date,
            user_day_master=user.day_master,
            user_branches=user_branches
        )

        # Prepare user data for template generation
        user_data = {
            "name": user.name,
            "day_master": user.day_master,
            "day_master_element": user.day_master_element,
            "day_master_polarity": user.day_master_polarity,
            "element_counts": user.element_counts,
        }

        # Generate using templates (FREE - no LLM cost!)
        template_result = template_engine.generate_daily_reading(
            user_data=user_data,
            daily_data=daily_analysis.to_dict(),
        )

        if not template_result.success:
            logger.error(f"Template generation failed for user {user.id}: {template_result.error}")
            return None

        # Create DailyReading object
        reading = DailyReading(
            user_id=user.id,
            date=target_date,
            daily_pillar=daily_analysis.daily_pillar,
            daily_stem=daily_analysis.daily_stem,
            daily_branch=daily_analysis.daily_branch,
            daily_element=daily_analysis.daily_element,
            interactions_json=daily_analysis.to_json(),
            content_en=template_result.content_en,
            content_zh=template_result.content_zh,
            template_id=template_result.template_id,
            generation_method="template",
        )

        return reading

    except Exception as e:
        logger.exception(f"Error generating daily reading for user {user.id}: {e}")
        return None


def generate_weekly_reading_for_user(user: User, week_start: date) -> Optional[WeeklyReading]:
    """
    Generate a weekly AI reading for a single user using Ollama (FREE).

    Args:
        user: The user to generate reading for
        week_start: Monday of the week to generate reading for

    Returns:
        WeeklyReading object if successful, None otherwise
    """
    try:
        # Initialize agents
        energy_agent = DailyEnergyAgent()
        narrative_agent = NarrativeAgent()

        # Get user's branches for interaction analysis
        user_branches = [
            user.year_branch,
            user.month_branch,
            user.day_branch,
            user.hour_branch
        ]

        # Analyze each day of the week
        week_days: List[Dict[str, Any]] = []
        for i in range(7):
            day_date = week_start + timedelta(days=i)
            daily_analysis = energy_agent.analyze(
                target_date=day_date,
                user_day_master=user.day_master,
                user_branches=user_branches
            )
            week_days.append({
                "date": day_date.isoformat(),
                "day_name": day_date.strftime("%A"),
                **daily_analysis.to_dict()
            })

        # Prepare week summary for LLM
        week_end = week_start + timedelta(days=6)

        # Build summary of the week's key interactions
        clashes_count = sum(1 for d in week_days if d.get("clashes"))
        combinations_count = sum(1 for d in week_days if d.get("combinations"))
        elements = [d.get("daily_element", "") for d in week_days]

        week_summary = f"""
Days Overview:
{chr(10).join(f"- {d['day_name']} ({d['date']}): {d.get('daily_element', '')} day, {d.get('element_relationship', 'neutral')} energy" for d in week_days)}

Key Patterns:
- {clashes_count} days with branch clashes (potential tension)
- {combinations_count} days with harmonious combinations
- Dominant elements: {', '.join(set(elements))}
"""

        week_data = {
            "week_start": week_start.isoformat(),
            "week_end": week_end.isoformat(),
            "summary": week_summary,
            "days": week_days,
        }

        # Prepare user data for narrative generation
        user_data = {
            "name": user.name,
            "day_master": user.day_master,
            "day_master_element": user.day_master_element,
            "day_master_polarity": user.day_master_polarity,
            "element_counts": user.element_counts,
        }

        # Generate weekly narrative using Ollama (FREE)
        narrative_result = narrative_agent.generate_weekly(
            user_data=user_data,
            week_data=week_data,
            language="both",
        )

        if not narrative_result.success:
            logger.error(f"Weekly narrative generation failed for user {user.id}: {narrative_result.error}")
            return None

        # Create WeeklyReading object
        import json
        reading = WeeklyReading(
            user_id=user.id,
            week_start=week_start,
            content_en=narrative_result.content_en,
            content_zh=narrative_result.content_zh,
            llm_provider=narrative_result.provider,
            week_pillars_json=json.dumps(week_days),
        )

        return reading

    except Exception as e:
        logger.exception(f"Error generating weekly reading for user {user.id}: {e}")
        return None


def run_daily_generation_job():
    """
    Run the daily generation job for all users.
    Uses TEMPLATES (FREE - no LLM cost).
    This is called by the scheduler at 00:05 daily.

    Recovery: External health monitor checks for completion and retriggers if needed.
    """
    logger.info("Starting daily reading generation job (using templates - FREE)...")
    _log_job_status("daily_readings", "running", "Job started")

    session = SessionLocal()
    today = date.today()

    try:
        # Get all users
        users = session.query(User).all()
        logger.info(f"Found {len(users)} users to process")

        success_count = 0
        error_count = 0

        for user in users:
            # Check if reading already exists for today
            existing = session.query(DailyReading).filter_by(
                user_id=user.id,
                date=today
            ).first()

            if existing:
                logger.debug(f"Reading already exists for user {user.id} on {today}")
                continue

            # Generate reading using templates (FREE)
            reading = generate_daily_reading_for_user(user, today)

            if reading:
                session.add(reading)
                session.commit()
                success_count += 1
                logger.info(f"Generated daily reading for user {user.id} ({user.name}) [template: {reading.template_id}]")
            else:
                error_count += 1
                logger.warning(f"Failed to generate daily reading for user {user.id}")

        logger.info(
            f"Daily generation complete. Success: {success_count}, Errors: {error_count}"
        )
        _log_job_status("daily_readings", "healthy", f"Completed: {success_count} success, {error_count} errors")

    except Exception as e:
        logger.exception(f"Error in daily generation job: {e}")
        _log_job_status("daily_readings", "critical", f"Job failed: {str(e)}")
        session.rollback()
    finally:
        session.close()


def get_current_week_start() -> date:
    """Get the Monday of the current week."""
    today = date.today()
    return today - timedelta(days=today.weekday())


def _check_ollama_health() -> bool:
    """Check if Ollama is responding before starting LLM-dependent jobs."""
    import os
    import requests

    ollama_host = os.getenv("OLLAMA_HOST", "http://10.0.1.147:11434")
    try:
        response = requests.get(f"{ollama_host}/api/tags", timeout=10)
        if response.status_code == 200:
            logger.info(f"Ollama health check passed at {ollama_host}")
            return True
        else:
            logger.error(f"Ollama returned status {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"Cannot connect to Ollama at {ollama_host}: {e}")
        return False


def run_weekly_generation_job():
    """
    Run the weekly generation job for all users.
    Uses Ollama (FREE local LLM).
    This is called by the scheduler on Sundays at 23:00.

    Recovery: External health monitor checks for completion and retriggers if needed.
    """
    logger.info("Starting weekly reading generation job (using Ollama - FREE)...")
    _log_job_status("weekly_readings", "running", "Job started")

    # Pre-flight check: Ensure Ollama is available before processing users
    if not _check_ollama_health():
        _log_job_status("weekly_readings", "critical", "Ollama not available - job aborted")
        logger.error("Ollama is not available - job aborted. Health monitor will retry.")
        return

    session = SessionLocal()
    # Generate for next week (Monday)
    next_week_start = get_current_week_start() + timedelta(days=7)

    try:
        # Get all users
        users = session.query(User).all()
        logger.info(f"Found {len(users)} users to process for week starting {next_week_start}")

        success_count = 0
        error_count = 0

        for user in users:
            # Check if reading already exists for this week
            existing = session.query(WeeklyReading).filter_by(
                user_id=user.id,
                week_start=next_week_start
            ).first()

            if existing:
                logger.debug(f"Weekly reading already exists for user {user.id} for week {next_week_start}")
                continue

            # Generate weekly reading using Ollama (FREE)
            reading = generate_weekly_reading_for_user(user, next_week_start)

            if reading:
                session.add(reading)
                session.commit()
                success_count += 1
                logger.info(f"Generated weekly reading for user {user.id} ({user.name}) [provider: {reading.llm_provider}]")
            else:
                error_count += 1
                logger.warning(f"Failed to generate weekly reading for user {user.id}")

        logger.info(
            f"Weekly generation complete. Success: {success_count}, Errors: {error_count}"
        )
        _log_job_status("weekly_readings", "healthy", f"Completed: {success_count} success, {error_count} errors")

    except Exception as e:
        logger.exception(f"Error in weekly generation job: {e}")
        _log_job_status("weekly_readings", "critical", f"Job failed: {str(e)}")
        session.rollback()
    finally:
        session.close()


def get_current_month_start() -> date:
    """Get the first day of the current month."""
    today = date.today()
    return today.replace(day=1)


def generate_monthly_reading_for_user(user: User, month_start: date):
    """Generate a monthly AI reading for a user using Ollama."""
    from calendar import monthrange

    try:
        energy_agent = DailyEnergyAgent()
        narrative_agent = NarrativeAgent()

        user_branches = [
            user.year_branch,
            user.month_branch,
            user.day_branch,
            user.hour_branch
        ]

        year = month_start.year
        month = month_start.month
        days_in_month = monthrange(year, month)[1]
        month_end = month_start.replace(day=days_in_month)

        # Sample key dates in the month
        key_dates = [1, 8, 15, 22, days_in_month]
        key_days = []

        for day_num in key_dates:
            day_date = month_start.replace(day=day_num)
            daily_analysis = energy_agent.analyze(
                target_date=day_date,
                user_day_master=user.day_master,
                user_branches=user_branches
            )
            key_days.append({
                "date": day_date.isoformat(),
                "day_name": day_date.strftime("%A"),
                **daily_analysis.to_dict()
            })

        elements = [d.get("daily_element", "") for d in key_days]
        month_summary = f"""
Month: {month_start.strftime('%B %Y')}

Key Dates Analysis:
{chr(10).join(f"- {d['day_name']} {d['date']}: {d.get('daily_element', '')} energy, {d.get('element_relationship', 'neutral')}" for d in key_days)}

Dominant elements this month: {', '.join(set(elements))}
"""

        month_data = {
            "month_start": month_start.isoformat(),
            "month_end": month_end.isoformat(),
            "month_name": month_start.strftime("%B"),
            "year": year,
            "summary": month_summary,
            "key_days": key_days,
        }

        user_data = {
            "name": user.name,
            "day_master": user.day_master,
            "day_master_element": user.day_master_element,
            "day_master_polarity": user.day_master_polarity,
            "element_counts": user.element_counts,
        }

        narrative_result = narrative_agent.generate_monthly(
            user_data=user_data,
            month_data=month_data,
            language="both",
        )

        if not narrative_result.success:
            logger.error(f"Monthly narrative generation failed for user {user.id}: {narrative_result.error}")
            return None

        from models.monthly_reading import MonthlyReading
        reading = MonthlyReading(
            user_id=user.id,
            month_start=month_start,
            content_en=narrative_result.content_en,
            content_zh=narrative_result.content_zh,
            llm_provider=narrative_result.provider,
        )
        return reading

    except Exception as e:
        logger.exception(f"Error generating monthly reading for user {user.id}: {e}")
        return None


def generate_yearly_reading_for_user(user: User, year: int):
    """Generate a yearly AI reading for a user using Ollama."""
    try:
        energy_agent = DailyEnergyAgent()
        narrative_agent = NarrativeAgent()

        user_branches = [
            user.year_branch,
            user.month_branch,
            user.day_branch,
            user.hour_branch
        ]

        # Sample mid-month for each month
        monthly_samples = []
        for month in range(1, 13):
            sample_date = date(year, month, 15)
            daily_analysis = energy_agent.analyze(
                target_date=sample_date,
                user_day_master=user.day_master,
                user_branches=user_branches
            )
            monthly_samples.append({
                "month": month,
                "month_name": sample_date.strftime("%B"),
                "sample_date": sample_date.isoformat(),
                **daily_analysis.to_dict()
            })

        elements = [d.get("daily_element", "") for d in monthly_samples]
        year_summary = f"""
Year: {year}

Monthly Energy Overview:
{chr(10).join(f"- {d['month_name']}: {d.get('daily_element', '')} energy, {d.get('element_relationship', 'neutral')}" for d in monthly_samples)}

Dominant elements this year: {', '.join(set(elements))}
"""

        year_data = {
            "year": year,
            "summary": year_summary,
            "monthly_samples": monthly_samples,
        }

        user_data = {
            "name": user.name,
            "day_master": user.day_master,
            "day_master_element": user.day_master_element,
            "day_master_polarity": user.day_master_polarity,
            "element_counts": user.element_counts,
        }

        narrative_result = narrative_agent.generate_yearly(
            user_data=user_data,
            year_data=year_data,
            language="both",
        )

        if not narrative_result.success:
            logger.error(f"Yearly narrative generation failed for user {user.id}: {narrative_result.error}")
            return None

        from models.yearly_reading import YearlyReading
        reading = YearlyReading(
            user_id=user.id,
            year=year,
            content_en=narrative_result.content_en,
            content_zh=narrative_result.content_zh,
            llm_provider=narrative_result.provider,
        )
        return reading

    except Exception as e:
        logger.exception(f"Error generating yearly reading for user {user.id}: {e}")
        return None


def run_monthly_generation_job():
    """
    Run the monthly generation job for all users.
    Uses Ollama (FREE local LLM).
    This is called on the 1st of each month at 01:00.

    Recovery: External health monitor checks for completion and retriggers if needed.
    """
    logger.info("Starting monthly reading generation job (using Ollama - FREE)...")
    _log_job_status("monthly_readings", "running", "Job started")

    # Pre-flight check: Ensure Ollama is available
    if not _check_ollama_health():
        _log_job_status("monthly_readings", "critical", "Ollama not available - job aborted")
        logger.error("Ollama is not available - job aborted. Health monitor will retry.")
        return

    session = SessionLocal()
    month_start = get_current_month_start()

    try:
        from models.monthly_reading import MonthlyReading

        users = session.query(User).all()
        logger.info(f"Found {len(users)} users to process for month {month_start}")

        success_count = 0
        error_count = 0

        for user in users:
            existing = session.query(MonthlyReading).filter_by(
                user_id=user.id,
                month_start=month_start
            ).first()

            if existing:
                logger.debug(f"Monthly reading already exists for user {user.id} for {month_start}")
                continue

            reading = generate_monthly_reading_for_user(user, month_start)

            if reading:
                session.add(reading)
                session.commit()
                success_count += 1
                logger.info(f"Generated monthly reading for user {user.id} ({user.name})")
            else:
                error_count += 1
                logger.warning(f"Failed to generate monthly reading for user {user.id}")

        logger.info(f"Monthly generation complete. Success: {success_count}, Errors: {error_count}")
        _log_job_status("monthly_readings", "healthy", f"Completed: {success_count} success, {error_count} errors")

    except Exception as e:
        logger.exception(f"Error in monthly generation job: {e}")
        _log_job_status("monthly_readings", "critical", f"Job failed: {str(e)}")
        session.rollback()
    finally:
        session.close()


def run_yearly_generation_job():
    """
    Run the yearly generation job for all users.
    Uses Ollama (FREE local LLM).
    This is called on January 1st at 02:00.

    Recovery: External health monitor checks for completion and retriggers if needed.
    """
    logger.info("Starting yearly reading generation job (using Ollama - FREE)...")
    _log_job_status("yearly_readings", "running", "Job started")

    # Pre-flight check: Ensure Ollama is available
    if not _check_ollama_health():
        _log_job_status("yearly_readings", "critical", "Ollama not available - job aborted")
        logger.error("Ollama is not available - job aborted. Health monitor will retry.")
        return

    session = SessionLocal()
    current_year = date.today().year

    try:
        from models.yearly_reading import YearlyReading

        users = session.query(User).all()
        logger.info(f"Found {len(users)} users to process for year {current_year}")

        success_count = 0
        error_count = 0

        for user in users:
            existing = session.query(YearlyReading).filter_by(
                user_id=user.id,
                year=current_year
            ).first()

            if existing:
                logger.debug(f"Yearly reading already exists for user {user.id} for {current_year}")
                continue

            reading = generate_yearly_reading_for_user(user, current_year)

            if reading:
                session.add(reading)
                session.commit()
                success_count += 1
                logger.info(f"Generated yearly reading for user {user.id} ({user.name})")
            else:
                error_count += 1
                logger.warning(f"Failed to generate yearly reading for user {user.id}")

        logger.info(f"Yearly generation complete. Success: {success_count}, Errors: {error_count}")
        _log_job_status("yearly_readings", "healthy", f"Completed: {success_count} success, {error_count} errors")

    except Exception as e:
        logger.exception(f"Error in yearly generation job: {e}")
        _log_job_status("yearly_readings", "critical", f"Job failed: {str(e)}")
        session.rollback()
    finally:
        session.close()


def start_scheduler():
    """Start the background scheduler."""
    if scheduler.running:
        logger.warning("Scheduler is already running")
        return

    # Add daily generation job at 00:05 (uses templates - FREE)
    scheduler.add_job(
        run_daily_generation_job,
        CronTrigger(hour=0, minute=5),
        id="daily_readings",
        name="Generate daily readings (templates - FREE)",
        replace_existing=True
    )

    # Add weekly generation job on Sundays at 23:00 (uses Ollama - FREE)
    scheduler.add_job(
        run_weekly_generation_job,
        CronTrigger(day_of_week="sun", hour=23, minute=0),
        id="weekly_readings",
        name="Generate weekly readings (Ollama - FREE)",
        replace_existing=True
    )

    # Add monthly generation job on 1st of each month at 01:00 (uses Ollama - FREE)
    scheduler.add_job(
        run_monthly_generation_job,
        CronTrigger(day=1, hour=1, minute=0),
        id="monthly_readings",
        name="Generate monthly readings (Ollama - FREE)",
        replace_existing=True
    )

    # Add yearly generation job on January 1st at 02:00 (uses Ollama - FREE)
    scheduler.add_job(
        run_yearly_generation_job,
        CronTrigger(month=1, day=1, hour=2, minute=0),
        id="yearly_readings",
        name="Generate yearly readings (Ollama - FREE)",
        replace_existing=True
    )

    scheduler.start()
    logger.info("Scheduler started:")
    logger.info("  - Daily readings at 00:05 (templates - FREE)")
    logger.info("  - Weekly readings on Sundays at 23:00 (Ollama - FREE)")
    logger.info("  - Monthly readings on 1st at 01:00 (Ollama - FREE)")
    logger.info("  - Yearly readings on Jan 1st at 02:00 (Ollama - FREE)")
    logger.info("  - Recovery: External health monitor (bazi-health-monitor.sh) via cron")


def shutdown_scheduler():
    """Shutdown the scheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown(wait=True)
        logger.info("Scheduler shut down.")


def trigger_daily_generation_now():
    """
    Manually trigger the daily generation job.
    Useful for testing or forcing regeneration.
    """
    logger.info("Manually triggering daily generation...")
    run_daily_generation_job()


def trigger_weekly_generation_now(week_start: date = None):
    """
    Manually trigger the weekly generation job.
    Useful for testing or forcing regeneration.

    Args:
        week_start: Optional Monday date. If None, uses current week.
    """
    logger.info("Manually triggering weekly generation...")
    run_weekly_generation_job()


def trigger_monthly_generation_now():
    """
    Manually trigger the monthly generation job.
    Useful for testing or forcing regeneration.
    """
    logger.info("Manually triggering monthly generation...")
    run_monthly_generation_job()


def trigger_yearly_generation_now():
    """
    Manually trigger the yearly generation job.
    Useful for testing or forcing regeneration.
    """
    logger.info("Manually triggering yearly generation...")
    run_yearly_generation_job()


# Backwards compatibility alias
trigger_generation_now = trigger_daily_generation_now
