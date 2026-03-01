"""
True Solar Time Adjustment Utility

In Bazi calculations, the Hour Pillar is based on true solar time (真太阳时),
not standard clock time. This is critical because:
- The original Bazi system was developed before standardized time zones
- Even a 10-minute difference can change the Hour Pillar
- Different regions in the same timezone can have significant solar time differences

For example, China uses a single timezone (UTC+8) despite spanning 5 natural zones.
A person born at 8:30 AM in Chengdu (104°E) would have true solar time of ~7:26 AM.
"""

from typing import Tuple, Optional


# Standard meridians for major timezones
TIMEZONE_MERIDIANS = {
    "UTC+8": 120.0,   # China, Singapore, Malaysia, etc.
    "UTC+9": 135.0,   # Japan, Korea
    "UTC+7": 105.0,   # Thailand, Vietnam
    "UTC+5:30": 82.5, # India
    "UTC-5": -75.0,   # US Eastern
    "UTC-8": -120.0,  # US Pacific
    "UTC+0": 0.0,     # UK, Portugal
    "UTC+1": 15.0,    # Central Europe
}


def get_standard_meridian(timezone: str = "UTC+8") -> float:
    """
    Get the standard meridian for a timezone.
    Defaults to UTC+8 (China Standard Time).
    """
    return TIMEZONE_MERIDIANS.get(timezone, 120.0)


def adjust_solar_time(
    hour: int,
    minute: int,
    longitude: Optional[float],
    standard_meridian: float = 120.0
) -> Tuple[int, int]:
    """
    Adjust clock time to true solar time based on longitude.

    The adjustment is calculated as:
    - 4 minutes per degree of longitude difference from the standard meridian
    - East of standard meridian = add time
    - West of standard meridian = subtract time

    Args:
        hour: Clock hour (0-23)
        minute: Clock minute (0-59)
        longitude: Birth location longitude in degrees (e.g., 121.47 for Shanghai)
        standard_meridian: The meridian for the timezone (default 120°E for China)

    Returns:
        Tuple of (adjusted_hour, adjusted_minute)

    Example:
        # Person born at 8:30 AM in Chengdu (104°E), China Standard Time (120°E)
        >>> adjust_solar_time(8, 30, 104.0, 120.0)
        (7, 26)  # True solar time is about 64 minutes earlier
    """
    if longitude is None:
        return hour, minute

    # Calculate adjustment: 4 minutes per degree
    # Positive longitude means east, negative means west
    adjustment_minutes = (longitude - standard_meridian) * 4

    # Convert to total minutes and apply adjustment
    total_minutes = hour * 60 + minute + adjustment_minutes

    # Handle day boundary crossings
    if total_minutes < 0:
        total_minutes += 24 * 60
    elif total_minutes >= 24 * 60:
        total_minutes -= 24 * 60

    adjusted_hour = int(total_minutes // 60)
    adjusted_minute = int(total_minutes % 60)

    return adjusted_hour, adjusted_minute


def get_chinese_hour(hour: int) -> str:
    """
    Convert hour to Chinese zodiac hour (时辰).

    Chinese hours are 2-hour periods:
    - 子时 (Zi): 23:00 - 00:59
    - 丑时 (Chou): 01:00 - 02:59
    - 寅时 (Yin): 03:00 - 04:59
    - 卯时 (Mao): 05:00 - 06:59
    - 辰时 (Chen): 07:00 - 08:59
    - 巳时 (Si): 09:00 - 10:59
    - 午时 (Wu): 11:00 - 12:59
    - 未时 (Wei): 13:00 - 14:59
    - 申时 (Shen): 15:00 - 16:59
    - 酉时 (You): 17:00 - 18:59
    - 戌时 (Xu): 19:00 - 20:59
    - 亥时 (Hai): 21:00 - 22:59
    """
    branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]

    # Adjust for the fact that 子时 spans midnight (23:00-00:59)
    if hour == 23:
        index = 0
    else:
        index = (hour + 1) // 2

    return branches[index]
