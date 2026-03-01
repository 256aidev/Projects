"""
Daily Energy Agent

Analyzes how today's energy interacts with a user's natal Bazi chart.
This agent detects clashes, combinations, and element interactions.
All calculations are deterministic (no AI needed).
"""

import json
import logging
from datetime import date
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field

from .bazi_calculator import BaziCalculator, STEMS, BRANCHES

logger = logging.getLogger(__name__)


# Branch Clashes (冲) - opposing branches that conflict
BRANCH_CLASHES = {
    "子": "午", "午": "子",  # Rat vs Horse
    "丑": "未", "未": "丑",  # Ox vs Goat
    "寅": "申", "申": "寅",  # Tiger vs Monkey
    "卯": "酉", "酉": "卯",  # Rabbit vs Rooster
    "辰": "戌", "戌": "辰",  # Dragon vs Dog
    "巳": "亥", "亥": "巳",  # Snake vs Pig
}

# Branch Combinations (六合) - harmonious pairings
BRANCH_COMBINATIONS = {
    "子": "丑",  # Rat + Ox = Earth
    "丑": "子",
    "寅": "亥",  # Tiger + Pig = Wood
    "亥": "寅",
    "卯": "戌",  # Rabbit + Dog = Fire
    "戌": "卯",
    "辰": "酉",  # Dragon + Rooster = Metal
    "酉": "辰",
    "巳": "申",  # Snake + Monkey = Water
    "申": "巳",
    "午": "未",  # Horse + Goat = Fire
    "未": "午",
}

# Three Harmony (三合) - powerful element combinations
THREE_HARMONY = {
    "Water": ["申", "子", "辰"],  # Monkey, Rat, Dragon
    "Wood": ["亥", "卯", "未"],   # Pig, Rabbit, Goat
    "Fire": ["寅", "午", "戌"],   # Tiger, Horse, Dog
    "Metal": ["巳", "酉", "丑"],  # Snake, Rooster, Ox
}

# Branch Punishments (刑) - challenging interactions
BRANCH_PUNISHMENTS = {
    "寅": ["巳", "申"],  # Tiger punishes Snake, Monkey
    "巳": ["寅", "申"],  # Snake punishes Tiger, Monkey
    "申": ["寅", "巳"],  # Monkey punishes Tiger, Snake
    "丑": ["戌", "未"],  # Ox punishes Dog, Goat
    "戌": ["丑", "未"],  # Dog punishes Ox, Goat
    "未": ["丑", "戌"],  # Goat punishes Ox, Dog
    "子": ["卯"],        # Rat punishes Rabbit
    "卯": ["子"],        # Rabbit punishes Rat
}

# Element relationships
ELEMENT_PRODUCES = {
    "Wood": "Fire",   # Wood feeds Fire
    "Fire": "Earth",  # Fire creates Earth (ash)
    "Earth": "Metal", # Earth contains Metal
    "Metal": "Water", # Metal carries Water
    "Water": "Wood",  # Water nourishes Wood
}

ELEMENT_CONTROLS = {
    "Wood": "Earth",  # Wood penetrates Earth
    "Earth": "Water", # Earth absorbs Water
    "Water": "Fire",  # Water extinguishes Fire
    "Fire": "Metal",  # Fire melts Metal
    "Metal": "Wood",  # Metal cuts Wood
}


# Ten Gods based on Day Master element relationship
TEN_GODS_MAP = {
    # (day_master_element, other_element, same_polarity) -> ten_god
    ("same", True): "比肩",      # Companion - same element, same polarity
    ("same", False): "劫财",     # Rob Wealth - same element, different polarity
    ("produces", True): "食神",  # Eating God - I produce, same polarity
    ("produces", False): "伤官", # Hurting Officer - I produce, different polarity
    ("produced_by", True): "偏印",  # Indirect Resource - produces me, same polarity
    ("produced_by", False): "正印", # Direct Resource - produces me, different polarity
    ("controls", True): "偏财",  # Indirect Wealth - I control, same polarity
    ("controls", False): "正财", # Direct Wealth - I control, different polarity
    ("controlled_by", True): "七杀",  # Seven Killings - controls me, same polarity
    ("controlled_by", False): "正官", # Direct Officer - controls me, different polarity
}

TEN_GODS_EN = {
    "比肩": "Companion",
    "劫财": "Rob Wealth",
    "食神": "Eating God",
    "伤官": "Hurting Officer",
    "偏财": "Indirect Wealth",
    "正财": "Direct Wealth",
    "七杀": "Seven Killings",
    "正官": "Direct Officer",
    "偏印": "Indirect Resource",
    "正印": "Direct Resource",
}


@dataclass
class DailyEnergyResult:
    """Result of daily energy analysis."""
    date: str
    daily_pillar: str
    daily_stem: str
    daily_branch: str
    daily_element: str
    daily_polarity: str

    # Relationship to user's Day Master
    day_master_ten_god: str
    day_master_ten_god_en: str
    element_relationship: str  # "supporting", "draining", "controlling", "controlled", "neutral"

    # Interactions with natal chart
    clashes: List[Dict[str, str]] = field(default_factory=list)
    combinations: List[Dict[str, str]] = field(default_factory=list)
    punishments: List[Dict[str, str]] = field(default_factory=list)

    # Favorable hours (branches that support the Day Master)
    favorable_hours: List[str] = field(default_factory=list)
    unfavorable_hours: List[str] = field(default_factory=list)

    # Summary for LLM
    summary: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "date": self.date,
            "daily_pillar": self.daily_pillar,
            "daily_stem": self.daily_stem,
            "daily_branch": self.daily_branch,
            "daily_element": self.daily_element,
            "daily_polarity": self.daily_polarity,
            "day_master_ten_god": self.day_master_ten_god,
            "day_master_ten_god_en": self.day_master_ten_god_en,
            "element_relationship": self.element_relationship,
            "clashes": self.clashes,
            "combinations": self.combinations,
            "punishments": self.punishments,
            "favorable_hours": self.favorable_hours,
            "unfavorable_hours": self.unfavorable_hours,
            "summary": self.summary,
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=2)


class DailyEnergyAgent:
    """
    Analyzes daily energy interactions with a user's natal chart.
    """

    def __init__(self):
        self.calculator = BaziCalculator()

    def analyze(
        self,
        target_date: date,
        user_day_master: str,
        user_branches: List[str],
        user_stems: Optional[List[str]] = None
    ) -> DailyEnergyResult:
        """
        Analyze how today's energy interacts with the user's chart.

        Args:
            target_date: The date to analyze
            user_day_master: User's Day Master stem (e.g., "辛")
            user_branches: List of user's four branches [year, month, day, hour]
            user_stems: Optional list of user's four stems

        Returns:
            DailyEnergyResult with all interactions
        """
        # Get today's pillar
        day_info = self.calculator.get_pillar_for_date(target_date)

        daily_stem = day_info["stem"]
        daily_branch = day_info["branch"]
        daily_element = day_info["element"]
        daily_polarity = day_info["polarity"]

        # Get Day Master info
        dm_info = STEMS.get(user_day_master, {})
        dm_element = dm_info.get("element", "Unknown")
        dm_polarity = dm_info.get("polarity", "Unknown")

        # Calculate Ten God relationship
        ten_god, ten_god_en = self._get_ten_god(
            dm_element, dm_polarity,
            daily_element, daily_polarity
        )

        # Determine element relationship
        element_rel = self._get_element_relationship(dm_element, daily_element)

        # Find clashes
        clashes = self._find_clashes(daily_branch, user_branches)

        # Find combinations
        combinations = self._find_combinations(daily_branch, user_branches)

        # Find punishments
        punishments = self._find_punishments(daily_branch, user_branches)

        # Determine favorable/unfavorable hours
        favorable, unfavorable = self._get_favorable_hours(dm_element)

        # Generate summary
        summary = self._generate_summary(
            daily_element, ten_god_en, element_rel,
            clashes, combinations, punishments
        )

        return DailyEnergyResult(
            date=target_date.isoformat(),
            daily_pillar=day_info["pillar"],
            daily_stem=daily_stem,
            daily_branch=daily_branch,
            daily_element=daily_element,
            daily_polarity=daily_polarity,
            day_master_ten_god=ten_god,
            day_master_ten_god_en=ten_god_en,
            element_relationship=element_rel,
            clashes=clashes,
            combinations=combinations,
            punishments=punishments,
            favorable_hours=favorable,
            unfavorable_hours=unfavorable,
            summary=summary,
        )

    def _get_ten_god(
        self,
        dm_element: str,
        dm_polarity: str,
        other_element: str,
        other_polarity: str
    ) -> tuple:
        """Determine Ten God relationship between Day Master and another stem."""
        same_polarity = (dm_polarity == other_polarity)

        if dm_element == other_element:
            relationship = "same"
        elif ELEMENT_PRODUCES.get(dm_element) == other_element:
            relationship = "produces"
        elif ELEMENT_PRODUCES.get(other_element) == dm_element:
            relationship = "produced_by"
        elif ELEMENT_CONTROLS.get(dm_element) == other_element:
            relationship = "controls"
        elif ELEMENT_CONTROLS.get(other_element) == dm_element:
            relationship = "controlled_by"
        else:
            relationship = "same"  # fallback

        ten_god = TEN_GODS_MAP.get((relationship, same_polarity), "比肩")
        ten_god_en = TEN_GODS_EN.get(ten_god, "Companion")

        return ten_god, ten_god_en

    def _get_element_relationship(self, dm_element: str, daily_element: str) -> str:
        """Determine how daily element affects Day Master."""
        if dm_element == daily_element:
            return "neutral"
        elif ELEMENT_PRODUCES.get(daily_element) == dm_element:
            return "supporting"  # Daily element produces Day Master
        elif ELEMENT_PRODUCES.get(dm_element) == daily_element:
            return "draining"  # Day Master produces daily element (exhausting)
        elif ELEMENT_CONTROLS.get(daily_element) == dm_element:
            return "controlled"  # Daily element controls Day Master
        elif ELEMENT_CONTROLS.get(dm_element) == daily_element:
            return "controlling"  # Day Master controls daily element (wealth)
        return "neutral"

    def _find_clashes(self, daily_branch: str, user_branches: List[str]) -> List[Dict[str, str]]:
        """Find branch clashes between daily branch and user's branches."""
        clashes = []
        clash_target = BRANCH_CLASHES.get(daily_branch)

        pillar_names = ["year", "month", "day", "hour"]
        for i, branch in enumerate(user_branches):
            if branch == clash_target:
                clashes.append({
                    "type": "clash",
                    "daily_branch": daily_branch,
                    "natal_branch": branch,
                    "natal_pillar": pillar_names[i],
                    "description_en": f"Daily {BRANCHES[daily_branch]['animal']} clashes with natal {BRANCHES[branch]['animal']}",
                    "description_zh": f"日支{daily_branch}冲{pillar_names[i]}支{branch}",
                })
        return clashes

    def _find_combinations(self, daily_branch: str, user_branches: List[str]) -> List[Dict[str, str]]:
        """Find branch combinations (六合)."""
        combinations = []
        combo_target = BRANCH_COMBINATIONS.get(daily_branch)

        pillar_names = ["year", "month", "day", "hour"]
        for i, branch in enumerate(user_branches):
            if branch == combo_target:
                combinations.append({
                    "type": "combination",
                    "daily_branch": daily_branch,
                    "natal_branch": branch,
                    "natal_pillar": pillar_names[i],
                    "description_en": f"Daily {BRANCHES[daily_branch]['animal']} combines with natal {BRANCHES[branch]['animal']}",
                    "description_zh": f"日支{daily_branch}合{pillar_names[i]}支{branch}",
                })
        return combinations

    def _find_punishments(self, daily_branch: str, user_branches: List[str]) -> List[Dict[str, str]]:
        """Find branch punishments (刑)."""
        punishments = []
        punishment_targets = BRANCH_PUNISHMENTS.get(daily_branch, [])

        pillar_names = ["year", "month", "day", "hour"]
        for i, branch in enumerate(user_branches):
            if branch in punishment_targets:
                punishments.append({
                    "type": "punishment",
                    "daily_branch": daily_branch,
                    "natal_branch": branch,
                    "natal_pillar": pillar_names[i],
                    "description_en": f"Daily {BRANCHES[daily_branch]['animal']} punishes natal {BRANCHES[branch]['animal']}",
                    "description_zh": f"日支{daily_branch}刑{pillar_names[i]}支{branch}",
                })
        return punishments

    def _get_favorable_hours(self, dm_element: str) -> tuple:
        """
        Get favorable and unfavorable hour branches based on Day Master element.

        Favorable: Hours that produce or are same as Day Master
        Unfavorable: Hours that control Day Master
        """
        favorable = []
        unfavorable = []

        # Element that produces Day Master
        producing_element = None
        for elem, produces in ELEMENT_PRODUCES.items():
            if produces == dm_element:
                producing_element = elem
                break

        # Element that controls Day Master
        controlling_element = None
        for elem, controls in ELEMENT_CONTROLS.items():
            if controls == dm_element:
                controlling_element = elem
                break

        for branch, info in BRANCHES.items():
            branch_elem = info["element"]
            if branch_elem == dm_element or branch_elem == producing_element:
                favorable.append(branch)
            elif branch_elem == controlling_element:
                unfavorable.append(branch)

        return favorable, unfavorable

    def _generate_summary(
        self,
        daily_element: str,
        ten_god_en: str,
        element_rel: str,
        clashes: List,
        combinations: List,
        punishments: List
    ) -> str:
        """Generate a summary string for the LLM."""
        parts = []

        # Element relationship
        rel_descriptions = {
            "supporting": f"{daily_element} day supports and strengthens you",
            "draining": f"{daily_element} day may drain your energy",
            "controlling": f"You have control over {daily_element} energy (wealth opportunity)",
            "controlled": f"{daily_element} day may bring challenges or pressure",
            "neutral": f"{daily_element} day has neutral energy for you",
        }
        parts.append(rel_descriptions.get(element_rel, ""))

        # Ten God
        parts.append(f"Today represents {ten_god_en} energy")

        # Interactions
        if clashes:
            parts.append(f"{len(clashes)} clash(es) detected - potential for conflict or change")
        if combinations:
            parts.append(f"{len(combinations)} combination(s) detected - harmonious connections")
        if punishments:
            parts.append(f"{len(punishments)} punishment(s) detected - need for caution")

        return ". ".join(parts) + "."


def analyze_daily_energy(
    target_date: date,
    user_day_master: str,
    user_branches: List[str],
    user_stems: Optional[List[str]] = None
) -> DailyEnergyResult:
    """
    Convenience function to analyze daily energy.

    Example:
        >>> from datetime import date
        >>> result = analyze_daily_energy(
        ...     date.today(),
        ...     user_day_master="辛",
        ...     user_branches=["子", "午", "巳", "寅"]
        ... )
        >>> print(result.summary)
    """
    agent = DailyEnergyAgent()
    return agent.analyze(target_date, user_day_master, user_branches, user_stems)
