"""
Bazi Calculator Agent

Calculates the Four Pillars of Destiny (八字) from birth data using the lunar-python library.
This is the core calculation engine - all computations are deterministic (no AI needed).
"""

import json
import logging
from datetime import date, time
from typing import Dict, Any, Optional
from dataclasses import dataclass

from lunar_python import Solar

from utils.solar_time import adjust_solar_time

logger = logging.getLogger(__name__)


# Heavenly Stems (天干) with elements and polarity
STEMS = {
    "甲": {"element": "Wood", "element_zh": "木", "polarity": "Yang"},
    "乙": {"element": "Wood", "element_zh": "木", "polarity": "Yin"},
    "丙": {"element": "Fire", "element_zh": "火", "polarity": "Yang"},
    "丁": {"element": "Fire", "element_zh": "火", "polarity": "Yin"},
    "戊": {"element": "Earth", "element_zh": "土", "polarity": "Yang"},
    "己": {"element": "Earth", "element_zh": "土", "polarity": "Yin"},
    "庚": {"element": "Metal", "element_zh": "金", "polarity": "Yang"},
    "辛": {"element": "Metal", "element_zh": "金", "polarity": "Yin"},
    "壬": {"element": "Water", "element_zh": "水", "polarity": "Yang"},
    "癸": {"element": "Water", "element_zh": "水", "polarity": "Yin"},
}

# Earthly Branches (地支) with elements
BRANCHES = {
    "子": {"element": "Water", "element_zh": "水", "animal": "Rat", "animal_zh": "鼠"},
    "丑": {"element": "Earth", "element_zh": "土", "animal": "Ox", "animal_zh": "牛"},
    "寅": {"element": "Wood", "element_zh": "木", "animal": "Tiger", "animal_zh": "虎"},
    "卯": {"element": "Wood", "element_zh": "木", "animal": "Rabbit", "animal_zh": "兔"},
    "辰": {"element": "Earth", "element_zh": "土", "animal": "Dragon", "animal_zh": "龙"},
    "巳": {"element": "Fire", "element_zh": "火", "animal": "Snake", "animal_zh": "蛇"},
    "午": {"element": "Fire", "element_zh": "火", "animal": "Horse", "animal_zh": "马"},
    "未": {"element": "Earth", "element_zh": "土", "animal": "Goat", "animal_zh": "羊"},
    "申": {"element": "Metal", "element_zh": "金", "animal": "Monkey", "animal_zh": "猴"},
    "酉": {"element": "Metal", "element_zh": "金", "animal": "Rooster", "animal_zh": "鸡"},
    "戌": {"element": "Earth", "element_zh": "土", "animal": "Dog", "animal_zh": "狗"},
    "亥": {"element": "Water", "element_zh": "水", "animal": "Pig", "animal_zh": "猪"},
}

# Ten Gods (十神) English translations
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
    "日主": "Day Master",
}


@dataclass
class BaziResult:
    """Result of Bazi calculation."""
    year_pillar: str
    month_pillar: str
    day_pillar: str
    hour_pillar: str

    year_stem: str
    year_branch: str
    month_stem: str
    month_branch: str
    day_stem: str
    day_branch: str
    hour_stem: str
    hour_branch: str

    day_master: str
    day_master_element: str
    day_master_polarity: str

    year_ten_god: str
    month_ten_god: str
    hour_ten_god: str

    element_counts: Dict[str, int]

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "year_pillar": self.year_pillar,
            "month_pillar": self.month_pillar,
            "day_pillar": self.day_pillar,
            "hour_pillar": self.hour_pillar,
            "year_stem": self.year_stem,
            "year_branch": self.year_branch,
            "month_stem": self.month_stem,
            "month_branch": self.month_branch,
            "day_stem": self.day_stem,
            "day_branch": self.day_branch,
            "hour_stem": self.hour_stem,
            "hour_branch": self.hour_branch,
            "day_master": self.day_master,
            "day_master_element": self.day_master_element,
            "day_master_polarity": self.day_master_polarity,
            "year_ten_god": self.year_ten_god,
            "month_ten_god": self.month_ten_god,
            "hour_ten_god": self.hour_ten_god,
            "element_counts": self.element_counts,
        }


class BaziCalculator:
    """
    Calculator for Bazi Four Pillars using lunar-python library.
    """

    def __init__(self):
        self.stems = STEMS
        self.branches = BRANCHES

    def calculate(
        self,
        birth_date: date,
        birth_time: time,
        longitude: Optional[float] = None,
        standard_meridian: float = 120.0
    ) -> BaziResult:
        """
        Calculate the Four Pillars from birth data.

        Args:
            birth_date: Date of birth
            birth_time: Time of birth
            longitude: Birth location longitude for true solar time adjustment
            standard_meridian: Standard meridian for timezone (default 120°E for China)

        Returns:
            BaziResult with all pillar data
        """
        # Apply true solar time adjustment if longitude provided
        adjusted_hour, adjusted_minute = adjust_solar_time(
            birth_time.hour,
            birth_time.minute,
            longitude,
            standard_meridian
        )

        logger.debug(
            f"Calculating Bazi for {birth_date} {birth_time} "
            f"(adjusted to {adjusted_hour}:{adjusted_minute:02d})"
        )

        # Create Solar date object
        solar = Solar.fromYmdHms(
            birth_date.year,
            birth_date.month,
            birth_date.day,
            adjusted_hour,
            adjusted_minute,
            0
        )

        # Get lunar date and eight characters
        lunar = solar.getLunar()
        eight_char = lunar.getEightChar()

        # Extract pillars
        year_pillar = eight_char.getYear()
        month_pillar = eight_char.getMonth()
        day_pillar = eight_char.getDay()
        hour_pillar = eight_char.getTime()

        # Extract stems and branches
        year_stem = eight_char.getYearGan()
        year_branch = eight_char.getYearZhi()
        month_stem = eight_char.getMonthGan()
        month_branch = eight_char.getMonthZhi()
        day_stem = eight_char.getDayGan()
        day_branch = eight_char.getDayZhi()
        hour_stem = eight_char.getTimeGan()
        hour_branch = eight_char.getTimeZhi()

        # Day Master info
        day_master = day_stem
        day_master_info = self.stems.get(day_master, {})
        day_master_element = day_master_info.get("element", "Unknown")
        day_master_polarity = day_master_info.get("polarity", "Unknown")

        # Ten Gods (relative to Day Master)
        year_ten_god = eight_char.getYearShiShenGan()
        month_ten_god = eight_char.getMonthShiShenGan()
        hour_ten_god = eight_char.getTimeShiShenGan()

        # Count elements from all stems and branches
        element_counts = self._count_elements(
            [year_stem, month_stem, day_stem, hour_stem],
            [year_branch, month_branch, day_branch, hour_branch]
        )

        return BaziResult(
            year_pillar=year_pillar,
            month_pillar=month_pillar,
            day_pillar=day_pillar,
            hour_pillar=hour_pillar,
            year_stem=year_stem,
            year_branch=year_branch,
            month_stem=month_stem,
            month_branch=month_branch,
            day_stem=day_stem,
            day_branch=day_branch,
            hour_stem=hour_stem,
            hour_branch=hour_branch,
            day_master=day_master,
            day_master_element=day_master_element,
            day_master_polarity=day_master_polarity,
            year_ten_god=year_ten_god,
            month_ten_god=month_ten_god,
            hour_ten_god=hour_ten_god,
            element_counts=element_counts,
        )

    def _count_elements(self, stems: list, branches: list) -> Dict[str, int]:
        """Count the Five Elements from stems and branches."""
        counts = {"Wood": 0, "Fire": 0, "Earth": 0, "Metal": 0, "Water": 0}

        for stem in stems:
            if stem in self.stems:
                element = self.stems[stem]["element"]
                counts[element] += 1

        for branch in branches:
            if branch in self.branches:
                element = self.branches[branch]["element"]
                counts[element] += 1

        return counts

    def get_pillar_for_date(self, target_date: date) -> Dict[str, Any]:
        """
        Get the day pillar for any date (no birth time needed).
        Useful for calculating daily energy.
        """
        solar = Solar.fromYmd(target_date.year, target_date.month, target_date.day)
        lunar = solar.getLunar()
        eight_char = lunar.getEightChar()

        day_stem = eight_char.getDayGan()
        day_branch = eight_char.getDayZhi()
        day_pillar = eight_char.getDay()

        stem_info = self.stems.get(day_stem, {})

        return {
            "date": target_date.isoformat(),
            "pillar": day_pillar,
            "stem": day_stem,
            "branch": day_branch,
            "element": stem_info.get("element", "Unknown"),
            "element_zh": stem_info.get("element_zh", ""),
            "polarity": stem_info.get("polarity", "Unknown"),
        }


def calculate_bazi(
    birth_date: date,
    birth_time: time,
    longitude: Optional[float] = None,
    standard_meridian: float = 120.0
) -> BaziResult:
    """
    Convenience function to calculate Bazi.

    Example:
        >>> from datetime import date, time
        >>> result = calculate_bazi(date(1990, 7, 15), time(14, 30), longitude=121.47)
        >>> print(result.day_master, result.day_master_element)
    """
    calculator = BaziCalculator()
    return calculator.calculate(birth_date, birth_time, longitude, standard_meridian)


def get_element_summary(element_counts: Dict[str, int]) -> str:
    """Generate a human-readable summary of element distribution."""
    sorted_elements = sorted(element_counts.items(), key=lambda x: x[1], reverse=True)
    parts = []
    for element, count in sorted_elements:
        if count > 0:
            parts.append(f"{element}: {count}")
    return ", ".join(parts)
