"""
Relationship Router

API endpoints for managing added persons and relationship compatibility analysis.
"""

import json
import logging
from datetime import date, time, datetime
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from models import get_db, User, AddedPerson, RelationshipAnalysis
from agents import BaziCalculator
from engines import get_relationship_engine
from engines.relationship_engine import (
    get_effort_label,
    get_effort_framing,
    get_quadrant_interpretation,
    display_score as get_display_score,
    STANDARD_DISCLAIMER,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["relationships"])


# NOTE: Old label functions removed. Use get_effort_label() from engine instead.
# The engine is the SINGLE SOURCE OF TRUTH for all label logic.


# =============================================================================
# Pydantic Models
# =============================================================================

class PersonCreate(BaseModel):
    """Request model for creating an added person."""
    name: str = Field(..., min_length=1, max_length=100)
    relationship_type: str = Field(..., pattern="^(spouse|parent|child|sibling|friend|other)$")
    birth_date: date
    birth_time: Optional[time] = None
    birth_time_known: bool = False
    birth_longitude: Optional[float] = Field(None, ge=-180, le=180)
    birth_latitude: Optional[float] = Field(None, ge=-90, le=90)
    birth_location: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = None


class PersonResponse(BaseModel):
    """Response model for a person."""
    id: int
    user_id: int
    name: str
    relationship_type: str
    birth_date: date
    birth_time: Optional[time]
    birth_time_known: bool
    birth_location: Optional[str]
    # Full Four Pillars chart data
    year_pillar: Optional[str]
    month_pillar: Optional[str]
    day_pillar: Optional[str]
    hour_pillar: Optional[str]
    # Day Master details
    day_master: Optional[str]
    day_master_element: Optional[str]
    day_master_polarity: Optional[str]
    # Element distribution
    element_counts: Optional[dict] = None
    confidence_percent: int
    created_at: datetime

    class Config:
        from_attributes = True


class CompatibilityResponse(BaseModel):
    """Response model for compatibility analysis."""
    person_id: int
    person_name: str
    relationship_type: str
    # Raw scores (internal math)
    ease_score: int
    durability_score: int
    score_label: str
    # Display scores (visual/UI presentation)
    display_ease: int
    display_durability: int
    display_label: str
    deep_green_eligible: bool
    # Effort-based presentation (new)
    effort_label: Optional[str] = None
    effort_framing: Optional[str] = None
    quadrant_interpretation: Optional[str] = None
    disclaimer: str = STANDARD_DISCLAIMER
    # Other fields
    confidence: str
    confidence_percent: int
    asymmetry: dict
    strengths: List[str]
    watchouts: List[str]
    toxicity: dict
    ten_god: dict
    calculated_at: Optional[datetime]


# =============================================================================
# Endpoints
# =============================================================================

@router.post("/persons", response_model=PersonResponse)
def create_person(
    user_id: int,
    person_data: PersonCreate,
    db: Session = Depends(get_db)
):
    """
    Add a person for relationship analysis.
    Calculates their BaZi four pillars from birth data.
    """
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Calculate BaZi pillars
    calculator = BaziCalculator()

    # Use noon if birth time not known
    birth_time = person_data.birth_time or time(12, 0)

    try:
        bazi = calculator.calculate(
            person_data.birth_date,
            birth_time,
            person_data.birth_longitude
        )
    except Exception as e:
        logger.exception(f"Failed to calculate BaZi for person: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate BaZi pillars")

    # Create AddedPerson
    person = AddedPerson(
        user_id=user_id,
        name=person_data.name,
        relationship_type=person_data.relationship_type,
        birth_date=person_data.birth_date,
        birth_time=person_data.birth_time,
        birth_time_known=person_data.birth_time_known,
        birth_longitude=person_data.birth_longitude,
        birth_latitude=person_data.birth_latitude,
        birth_location=person_data.birth_location,
        notes=person_data.notes,
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
        element_counts=json.dumps(bazi.element_counts)
    )

    db.add(person)
    db.commit()
    db.refresh(person)

    logger.info(f"Created person {person.id} ({person.name}) for user {user_id}")

    return PersonResponse(
        id=person.id,
        user_id=person.user_id,
        name=person.name,
        relationship_type=person.relationship_type,
        birth_date=person.birth_date,
        birth_time=person.birth_time,
        birth_time_known=person.birth_time_known,
        birth_location=person.birth_location,
        year_pillar=person.year_pillar,
        month_pillar=person.month_pillar,
        day_pillar=person.day_pillar,
        hour_pillar=person.hour_pillar,
        day_master=person.day_master,
        day_master_element=person.day_master_element,
        day_master_polarity=person.day_master_polarity,
        element_counts=json.loads(person.element_counts) if person.element_counts else None,
        confidence_percent=person.get_confidence_percent(),
        created_at=person.created_at
    )


@router.get("/persons", response_model=List[PersonResponse])
def list_persons(
    user_id: int,
    db: Session = Depends(get_db)
):
    """List all persons added by a user."""
    persons = db.query(AddedPerson).filter(AddedPerson.user_id == user_id).all()

    return [
        PersonResponse(
            id=p.id,
            user_id=p.user_id,
            name=p.name,
            relationship_type=p.relationship_type,
            birth_date=p.birth_date,
            birth_time=p.birth_time,
            birth_time_known=p.birth_time_known,
            birth_location=p.birth_location,
            year_pillar=p.year_pillar,
            month_pillar=p.month_pillar,
            day_pillar=p.day_pillar,
            hour_pillar=p.hour_pillar,
            day_master=p.day_master,
            day_master_element=p.day_master_element,
            day_master_polarity=p.day_master_polarity,
            element_counts=json.loads(p.element_counts) if p.element_counts else None,
            confidence_percent=p.get_confidence_percent(),
            created_at=p.created_at
        )
        for p in persons
    ]


@router.get("/persons/{person_id}", response_model=PersonResponse)
def get_person(
    person_id: int,
    db: Session = Depends(get_db)
):
    """Get details of a specific person."""
    person = db.query(AddedPerson).filter(AddedPerson.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    return PersonResponse(
        id=person.id,
        user_id=person.user_id,
        name=person.name,
        relationship_type=person.relationship_type,
        birth_date=person.birth_date,
        birth_time=person.birth_time,
        birth_time_known=person.birth_time_known,
        birth_location=person.birth_location,
        year_pillar=person.year_pillar,
        month_pillar=person.month_pillar,
        day_pillar=person.day_pillar,
        hour_pillar=person.hour_pillar,
        day_master=person.day_master,
        day_master_element=person.day_master_element,
        day_master_polarity=person.day_master_polarity,
        element_counts=json.loads(person.element_counts) if person.element_counts else None,
        confidence_percent=person.get_confidence_percent(),
        created_at=person.created_at
    )


@router.delete("/persons/{person_id}")
def delete_person(
    person_id: int,
    db: Session = Depends(get_db)
):
    """Delete a person and their cached analyses."""
    person = db.query(AddedPerson).filter(AddedPerson.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    # Delete any cached analyses
    db.query(RelationshipAnalysis).filter(
        RelationshipAnalysis.person_id == person_id
    ).delete()

    # Delete the person
    db.delete(person)
    db.commit()

    logger.info(f"Deleted person {person_id}")
    return {"status": "deleted", "person_id": person_id}


@router.get("/relationship/{person_id}", response_model=CompatibilityResponse)
def get_relationship_analysis(
    user_id: int,
    person_id: int,
    force_refresh: bool = Query(False, description="Force recalculation"),
    db: Session = Depends(get_db)
):
    """
    Get relationship compatibility analysis between user and person.
    Results are cached; use force_refresh=true to recalculate.
    """
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get person
    person = db.query(AddedPerson).filter(AddedPerson.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    # Verify person belongs to user
    if person.user_id != user_id:
        raise HTTPException(status_code=403, detail="Person does not belong to user")

    # Check for cached analysis
    if not force_refresh:
        cached = db.query(RelationshipAnalysis).filter(
            RelationshipAnalysis.user_id == user_id,
            RelationshipAnalysis.person_id == person_id
        ).first()

        if cached:
            # For cached responses, apply display curve (conservative: assume eligible)
            # This preserves backwards compatibility until db is updated
            disp_ease = get_display_score(cached.ease_score)
            disp_dur = get_display_score(cached.durability_score)
            effort_lbl = get_effort_label(disp_ease)
            return CompatibilityResponse(
                person_id=person_id,
                person_name=person.name,
                relationship_type=cached.relationship_type,
                ease_score=cached.ease_score,
                durability_score=cached.durability_score,
                score_label=effort_lbl,  # Use effort label
                display_ease=disp_ease,
                display_durability=disp_dur,
                display_label=effort_lbl,  # Use effort label for backward compat
                deep_green_eligible=True,  # Assume eligible for cached data
                effort_label=effort_lbl,
                effort_framing=get_effort_framing(effort_lbl),
                quadrant_interpretation=get_quadrant_interpretation(disp_ease, disp_dur),
                confidence=cached.confidence_level,
                confidence_percent=cached.confidence_percent,
                asymmetry={
                    "flag": cached.asymmetry_flag,
                    "note": "One-sided experience: one person feels this more" if cached.asymmetry_flag else None,
                    "ease_u2p": cached.ease_u2p,
                    "ease_p2u": cached.ease_p2u,
                    "dur_u2p": cached.dur_u2p,
                    "dur_p2u": cached.dur_p2u
                },
                strengths=json.loads(cached.strengths) if cached.strengths else [],
                watchouts=json.loads(cached.watchouts) if cached.watchouts else [],
                toxicity={
                    "index": cached.toxicity_index,
                    "level": cached.toxicity_level
                },
                ten_god={
                    "role": cached.ten_god_role,
                    "interpretation": cached.ten_god_interpretation
                },
                calculated_at=cached.calculated_at
            )

    # Calculate compatibility
    engine = get_relationship_engine()
    result = engine.calculate_compatibility(user, person, person.relationship_type)

    # Save or update analysis
    analysis = db.query(RelationshipAnalysis).filter(
        RelationshipAnalysis.user_id == user_id,
        RelationshipAnalysis.person_id == person_id
    ).first()

    if not analysis:
        analysis = RelationshipAnalysis(
            user_id=user_id,
            person_id=person_id
        )
        db.add(analysis)

    # Update analysis
    analysis.relationship_type = person.relationship_type
    analysis.ease_score = result.ease_score
    analysis.durability_score = result.durability_score
    analysis.toxicity_index = result.toxicity_index
    analysis.toxicity_level = result.toxicity_level
    analysis.confidence_percent = result.confidence_percent
    analysis.confidence_level = result.confidence_level
    analysis.ease_u2p = result.ease_u2p
    analysis.ease_p2u = result.ease_p2u
    analysis.dur_u2p = result.dur_u2p
    analysis.dur_p2u = result.dur_p2u
    analysis.asymmetry_flag = result.asymmetry_flag
    analysis.strengths = json.dumps(result.strengths)
    analysis.watchouts = json.dumps(result.watchouts)
    analysis.interaction_events = json.dumps(result.interaction_events)
    analysis.ten_god_role = result.ten_god_role
    analysis.ten_god_interpretation = result.ten_god_interpretation
    analysis.calculated_at = datetime.utcnow()

    db.commit()

    logger.info(f"Calculated relationship analysis: user {user_id} <-> person {person_id}")

    return CompatibilityResponse(
        person_id=person_id,
        person_name=person.name,
        relationship_type=person.relationship_type,
        ease_score=result.ease_score,
        durability_score=result.durability_score,
        score_label=result.effort_label,  # Use effort label
        display_ease=result.display_ease,
        display_durability=result.display_durability,
        display_label=result.display_label,  # Already set to effort label in engine
        deep_green_eligible=result.deep_green_eligible,
        effort_label=result.effort_label,
        effort_framing=result.effort_framing,
        quadrant_interpretation=result.quadrant_interpretation,
        confidence=result.confidence_level,
        confidence_percent=result.confidence_percent,
        asymmetry={
            "flag": result.asymmetry_flag,
            "note": "One-sided experience: one person feels this more" if result.asymmetry_flag else None,
            "ease_u2p": result.ease_u2p,
            "ease_p2u": result.ease_p2u,
            "dur_u2p": result.dur_u2p,
            "dur_p2u": result.dur_p2u
        },
        strengths=result.strengths,
        watchouts=result.watchouts,
        toxicity={
            "index": result.toxicity_index,
            "level": result.toxicity_level
        },
        ten_god={
            "role": result.ten_god_role,
            "interpretation": result.ten_god_interpretation
        },
        calculated_at=analysis.calculated_at
    )
