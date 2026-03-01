"""
BaZi Relationship Palace Engine

Computes compatibility between two people using:
- Palace interactions (Earthly Branch relationships)
- Ten-God roles (Heavenly Stem relationships)

Outputs:
- Ease Score (0-100): How smooth it feels day-to-day
- Durability Score (0-100): How stable it is long-term
- Toxicity Index (0-100): Separate measure for harmful patterns
- Explanations: Top positives and negatives
"""

import json
import logging
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# =============================================================================
# BRANCH MAPPINGS (Chinese → Code)
# =============================================================================

BRANCH_MAP = {
    "子": "ZI", "丑": "CHOU", "寅": "YIN", "卯": "MAO",
    "辰": "CHEN", "巳": "SI", "午": "WU", "未": "WEI",
    "申": "SHEN", "酉": "YOU", "戌": "XU", "亥": "HAI"
}

BRANCH_MAP_REVERSE = {v: k for k, v in BRANCH_MAP.items()}

# =============================================================================
# STEM MAPPINGS
# =============================================================================

STEM_INFO = {
    "甲": {"element": "WOOD", "polarity": "YANG"},
    "乙": {"element": "WOOD", "polarity": "YIN"},
    "丙": {"element": "FIRE", "polarity": "YANG"},
    "丁": {"element": "FIRE", "polarity": "YIN"},
    "戊": {"element": "EARTH", "polarity": "YANG"},
    "己": {"element": "EARTH", "polarity": "YIN"},
    "庚": {"element": "METAL", "polarity": "YANG"},
    "辛": {"element": "METAL", "polarity": "YIN"},
    "壬": {"element": "WATER", "polarity": "YANG"},
    "癸": {"element": "WATER", "polarity": "YIN"},
}

# =============================================================================
# ELEMENT CYCLES
# =============================================================================

ELEMENT_GENERATES = {
    "WOOD": "FIRE",
    "FIRE": "EARTH",
    "EARTH": "METAL",
    "METAL": "WATER",
    "WATER": "WOOD"
}

ELEMENT_CONTROLS = {
    "WOOD": "EARTH",
    "EARTH": "WATER",
    "WATER": "FIRE",
    "FIRE": "METAL",
    "METAL": "WOOD"
}

# =============================================================================
# BRANCH INTERACTION TABLES
# =============================================================================

# Six Clashes (冲) - Direct opposition
CLASHES = [
    ("ZI", "WU"), ("CHOU", "WEI"), ("YIN", "SHEN"),
    ("MAO", "YOU"), ("CHEN", "XU"), ("SI", "HAI")
]

# Six Combinations (六合) - Natural bonding
COMBINATIONS = [
    ("ZI", "CHOU"), ("YIN", "HAI"), ("MAO", "XU"),
    ("CHEN", "YOU"), ("SI", "SHEN"), ("WU", "WEI")
]

# Six Harms (害) - Subtle tension
HARMS = [
    ("ZI", "WEI"), ("CHOU", "WU"), ("YIN", "SI"),
    ("MAO", "CHEN"), ("SHEN", "HAI"), ("YOU", "XU")
]

# Three Punishments (刑) - Stubborn loops
PUNISHMENTS = [
    {"type": "SELF_PUNISHMENT", "branches": ["CHEN", "WU", "YOU", "HAI"]},
    {"type": "THREE_PUNISHMENT", "branches": ["YIN", "SI", "SHEN"]},
    {"type": "THREE_PUNISHMENT", "branches": ["CHOU", "WEI", "XU"]}
]

# Trine Groups (三合) - Background harmony
TRINES = [
    ["SHEN", "ZI", "CHEN"],  # Water trine
    ["YIN", "WU", "XU"],     # Fire trine
    ["HAI", "MAO", "WEI"],   # Wood trine
    ["SI", "YOU", "CHOU"]    # Metal trine
]

# =============================================================================
# SCORING CONSTANTS
# =============================================================================

# Boosted impacts to compensate for palace weighting
# Target behavior with base=50:
# - Perfect synergy (2 combines + generating): ~85-90
# - Good stable: ~70-78
# - Multiple conflicts: ~35-45
BRANCH_IMPACTS = {
    "CLASH": {"ease": -30, "durability": -18},
    "HARM": {"ease": -18, "durability": -12},
    "PUNISHMENT": {"ease": -24, "durability": -16},
    "COMBINE": {"ease": 32, "durability": 28},
    "TRINE": {"ease": 16, "durability": 16},
    "NEUTRAL": {"ease": 0, "durability": 0}
}

# No-harm bonus: absence of toxicity is a stability signal
NO_HARM_BONUS = {
    "primary": {"ease": 10, "durability": 12},
    "secondary": {"ease": 5, "durability": 6}
}

STEM_TONE = {
    "same_element_same_polarity": {"ease": 14, "durability": 14},
    "same_element_opposite_polarity": {"ease": 12, "durability": 12},
    "generating": {"ease": 20, "durability": 22},
    "controlling": {"ease": -12, "durability": -6},
    "being_controlled": {"ease": -8, "durability": -4},
    "neutral": {"ease": 0, "durability": 0}
}

# Diminishing returns for stacking events (per category)
# Harmony: COMBINE, TRINE, generating/same-element stems
# Conflict: CLASH, HARM, PUNISHMENT, controlling stems
DIMINISHING_HARMONY = [1.0, 0.75, 0.50, 0.35]  # 1st, 2nd, 3rd, 4th+
DIMINISHING_CONFLICT = [1.0, 0.90, 0.80, 0.70]  # Conflicts still stack hard

# Confidence tiers for score caps
CONFIDENCE_CAPS = {
    85: 100,  # >=85% confidence -> no cap
    70: 90,   # 70-84% -> cap at 90
    55: 80,   # 55-69% -> cap at 80
    0: 70     # <55% -> cap at 70
}

# DEPRECATED: Old label system - DO NOT USE for user-facing text
# These contain forbidden terms. Use EFFORT_LABELS instead.
# Kept for internal/debugging purposes only.
_DEPRECATED_SCORE_LABELS = [
    (85, "Exceptional"),
    (75, "Strong"),
    (65, "Good"),
    (55, "Mixed"),
    (45, "Challenging"),
    (0, "_Internal_Low")  # Changed from "Poor"
]

# DEPRECATED: Old display labels - DO NOT USE for user-facing text
_DEPRECATED_DISPLAY_SCORE_LABELS = [
    (90, "Exceptional"),
    (80, "Strong"),
    (70, "Good"),
    (60, "Mixed"),
    (50, "Challenging"),
    (0, "_Internal_Low")  # Changed from "Poor"
]

# Positive Ten-Gods by relationship type (for deep green gate)
POSITIVE_TEN_GODS = {
    "spouse": ["DirectWealth", "IndirectWealth", "EatingGod", "DirectResource", "DirectOfficer"],
    "parent": ["DirectResource", "IndirectResource", "EatingGod"],
    "child": ["EatingGod", "HurtingOfficer", "Friend"],
    "sibling": ["Friend", "EatingGod", "DirectResource"],
    "friend": ["Friend", "EatingGod", "HurtingOfficer"],
    "other": ["Friend", "EatingGod", "DirectResource"]
}

# =============================================================================
# EFFORT-BASED LABELS (SINGLE SOURCE OF TRUTH)
# =============================================================================

# Threshold constants - used EVERYWHERE for consistency
HIGH_THRESHOLD = 65
MID_THRESHOLD = 50
LOW_THRESHOLD = 35

# Effort-based labels for display scores (user-facing)
EFFORT_LABELS = [
    (80, "Low-Friction Dynamic"),
    (HIGH_THRESHOLD, "Stable with Awareness"),
    (MID_THRESHOLD, "Workable with Intention"),
    (LOW_THRESHOLD, "Growth-Focused"),
    (0, "High-Effort Relationship"),
]

# Framing sentences for each effort level
EFFORT_FRAMING = {
    "Low-Friction Dynamic": "This relationship has natural ease. Continue nurturing what works well.",
    "Stable with Awareness": "This relationship flows well with mindful attention to each other's needs.",
    "Workable with Intention": "This relationship can thrive with awareness and intentional effort.",
    "Growth-Focused": "This relationship presents challenges that can become opportunities for personal growth.",
    "High-Effort Relationship": "This relationship requires significant conscious effort. The challenges are real but not insurmountable.",
}

# Quadrant labels for 2D grid interpretation
QUADRANT_LABELS = {
    "high_ease_high_dur": "Easy alignment and built to last",
    "high_ease_low_dur": "Easy day-to-day but requires attention for longevity",
    "low_ease_high_dur": "Challenging daily interactions but deeply stable over time",
    "low_ease_low_dur": "Requires effort on both fronts - significant growth potential",
}

# Standard disclaimer for all relationship readings
STANDARD_DISCLAIMER = (
    "Any relationship can work with awareness, patience, and mutual effort. "
    "These insights describe tendencies, not destiny. Use them as a guide "
    "for understanding, not as a prediction of outcomes."
)

# Forbidden terms - must NEVER appear in user-facing text
FORBIDDEN_TERMS = ["toxic", "poor", "bad", "incompatible", "destined", "doomed"]


def get_effort_label(score: int) -> str:
    """
    Get effort-based label for display score.
    SINGLE SOURCE OF TRUTH - all label lookups should use this function.
    """
    for threshold, label in EFFORT_LABELS:
        if score >= threshold:
            return label
    return "High-Effort Relationship"


def get_effort_framing(label: str) -> str:
    """Get framing sentence for effort label."""
    return EFFORT_FRAMING.get(label, "")


def get_quadrant_interpretation(ease: int, durability: int) -> str:
    """
    Get quadrant interpretation using consistent thresholds.
    Uses HIGH_THRESHOLD (65) for high/low boundary.
    """
    ease_key = "high" if ease >= HIGH_THRESHOLD else "low"
    dur_key = "high" if durability >= HIGH_THRESHOLD else "low"
    key = f"{ease_key}_ease_{dur_key}_dur"
    return QUADRANT_LABELS.get(key, "")


def display_score(raw: int) -> int:
    """
    Non-linear display curve that makes strong matches visually reach deep green.
    Presentation layer only - does NOT alter raw compatibility math.

    Curve behavior:
    - Below 55: unchanged (poor matches stay poor)
    - 55-70: gentle boost (+0 to +4.5)
    - 70-85: moderate boost (+4 to +13)
    - Above 85: cap at 100
    """
    if raw < 55:
        return raw
    elif raw < 70:
        return int(raw + (raw - 55) * 0.30)
    elif raw < 85:
        return int(raw + 4 + (raw - 70) * 0.60)
    else:
        return min(100, raw + 8)


def get_display_label(display: int) -> str:
    """
    DEPRECATED: Use get_effort_label() instead.
    This function is kept for backward compatibility but now returns effort-based labels.
    """
    # Redirect to effort-based labels
    return get_effort_label(display)


def check_deep_green_conditions(
    events: List[Dict],
    ten_god_role: str,
    relationship_type: str,
    confidence_percent: int
) -> Tuple[bool, int]:
    """
    Check deep green gate conditions. Requires 2 of 5 to pass.

    Conditions:
    1. Day branch relationship is COMBINE or TRINE
    2. Day stem interaction is GENERATING (productive flow)
    3. Ten-God is positive for relationship type
    4. No CLASH on day palace
    5. Confidence >= 85%

    Returns: (eligible, conditions_met_count)
    """
    conditions_met = 0

    # Condition 1: Day branch COMBINE or TRINE
    day_branch_harmony = any(
        e.get("palace") == "day_branch" and e.get("type") in ["COMBINE", "TRINE"]
        for e in events
    )
    if day_branch_harmony:
        conditions_met += 1

    # Condition 2: Day stem GENERATING
    stem_generating = any(
        e.get("palace") == "day_stem" and e.get("type") in ["STEM_GENERATING", "STEM_BEING_GENERATED", "GENERATING", "BEING_GENERATED"]
        for e in events
    )
    if stem_generating:
        conditions_met += 1

    # Condition 3: Positive Ten-God for relationship type
    positive_gods = POSITIVE_TEN_GODS.get(relationship_type, POSITIVE_TEN_GODS["other"])
    if ten_god_role in positive_gods:
        conditions_met += 1

    # Condition 4: No CLASH on day palace
    has_day_clash = any(
        e.get("palace") == "day_branch" and e.get("type") == "CLASH"
        for e in events
    )
    if not has_day_clash:
        conditions_met += 1

    # Condition 5: Confidence >= 85%
    if confidence_percent >= 85:
        conditions_met += 1

    # Need 2 of 5 conditions
    eligible = conditions_met >= 2

    return eligible, conditions_met

TEN_GOD_ADJUSTMENTS = {
    "spouse": {
        # Wealth gods (you control them) - traditional spouse indicators
        "DirectWealth": {"ease": 8, "durability": 10},    # Ideal spouse star
        "IndirectWealth": {"ease": 6, "durability": 6},   # Attraction, chemistry
        # Resource gods (they support you)
        "DirectResource": {"ease": 4, "durability": 7},   # Nurturing, supportive
        "IndirectResource": {"ease": 5, "durability": 5}, # Emotional support
        # Output gods (you produce them)
        "EatingGod": {"ease": 6, "durability": 5},        # Nurturing dynamic, creativity
        "HurtingOfficer": {"ease": 3, "durability": 2},   # Chemistry but friction risk
        # Authority gods (they control you)
        "DirectOfficer": {"ease": 4, "durability": 8},    # Commitment, structure
        "SevenKillings": {"ease": -4, "durability": -2},  # Intensity risk (softened)
        # Peer gods (same element)
        "Friend": {"ease": 5, "durability": 4},           # Companionship, equality
        "RobWealth": {"ease": 2, "durability": -1}        # Competition risk
    },
    "parent": {
        "DirectResource": {"ease": 10, "durability": 8},  # Ideal parent star
        "IndirectResource": {"ease": 8, "durability": 6}, # Wisdom, guidance
        "DirectOfficer": {"ease": -4, "durability": 0},   # Authority pressure
        "SevenKillings": {"ease": -6, "durability": -3},  # Harsh discipline
        "Friend": {"ease": 3, "durability": 3},
        "RobWealth": {"ease": 1, "durability": 1},
        "EatingGod": {"ease": 4, "durability": 3},
        "HurtingOfficer": {"ease": 2, "durability": 1},
        "DirectWealth": {"ease": 2, "durability": 2},
        "IndirectWealth": {"ease": 2, "durability": 2}
    },
    "child": {
        "EatingGod": {"ease": 10, "durability": 8},       # Ideal child star
        "HurtingOfficer": {"ease": 6, "durability": 4},   # Independent child
        "DirectResource": {"ease": 4, "durability": 5},
        "IndirectResource": {"ease": 3, "durability": 4},
        "DirectOfficer": {"ease": -3, "durability": 0},
        "SevenKillings": {"ease": -5, "durability": -2},
        "Friend": {"ease": 4, "durability": 4},
        "RobWealth": {"ease": 2, "durability": 1},
        "DirectWealth": {"ease": 3, "durability": 3},
        "IndirectWealth": {"ease": 3, "durability": 2}
    },
    "sibling": {
        "Friend": {"ease": 8, "durability": 7},           # Ideal sibling star
        "RobWealth": {"ease": 4, "durability": 2},        # Rivalry but bond
        "EatingGod": {"ease": 5, "durability": 4},
        "HurtingOfficer": {"ease": 3, "durability": 2},
        "DirectResource": {"ease": 4, "durability": 4},
        "IndirectResource": {"ease": 3, "durability": 3},
        "DirectWealth": {"ease": 3, "durability": 3},
        "IndirectWealth": {"ease": 3, "durability": 2},
        "DirectOfficer": {"ease": -2, "durability": 0},
        "SevenKillings": {"ease": -4, "durability": -2}
    },
    "friend": {
        "Friend": {"ease": 8, "durability": 6},
        "RobWealth": {"ease": 4, "durability": 2},
        "EatingGod": {"ease": 5, "durability": 4},
        "HurtingOfficer": {"ease": 4, "durability": 3},
        "DirectResource": {"ease": 3, "durability": 4},
        "IndirectResource": {"ease": 3, "durability": 3},
        "DirectWealth": {"ease": 4, "durability": 3},
        "IndirectWealth": {"ease": 4, "durability": 3},
        "DirectOfficer": {"ease": 2, "durability": 3},
        "SevenKillings": {"ease": -2, "durability": -1}
    },
    "other": {
        "Friend": {"ease": 4, "durability": 3},
        "RobWealth": {"ease": 2, "durability": 1},
        "EatingGod": {"ease": 3, "durability": 3},
        "HurtingOfficer": {"ease": 2, "durability": 2},
        "DirectResource": {"ease": 3, "durability": 3},
        "IndirectResource": {"ease": 2, "durability": 2},
        "DirectWealth": {"ease": 3, "durability": 3},
        "IndirectWealth": {"ease": 3, "durability": 2},
        "DirectOfficer": {"ease": 1, "durability": 2},
        "SevenKillings": {"ease": -2, "durability": -1}
    }
}

# =============================================================================
# PALACE WEIGHTS BY RELATIONSHIP TYPE
# =============================================================================

PALACE_CONFIG = {
    "spouse": {
        "primary": "day_branch",
        "secondary": "month_branch",
        "weights": {"primary": 0.60, "stem": 0.25, "secondary": 0.15}
    },
    "parent": {
        "primary": "year_branch",
        "secondary": "month_branch",
        "weights": {"primary": 0.60, "secondary": 0.25, "stem": 0.15}
    },
    "child": {
        "primary": "hour_branch",
        "secondary": "day_branch",
        "weights": {"primary": 0.60, "secondary": 0.25, "stem": 0.15}
    },
    "sibling": {
        "primary": "month_branch",
        "secondary": "day_branch",
        "weights": {"primary": 0.60, "secondary": 0.25, "stem": 0.15}
    },
    "friend": {
        "primary": "day_branch",
        "secondary": "month_branch",
        "weights": {"primary": 0.50, "stem": 0.30, "secondary": 0.20}
    },
    "other": {
        "primary": "day_branch",
        "secondary": "month_branch",
        "weights": {"primary": 0.50, "stem": 0.30, "secondary": 0.20}
    }
}

# =============================================================================
# TOXICITY SCORING
# =============================================================================

TOXICITY_ADDERS = {
    "key_palace_clash": 18,
    "key_palace_punishment": 14,
    "key_palace_harm": 10,
    "control_plus_clash": 10,
    "asymmetry_ge_12": 12,
    "asymmetry_ge_20": 18,
    "seven_killings_plus_clash": 18,
    "direct_officer_plus_punishment": 14
}

TOXICITY_LEVELS = [
    {"name": "Low", "min": 0, "max": 24},
    {"name": "Moderate", "min": 25, "max": 49},
    {"name": "High", "min": 50, "max": 69},
    {"name": "Severe", "min": 70, "max": 100}
]


# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class InteractionEvent:
    """Represents a single interaction between two palaces/stems."""
    type: str  # CLASH, COMBINE, HARM, PUNISHMENT, TRINE, STEM_*
    palace_a: str  # e.g., "day_branch", "year_stem"
    palace_b: str
    branch_a: str  # Actual branch value
    branch_b: str
    ease_delta: int
    durability_delta: int
    label: str
    severity: str  # high, medium, positive


@dataclass
class ScoreBreakdown:
    """Debug breakdown showing how score was computed."""
    base: int
    primary_raw: Dict  # {"type": "COMBINE", "ease": 32, "dur": 28}
    primary_weighted: Dict  # {"ease": 19.2, "dur": 16.8, "weight": 0.60}
    secondary_raw: Dict
    secondary_weighted: Dict
    stem_raw: Dict
    stem_weighted: Dict
    harmony_diminish: float  # multiplier applied
    conflict_diminish: float
    ten_god_adj: Dict  # {"ease": 6, "dur": 5}
    confidence: int
    confidence_cap: int
    final_ease: int
    final_dur: int


@dataclass
class CompatibilityResult:
    """Complete result of compatibility analysis."""
    ease_score: int            # Raw score (internal math)
    durability_score: int      # Raw score (internal math)
    display_ease: int = 0      # Display score (visual/UI)
    display_durability: int = 0  # Display score (visual/UI)
    display_label: str = ""    # Label based on display score
    deep_green_eligible: bool = False  # Passed gate conditions
    # Effort-based presentation fields
    effort_label: str = ""     # Effort-based label (e.g., "Workable with Intention")
    effort_framing: str = ""   # Framing sentence for the effort level
    quadrant_interpretation: str = ""  # 2D grid quadrant description
    ease_u2p: int = 0
    ease_p2u: int = 0
    dur_u2p: int = 0
    dur_p2u: int = 0
    asymmetry_flag: bool = False
    toxicity_index: int = 0
    toxicity_level: str = ""
    confidence_percent: int = 0
    confidence_level: str = ""
    strengths: List[str] = None
    watchouts: List[str] = None
    interaction_events: List[Dict] = None
    ten_god_role: str = ""
    ten_god_interpretation: str = ""
    score_label: str = ""      # Label based on raw score
    breakdown: Optional[ScoreBreakdown] = None

    def __post_init__(self):
        if self.strengths is None:
            self.strengths = []
        if self.watchouts is None:
            self.watchouts = []
        if self.interaction_events is None:
            self.interaction_events = []


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def normalize_branch(branch: str) -> str:
    """Convert Chinese branch to code, or return if already code."""
    if branch in BRANCH_MAP:
        return BRANCH_MAP[branch]
    if branch in BRANCH_MAP_REVERSE:
        return branch
    return branch.upper() if branch else ""


def get_stem_info(stem: str) -> Dict:
    """Get element and polarity for a stem."""
    return STEM_INFO.get(stem, {"element": "UNKNOWN", "polarity": "UNKNOWN"})


def check_pair_in_list(a: str, b: str, pair_list: List[Tuple]) -> bool:
    """Check if (a,b) or (b,a) exists in the pair list."""
    return (a, b) in pair_list or (b, a) in pair_list


def check_in_same_trine(a: str, b: str) -> bool:
    """Check if two branches are in the same trine group."""
    for trine in TRINES:
        if a in trine and b in trine:
            return True
    return False


def check_punishment(a: str, b: str) -> Optional[str]:
    """Check if two branches form a punishment. Returns punishment type or None."""
    for punishment in PUNISHMENTS:
        branches = punishment["branches"]
        if punishment["type"] == "SELF_PUNISHMENT":
            # Self punishment: same branch appears in both
            if a == b and a in branches:
                return "SELF_PUNISHMENT"
        else:
            # Three punishment: both branches in same set
            if a in branches and b in branches and a != b:
                return "THREE_PUNISHMENT"
    return None


# =============================================================================
# CORE INTERACTION FUNCTIONS
# =============================================================================

def branch_relation(a_branch: str, b_branch: str) -> Dict:
    """
    Determine the relationship between two branches.
    Returns the highest-precedence interaction (CLASH > PUNISHMENT > HARM > COMBINE > TRINE).
    """
    a = normalize_branch(a_branch)
    b = normalize_branch(b_branch)

    if not a or not b:
        return {
            "type": "NEUTRAL",
            "severity": "neutral",
            "ease": 0,
            "durability": 0,
            "label": "Insufficient data"
        }

    # Check in precedence order
    if check_pair_in_list(a, b, CLASHES):
        return {
            "type": "CLASH",
            "severity": "high",
            **BRANCH_IMPACTS["CLASH"],
            "label": "Clash: friction, pushes change, recurring conflict trigger"
        }

    punishment_type = check_punishment(a, b)
    if punishment_type:
        return {
            "type": "PUNISHMENT",
            "severity": "medium-high",
            **BRANCH_IMPACTS["PUNISHMENT"],
            "label": "Punishment: stubborn loops, blame cycles, same argument syndrome"
        }

    if check_pair_in_list(a, b, HARMS):
        return {
            "type": "HARM",
            "severity": "medium",
            **BRANCH_IMPACTS["HARM"],
            "label": "Harm: misunderstandings, emotional snags, passive tension"
        }

    if check_pair_in_list(a, b, COMBINATIONS):
        return {
            "type": "COMBINE",
            "severity": "positive",
            **BRANCH_IMPACTS["COMBINE"],
            "label": "Combine: natural bonding, cooperation, easy alignment"
        }

    if check_in_same_trine(a, b):
        return {
            "type": "TRINE",
            "severity": "positive",
            **BRANCH_IMPACTS["TRINE"],
            "label": "Trine: shared worldview, background harmony"
        }

    return {
        "type": "NEUTRAL",
        "severity": "neutral",
        "ease": 0,
        "durability": 0,
        "label": "Neutral: no significant interaction"
    }


def stem_relation(a_stem: str, b_stem: str) -> Dict:
    """
    Determine the relationship between two stems based on element interaction.
    """
    if not a_stem or not b_stem:
        return {
            "type": "NEUTRAL",
            **STEM_TONE["neutral"],
            "label": "Insufficient data"
        }

    info_a = get_stem_info(a_stem)
    info_b = get_stem_info(b_stem)

    elem_a = info_a["element"]
    elem_b = info_b["element"]
    pol_a = info_a["polarity"]
    pol_b = info_b["polarity"]

    # Same element
    if elem_a == elem_b:
        if pol_a == pol_b:
            return {
                "type": "SAME_ELEMENT_SAME_POLARITY",
                **STEM_TONE["same_element_same_polarity"],
                "label": "Same element, same polarity: strong rapport"
            }
        else:
            return {
                "type": "SAME_ELEMENT_OPPOSITE_POLARITY",
                **STEM_TONE["same_element_opposite_polarity"],
                "label": "Same element, complementary: natural understanding"
            }

    # Generation cycle
    if ELEMENT_GENERATES.get(elem_a) == elem_b:
        return {
            "type": "GENERATING",
            **STEM_TONE["generating"],
            "label": f"{elem_a} generates {elem_b}: nurturing, supportive flow"
        }

    if ELEMENT_GENERATES.get(elem_b) == elem_a:
        return {
            "type": "BEING_GENERATED",
            **STEM_TONE["generating"],
            "label": f"{elem_b} generates {elem_a}: receiving support"
        }

    # Control cycle
    if ELEMENT_CONTROLS.get(elem_a) == elem_b:
        return {
            "type": "CONTROLLING",
            **STEM_TONE["controlling"],
            "label": f"{elem_a} controls {elem_b}: pressure, authority dynamic"
        }

    if ELEMENT_CONTROLS.get(elem_b) == elem_a:
        return {
            "type": "BEING_CONTROLLED",
            **STEM_TONE["being_controlled"],
            "label": f"{elem_b} controls {elem_a}: feeling managed"
        }

    return {
        "type": "NEUTRAL",
        **STEM_TONE["neutral"],
        "label": "Neutral element relationship"
    }


def compute_ten_god(other_stem: str, day_master: str) -> Dict:
    """
    Compute the Ten-God relationship of another person's stem relative to user's Day Master.
    """
    if not other_stem or not day_master:
        return {"god": "Unknown", "psychology": "", "risk": ""}

    dm_info = get_stem_info(day_master)
    other_info = get_stem_info(other_stem)

    dm_elem = dm_info["element"]
    dm_pol = dm_info["polarity"]
    other_elem = other_info["element"]
    other_pol = other_info["polarity"]

    same_polarity = dm_pol == other_pol

    # Same element → Friend or Rob Wealth
    if dm_elem == other_elem:
        if same_polarity:
            return {"god": "Friend", "psychology": "Equality, competition, camaraderie", "risk": "Rivalry, ego clashes"}
        else:
            return {"god": "RobWealth", "psychology": "Shared ground, subtle competition", "risk": "Boundary issues, resentment"}

    # Day Master produces other → Eating God or Hurting Officer
    if ELEMENT_GENERATES.get(dm_elem) == other_elem:
        if same_polarity:
            return {"god": "EatingGod", "psychology": "Nurturing, expression, pride", "risk": "Overindulgence, lack of discipline"}
        else:
            return {"god": "HurtingOfficer", "psychology": "Independence, challenge, honesty", "risk": "Disrespect, defiance"}

    # Other produces Day Master → Direct/Indirect Resource
    if ELEMENT_GENERATES.get(other_elem) == dm_elem:
        if same_polarity:
            return {"god": "IndirectResource", "psychology": "Wisdom, strategy", "risk": "Overthinking, withdrawal"}
        else:
            return {"god": "DirectResource", "psychology": "Support, safety, learning", "risk": "Dependence"}

    # Other controls Day Master → Direct Officer or Seven Killings
    if ELEMENT_CONTROLS.get(other_elem) == dm_elem:
        if same_polarity:
            return {"god": "SevenKillings", "psychology": "Intensity, urgency", "risk": "Stress, intimidation"}
        else:
            return {"god": "DirectOfficer", "psychology": "Rules, structure, protection", "risk": "Pressure, fear of failure"}

    # Day Master controls other → Direct/Indirect Wealth
    if ELEMENT_CONTROLS.get(dm_elem) == other_elem:
        if same_polarity:
            return {"god": "IndirectWealth", "psychology": "Excitement, initiative", "risk": "Instability, risk-taking"}
        else:
            return {"god": "DirectWealth", "psychology": "Stability, responsibility", "risk": "Feeling managed or constrained"}

    return {"god": "Unknown", "psychology": "", "risk": ""}


# =============================================================================
# MAIN COMPATIBILITY CALCULATION
# =============================================================================

class RelationshipEngine:
    """
    Main engine for calculating relationship compatibility.

    Scoring Philosophy:
    - Base 50 = true neutral (unknown relationship)
    - Great matches can reach 85-95
    - Problematic matches can drop to 20-40
    - Absence of harm (no clashes) is rewarded, not just "nothing"
    """

    def __init__(self):
        self.base_score = 50  # True neutral - allows full range both directions

    def get_branch_value(self, person: Any, branch_name: str) -> str:
        """Get a branch value from a person object (User or AddedPerson)."""
        return getattr(person, branch_name, "") or ""

    def get_stem_value(self, person: Any, stem_name: str) -> str:
        """Get a stem value from a person object."""
        return getattr(person, stem_name, "") or ""

    def calculate_direction_score(
        self,
        from_person: Any,
        to_person: Any,
        relationship_type: str
    ) -> Tuple[int, int, List[Dict], Dict]:
        """
        Calculate compatibility score from one person's perspective.
        Returns (ease_score, durability_score, interaction_events, breakdown_data).

        Scoring philosophy:
        - ALL interactions weighted by palace importance (consistent)
        - Boosted base impacts compensate for weighting
        - Diminishing returns prevent stacking abuse (harmony vs conflict separate)
        - No-harm bonus rewards absence of toxicity
        """
        config = PALACE_CONFIG.get(relationship_type, PALACE_CONFIG["other"])
        weights = config["weights"]

        ease_delta = 0
        dur_delta = 0
        events = []
        breakdown = {
            "primary_raw": None, "primary_weighted": None,
            "secondary_raw": None, "secondary_weighted": None,
            "stem_raw": None, "stem_weighted": None,
            "harmony_count": 0, "conflict_count": 0
        }

        # Collect all interactions first (for diminishing returns calculation)
        interactions = []

        # Primary palace interaction
        primary = config["primary"]
        a_primary = self.get_branch_value(from_person, primary)
        b_primary = self.get_branch_value(to_person, primary)

        if a_primary and b_primary:
            rel = branch_relation(a_primary, b_primary)
            interactions.append({
                "palace": "primary",
                "palace_name": primary,
                "rel": rel,
                "weight": weights.get("primary", 0.6),
                "branch_a": a_primary,
                "branch_b": b_primary
            })

        # Secondary palace interaction
        secondary = config["secondary"]
        a_secondary = self.get_branch_value(from_person, secondary)
        b_secondary = self.get_branch_value(to_person, secondary)

        if a_secondary and b_secondary:
            rel = branch_relation(a_secondary, b_secondary)
            interactions.append({
                "palace": "secondary",
                "palace_name": secondary,
                "rel": rel,
                "weight": weights.get("secondary", 0.15),
                "branch_a": a_secondary,
                "branch_b": b_secondary
            })

        # Stem tone (Day Stem comparison)
        a_stem = self.get_stem_value(from_person, "day_stem")
        b_stem = self.get_stem_value(to_person, "day_stem")

        if a_stem and b_stem:
            rel = stem_relation(a_stem, b_stem)
            interactions.append({
                "palace": "stem",
                "palace_name": "day_stem",
                "rel": rel,
                "weight": weights.get("stem", 0.25),
                "branch_a": a_stem,
                "branch_b": b_stem
            })

        # Categorize and sort by impact (highest first for diminishing returns)
        harmony_interactions = []
        conflict_interactions = []

        for inter in interactions:
            rel = inter["rel"]
            if rel["type"] in ["COMBINE", "TRINE"] or (
                rel["type"] in ["SAME_ELEMENT_SAME_POLARITY", "SAME_ELEMENT_OPPOSITE_POLARITY",
                                "GENERATING", "BEING_GENERATED"] and rel["ease"] > 0
            ):
                harmony_interactions.append(inter)
            elif rel["ease"] < 0:
                conflict_interactions.append(inter)
            # NEUTRAL handled separately

        # Sort by raw impact (descending) so biggest impacts get less diminishing
        harmony_interactions.sort(key=lambda x: abs(x["rel"]["ease"]), reverse=True)
        conflict_interactions.sort(key=lambda x: abs(x["rel"]["ease"]), reverse=True)

        # Apply harmony interactions - NO diminishing returns for positives
        # Good things should stack at full palace-weighted value
        for i, inter in enumerate(harmony_interactions):
            rel = inter["rel"]
            weight = inter["weight"]
            # Positives stack fully - only apply palace weight, not diminishing
            diminish = 1.0

            weighted_ease = rel["ease"] * weight
            weighted_dur = rel["durability"] * weight

            ease_delta += weighted_ease
            dur_delta += weighted_dur

            # Store breakdown
            breakdown[f"{inter['palace']}_raw"] = {
                "type": rel["type"], "ease": rel["ease"], "dur": rel["durability"]
            }
            breakdown[f"{inter['palace']}_weighted"] = {
                "ease": round(weighted_ease, 2),
                "dur": round(weighted_dur, 2),
                "weight": weight,
                "diminish": diminish
            }

            events.append({
                "type": rel["type"] if inter["palace"] != "stem" else f"STEM_{rel['type']}",
                "palace": inter["palace_name"],
                "branch_a": inter["branch_a"],
                "branch_b": inter["branch_b"],
                "ease": rel["ease"],
                "durability": rel["durability"],
                "label": rel["label"],
                "severity": rel["severity"] if "severity" in rel else "positive",
                "weighted": True,
                "weight_applied": weight,
                "diminish_applied": diminish
            })

        breakdown["harmony_count"] = len(harmony_interactions)

        # Apply conflict interactions with diminishing returns
        for i, inter in enumerate(conflict_interactions):
            rel = inter["rel"]
            weight = inter["weight"]
            diminish = DIMINISHING_CONFLICT[min(i, len(DIMINISHING_CONFLICT) - 1)]

            weighted_ease = rel["ease"] * weight * diminish
            weighted_dur = rel["durability"] * weight * diminish

            ease_delta += weighted_ease
            dur_delta += weighted_dur

            # Store breakdown
            breakdown[f"{inter['palace']}_raw"] = {
                "type": rel["type"], "ease": rel["ease"], "dur": rel["durability"]
            }
            breakdown[f"{inter['palace']}_weighted"] = {
                "ease": round(weighted_ease, 2),
                "dur": round(weighted_dur, 2),
                "weight": weight,
                "diminish": diminish
            }

            events.append({
                "type": rel["type"] if inter["palace"] != "stem" else f"STEM_{rel['type']}",
                "palace": inter["palace_name"],
                "branch_a": inter["branch_a"],
                "branch_b": inter["branch_b"],
                "ease": rel["ease"],
                "durability": rel["durability"],
                "label": rel["label"],
                "severity": rel["severity"] if "severity" in rel else "medium",
                "weighted": True,
                "weight_applied": weight,
                "diminish_applied": diminish
            })

        breakdown["conflict_count"] = len(conflict_interactions)

        # Handle NEUTRAL palaces (no-harm bonus)
        for inter in interactions:
            rel = inter["rel"]
            if rel["type"] == "NEUTRAL":
                palace_type = inter["palace"]
                if palace_type in ["primary", "secondary"]:
                    bonus = NO_HARM_BONUS.get(palace_type, {})
                    ease_delta += bonus.get("ease", 0)
                    dur_delta += bonus.get("durability", 0)

                    events.append({
                        "type": "NO_HARM_BONUS",
                        "palace": inter["palace_name"],
                        "branch_a": inter["branch_a"],
                        "branch_b": inter["branch_b"],
                        "ease": bonus.get("ease", 0),
                        "durability": bonus.get("durability", 0),
                        "label": f"Clean {palace_type} palace: stability bonus",
                        "severity": "positive",
                        "weighted": False
                    })

        # Calculate final scores
        ease_score = max(0, min(100, int(self.base_score + ease_delta)))
        dur_score = max(0, min(100, int(self.base_score + dur_delta)))

        return ease_score, dur_score, events, breakdown

    def calculate_data_confidence(self, user: Any, person: Any) -> int:
        """
        Calculate confidence based on data completeness.
        Missing pillars reduce confidence significantly.
        """
        confidence = 100

        # User data completeness (they're the known entity)
        if not self.get_branch_value(user, "day_branch"):
            confidence -= 20
        if not self.get_stem_value(user, "day_stem"):
            confidence -= 15
        if not self.get_branch_value(user, "month_branch"):
            confidence -= 8
        if not self.get_branch_value(user, "hour_branch"):
            confidence -= 5

        # Person data completeness (weighted more since they're less known)
        if not self.get_branch_value(person, "day_branch"):
            confidence -= 25
        if not self.get_stem_value(person, "day_stem"):
            confidence -= 18
        if not self.get_branch_value(person, "month_branch"):
            confidence -= 12
        if not self.get_branch_value(person, "hour_branch"):
            confidence -= 8

        return max(0, min(100, confidence))

    def apply_confidence_cap(self, score: int, confidence: int) -> int:
        """
        Apply tiered cap based on confidence level.
        Low confidence = can't claim high scores.
        """
        cap = 100
        for threshold, max_score in sorted(CONFIDENCE_CAPS.items(), reverse=True):
            if confidence >= threshold:
                cap = max_score
                break
        return min(score, cap)

    def get_score_label(self, score: int) -> str:
        """
        DEPRECATED: Use get_effort_label() instead.
        This method is kept for backward compatibility but now returns effort-based labels.
        """
        return get_effort_label(score)

    def calculate_ten_god_adjustment(
        self,
        user: Any,
        person: Any,
        relationship_type: str
    ) -> Tuple[int, int, Dict]:
        """
        Calculate Ten-God based score adjustment.
        Returns (ease_adj, dur_adj, ten_god_info).
        """
        user_dm = self.get_stem_value(user, "day_master")
        person_dm = self.get_stem_value(person, "day_master")

        if not user_dm or not person_dm:
            return 0, 0, {"god": "Unknown", "psychology": "", "risk": ""}

        ten_god = compute_ten_god(person_dm, user_dm)
        god_name = ten_god["god"]

        # Get adjustment based on relationship type
        adjustments = TEN_GOD_ADJUSTMENTS.get(relationship_type, {})
        adj = adjustments.get(god_name, {"ease": 0, "durability": 0})

        return adj["ease"], adj["durability"], ten_god

    def calculate_toxicity(
        self,
        events: List[Dict],
        asymmetry_ease: int,
        ten_god: Dict,
        relationship_type: str
    ) -> Tuple[int, str]:
        """
        Calculate toxicity index based on harmful patterns.
        Returns (toxicity_index, toxicity_level).
        """
        toxicity = 0

        # Check for key palace clashes/punishments/harms
        config = PALACE_CONFIG.get(relationship_type, PALACE_CONFIG["other"])
        primary = config["primary"]

        for event in events:
            if event["palace"] == primary:
                if event["type"] == "CLASH":
                    toxicity += TOXICITY_ADDERS["key_palace_clash"]
                elif event["type"] == "PUNISHMENT":
                    toxicity += TOXICITY_ADDERS["key_palace_punishment"]
                elif event["type"] == "HARM":
                    toxicity += TOXICITY_ADDERS["key_palace_harm"]

        # Asymmetry adders
        if asymmetry_ease >= 20:
            toxicity += TOXICITY_ADDERS["asymmetry_ge_20"]
        elif asymmetry_ease >= 12:
            toxicity += TOXICITY_ADDERS["asymmetry_ge_12"]

        # Ten-God risk adders
        has_clash = any(e["type"] == "CLASH" for e in events)
        has_punishment = any(e["type"] == "PUNISHMENT" for e in events)

        if ten_god["god"] == "SevenKillings" and has_clash:
            toxicity += TOXICITY_ADDERS["seven_killings_plus_clash"]
        if ten_god["god"] == "DirectOfficer" and has_punishment:
            toxicity += TOXICITY_ADDERS["direct_officer_plus_punishment"]

        # Clamp to 0-100
        toxicity = max(0, min(100, toxicity))

        # Determine level
        level = "Low"
        for lvl in TOXICITY_LEVELS:
            if lvl["min"] <= toxicity <= lvl["max"]:
                level = lvl["name"]
                break

        return toxicity, level

    def generate_explanations(
        self,
        events: List[Dict],
        ten_god: Dict,
        relationship_type: str
    ) -> Tuple[List[str], List[str]]:
        """
        Generate top 3 strengths and top 3 watchouts from events.
        """
        strengths = []
        watchouts = []

        # Sort events by absolute impact
        sorted_events = sorted(
            events,
            key=lambda e: abs(e.get("ease", 0)) + abs(e.get("durability", 0)),
            reverse=True
        )

        for event in sorted_events:
            if event.get("ease", 0) > 0 or event.get("durability", 0) > 0:
                if len(strengths) < 3:
                    palace_name = event["palace"].replace("_", " ").title()
                    strengths.append(f"{palace_name}: {event['label']}")
            else:
                if len(watchouts) < 3 and event["type"] != "NEUTRAL":
                    palace_name = event["palace"].replace("_", " ").title()
                    watchouts.append(f"{palace_name}: {event['label']}")

        # Add Ten-God insight if significant
        if ten_god["god"] not in ["Unknown", "Friend"] and ten_god["risk"]:
            if len(watchouts) < 3:
                watchouts.append(f"Ten-God ({ten_god['god']}): {ten_god['risk']}")

        return strengths, watchouts

    def calculate_compatibility(
        self,
        user: Any,
        person: Any,
        relationship_type: str
    ) -> CompatibilityResult:
        """
        Main method to calculate full compatibility analysis.
        """
        # Calculate both directions (now returns 4 values including breakdown)
        ease_u2p, dur_u2p, events_u2p, breakdown_u2p = self.calculate_direction_score(
            user, person, relationship_type
        )
        ease_p2u, dur_p2u, events_p2u, breakdown_p2u = self.calculate_direction_score(
            person, user, relationship_type
        )

        # Average the scores (before Ten-God and caps)
        ease_score = round((ease_u2p + ease_p2u) / 2)
        dur_score = round((dur_u2p + dur_p2u) / 2)

        # Check asymmetry
        asymmetry_ease = abs(ease_u2p - ease_p2u)
        asymmetry_flag = asymmetry_ease >= 12

        # Combine events
        all_events = events_u2p + events_p2u

        # Ten-God adjustment
        ten_god_ease, ten_god_dur, ten_god = self.calculate_ten_god_adjustment(
            user, person, relationship_type
        )
        ease_score = max(0, min(100, ease_score + ten_god_ease))
        dur_score = max(0, min(100, dur_score + ten_god_dur))

        # Calculate confidence from data completeness
        confidence_percent = self.calculate_data_confidence(user, person)

        # Apply confidence caps
        confidence_cap = 100
        for threshold, cap in sorted(CONFIDENCE_CAPS.items(), reverse=True):
            if confidence_percent >= threshold:
                confidence_cap = cap
                break

        ease_score_capped = self.apply_confidence_cap(ease_score, confidence_percent)
        dur_score_capped = self.apply_confidence_cap(dur_score, confidence_percent)

        # Determine confidence level
        if confidence_percent >= 85:
            confidence_level = "High"
        elif confidence_percent >= 70:
            confidence_level = "Medium"
        elif confidence_percent >= 55:
            confidence_level = "Low"
        else:
            confidence_level = "Very Low"

        # Toxicity
        toxicity_index, toxicity_level = self.calculate_toxicity(
            all_events, asymmetry_ease, ten_god, relationship_type
        )

        # Explanations
        strengths, watchouts = self.generate_explanations(
            all_events, ten_god, relationship_type
        )

        # Ten-God interpretation
        ten_god_interpretation = ""
        if ten_god["god"] != "Unknown":
            ten_god_interpretation = f"{ten_god['psychology']}. Watch for: {ten_god['risk']}"

        # Score label (based on raw score)
        score_label = self.get_score_label(ease_score_capped)

        # Calculate display scores (visual/UI presentation)
        # Only apply boost if deep green conditions are met
        filtered_events = [e for e in all_events if e["type"] != "NEUTRAL"]
        deep_green_eligible, conditions_met = check_deep_green_conditions(
            filtered_events,
            ten_god["god"],
            relationship_type,
            confidence_percent
        )

        # Apply display curve only if eligible
        if deep_green_eligible:
            disp_ease = display_score(ease_score_capped)
            disp_dur = display_score(dur_score_capped)
        else:
            # Non-eligible pairs: display = raw (no visual boost)
            disp_ease = ease_score_capped
            disp_dur = dur_score_capped

        # Effort-based labels (SINGLE SOURCE OF TRUTH)
        effort_label = get_effort_label(disp_ease)
        effort_framing = get_effort_framing(effort_label)
        quadrant_interp = get_quadrant_interpretation(disp_ease, disp_dur)

        # Build breakdown for debugging
        breakdown = ScoreBreakdown(
            base=self.base_score,
            primary_raw=breakdown_u2p.get("primary_raw") or {},
            primary_weighted=breakdown_u2p.get("primary_weighted") or {},
            secondary_raw=breakdown_u2p.get("secondary_raw") or {},
            secondary_weighted=breakdown_u2p.get("secondary_weighted") or {},
            stem_raw=breakdown_u2p.get("stem_raw") or {},
            stem_weighted=breakdown_u2p.get("stem_weighted") or {},
            harmony_diminish=breakdown_u2p.get("harmony_count", 0),
            conflict_diminish=breakdown_u2p.get("conflict_count", 0),
            ten_god_adj={"ease": ten_god_ease, "dur": ten_god_dur},
            confidence=confidence_percent,
            confidence_cap=confidence_cap,
            final_ease=ease_score_capped,
            final_dur=dur_score_capped
        )

        return CompatibilityResult(
            ease_score=ease_score_capped,
            durability_score=dur_score_capped,
            display_ease=disp_ease,
            display_durability=disp_dur,
            display_label=effort_label,  # Use effort label for backward compat
            deep_green_eligible=deep_green_eligible,
            effort_label=effort_label,
            effort_framing=effort_framing,
            quadrant_interpretation=quadrant_interp,
            ease_u2p=ease_u2p,
            ease_p2u=ease_p2u,
            dur_u2p=dur_u2p,
            dur_p2u=dur_p2u,
            asymmetry_flag=asymmetry_flag,
            toxicity_index=toxicity_index,
            toxicity_level=toxicity_level,
            confidence_percent=confidence_percent,
            confidence_level=confidence_level,
            strengths=strengths,
            watchouts=watchouts,
            interaction_events=filtered_events,
            ten_god_role=ten_god["god"],
            ten_god_interpretation=ten_god_interpretation,
            score_label=score_label,
            breakdown=breakdown
        )


# Singleton instance
_engine = None

def get_relationship_engine() -> RelationshipEngine:
    """Get or create the relationship engine singleton."""
    global _engine
    if _engine is None:
        _engine = RelationshipEngine()
    return _engine
