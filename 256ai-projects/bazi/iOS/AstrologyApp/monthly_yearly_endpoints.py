# Monthly and Yearly Endpoints Addition for app.py
# Copy this content and append to ~/AstrologyApp/app.py

"""
# ================================================================================
# MONTHLY READING ENDPOINTS
# ================================================================================
"""

def get_current_month_start():
    """Get the first day of the current month."""
    from datetime import date
    today = date.today()
    return today.replace(day=1)

def generate_monthly_reading_for_user(user, month_start):
    """Generate a monthly AI reading for a user using Ollama."""
    from datetime import timedelta
    from calendar import monthrange

    try:
        from agents.daily_energy_agent import DailyEnergyAgent
        from agents.narrative_agent import NarrativeAgent

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


@app.get("/monthly/{user_id}")
async def get_monthly_reading(
    user_id: int,
    language: Optional[str] = Query(None, pattern="^(en|zh)$"),
    db: Session = Depends(get_db)
):
    """Get this month's AI-generated reading for a user."""
    from models.monthly_reading import MonthlyReading
    from calendar import monthrange

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    month_start = get_current_month_start()
    days_in_month = monthrange(month_start.year, month_start.month)[1]
    month_end = month_start.replace(day=days_in_month)
    lang = language or user.language

    reading = db.query(MonthlyReading).filter_by(
        user_id=user_id,
        month_start=month_start
    ).first()

    if not reading:
        logger.info(f"Generating on-demand monthly reading for user {user_id}")
        reading = generate_monthly_reading_for_user(user, month_start)

        if not reading:
            raise HTTPException(status_code=500, detail="Failed to generate monthly reading.")

        db.add(reading)
        db.commit()
        db.refresh(reading)

    content = reading.content_zh if lang == "zh" else reading.content_en
    if not content:
        content = reading.content_en or reading.content_zh or "Content not available"

    return {
        "user_id": user_id,
        "user_name": user.name,
        "month_start": month_start.isoformat(),
        "month_end": month_end.isoformat(),
        "month_name": month_start.strftime("%B"),
        "year": month_start.year,
        "content": content,
        "language": lang,
        "llm_provider": reading.llm_provider,
        "generated_at": reading.created_at.isoformat(),
    }


"""
# ================================================================================
# YEARLY READING ENDPOINTS
# ================================================================================
"""

def generate_yearly_reading_for_user(user, year):
    """Generate a yearly AI reading for a user using Ollama."""
    from datetime import date

    try:
        from agents.daily_energy_agent import DailyEnergyAgent
        from agents.narrative_agent import NarrativeAgent

        energy_agent = DailyEnergyAgent()
        narrative_agent = NarrativeAgent()

        user_branches = [
            user.year_branch,
            user.month_branch,
            user.day_branch,
            user.hour_branch
        ]

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


@app.get("/yearly/{user_id}")
async def get_yearly_reading(
    user_id: int,
    language: Optional[str] = Query(None, pattern="^(en|zh)$"),
    db: Session = Depends(get_db)
):
    """Get this year's AI-generated reading for a user."""
    from datetime import date
    from models.yearly_reading import YearlyReading

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    current_year = date.today().year
    lang = language or user.language

    reading = db.query(YearlyReading).filter_by(
        user_id=user_id,
        year=current_year
    ).first()

    if not reading:
        logger.info(f"Generating on-demand yearly reading for user {user_id}")
        reading = generate_yearly_reading_for_user(user, current_year)

        if not reading:
            raise HTTPException(status_code=500, detail="Failed to generate yearly reading.")

        db.add(reading)
        db.commit()
        db.refresh(reading)

    content = reading.content_zh if lang == "zh" else reading.content_en
    if not content:
        content = reading.content_en or reading.content_zh or "Content not available"

    return {
        "user_id": user_id,
        "user_name": user.name,
        "year": current_year,
        "content": content,
        "language": lang,
        "llm_provider": reading.llm_provider,
        "generated_at": reading.created_at.isoformat(),
    }
