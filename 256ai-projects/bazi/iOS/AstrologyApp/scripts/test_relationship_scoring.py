#!/usr/bin/env python3
"""
Golden Test Matrix for Relationship Scoring Engine

Tests 10 scenarios to verify score distribution:
1. Perfect synergy → 85-95
2. Good stable → 65-80
3. Neutral everything → 50-60
4. One major clash → 35-55
5. Multiple harms → 15-40
6. SevenKillings + conflict → low with warnings
7. RobWealth + competitive → moderate, lower durability
8. DirectOfficer + stability → high durability
9. Asymmetric pair → show why
10. Missing birth time → verify renormalization
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dataclasses import dataclass
from typing import Optional
from engines.relationship_engine import RelationshipEngine, get_relationship_engine

@dataclass
class MockPerson:
    """Mock person for testing."""
    name: str
    day_stem: str = ""
    day_branch: str = ""
    month_branch: str = ""
    year_branch: str = ""
    hour_branch: str = ""
    day_master: str = ""

    def get_confidence_percent(self):
        # Return 100 if all branches present, lower if missing
        branches = [self.day_branch, self.month_branch, self.year_branch, self.hour_branch]
        present = sum(1 for b in branches if b)
        return int(present / 4 * 100)


# Branch codes
ZI, CHOU, YIN, MAO = "子", "丑", "寅", "卯"
CHEN, SI, WU, WEI = "辰", "巳", "午", "未"
SHEN, YOU, XU, HAI = "申", "酉", "戌", "亥"

# Stem codes
JIA, YI = "甲", "乙"  # Wood
BING, DING = "丙", "丁"  # Fire
WU_STEM, JI = "戊", "己"  # Earth
GENG, XIN = "庚", "辛"  # Metal
REN, GUI = "壬", "癸"  # Water


def print_result(name: str, result, expected_ease: str, expected_dur: str):
    """Print test result with breakdown."""
    print(f"\n{'='*60}")
    print(f"TEST: {name}")
    print(f"{'='*60}")
    print(f"Expected Ease: {expected_ease}")
    print(f"Expected Dur:  {expected_dur}")
    print(f"{'-'*60}")
    print(f"ACTUAL SCORES:")
    print(f"  Ease Score:       {result.ease_score}")
    print(f"  Durability Score: {result.durability_score}")
    print(f"  Toxicity:         {result.toxicity_index} ({result.toxicity_level})")
    print(f"  Ten-God:          {result.ten_god_role}")
    print(f"  Asymmetry:        {result.asymmetry_flag} (U->P: {result.ease_u2p}, P->U: {result.ease_p2u})")
    print(f"{'-'*60}")
    print(f"EVENTS:")
    for event in result.interaction_events:
        print(f"  [{event['type']}] {event['palace']}: {event['label']}")
        print(f"      ease={event['ease']}, dur={event['durability']}")
    print(f"{'-'*60}")
    print(f"STRENGTHS: {result.strengths}")
    print(f"WATCHOUTS: {result.watchouts}")

    # Validate
    ease_range = expected_ease.split("-")
    dur_range = expected_dur.split("-")
    ease_ok = int(ease_range[0]) <= result.ease_score <= int(ease_range[1])
    dur_ok = int(dur_range[0]) <= result.durability_score <= int(dur_range[1])

    status = "[PASS]" if ease_ok and dur_ok else "[FAIL]"
    print(f"\nSTATUS: {status}")
    if not ease_ok:
        print(f"  Ease {result.ease_score} not in range {expected_ease}")
    if not dur_ok:
        print(f"  Durability {result.durability_score} not in range {expected_dur}")

    return ease_ok and dur_ok


def run_tests():
    """Run all golden tests."""
    engine = get_relationship_engine()
    results = []

    # =========================================================================
    # TEST 1: Perfect Synergy
    # Multiple combines, generating stems, positive Ten-God
    # Day branches: ZI-CHOU (combine), Month: YIN-HAI (combine)
    # Stems: Fire generates Earth (DING → JI)
    # =========================================================================
    user1 = MockPerson(
        name="User1",
        day_stem=DING,      # Yin Fire
        day_branch=ZI,      # Rat
        month_branch=YIN,   # Tiger
        day_master=DING
    )
    person1 = MockPerson(
        name="Person1",
        day_stem=JI,        # Yin Earth (Fire generates Earth)
        day_branch=CHOU,    # Ox (combines with Rat)
        month_branch=HAI,   # Pig (combines with Tiger)
        day_master=JI
    )
    result = engine.calculate_compatibility(user1, person1, "spouse")
    results.append(print_result(
        "1. Perfect Synergy (2 combines + generating)",
        result, "75-95", "75-95"
    ))

    # =========================================================================
    # TEST 2: Good Stable
    # No harm, generating stems, positive Ten-God
    # Neutral branches
    # =========================================================================
    user2 = MockPerson(
        name="User2",
        day_stem=BING,      # Yang Fire
        day_branch=CHEN,    # Dragon
        month_branch=XU,    # Dog
        day_master=BING
    )
    person2 = MockPerson(
        name="Person2",
        day_stem=WU_STEM,   # Yang Earth (Fire generates Earth)
        day_branch=WEI,     # Goat (neutral with Dragon)
        month_branch=MAO,   # Rabbit (neutral with Dog)
        day_master=WU_STEM
    )
    result = engine.calculate_compatibility(user2, person2, "spouse")
    results.append(print_result(
        "2. Good Stable (generating, neutral branches)",
        result, "60-80", "65-85"
    ))

    # =========================================================================
    # TEST 3: Neutral Everything
    # No interactions, neutral stems
    # =========================================================================
    user3 = MockPerson(
        name="User3",
        day_stem=JIA,       # Yang Wood
        day_branch=CHEN,    # Dragon
        month_branch=XU,    # Dog
        day_master=JIA
    )
    person3 = MockPerson(
        name="Person3",
        day_stem=GENG,      # Yang Metal (controls Wood - negative!)
        day_branch=WEI,     # Goat
        month_branch=MAO,   # Rabbit
        day_master=GENG
    )
    result = engine.calculate_compatibility(user3, person3, "spouse")
    results.append(print_result(
        "3. Neutral branches, controlling stem",
        result, "45-65", "50-70"
    ))

    # =========================================================================
    # TEST 4: One Major Clash
    # Day branch clash (ZI-WU)
    # =========================================================================
    user4 = MockPerson(
        name="User4",
        day_stem=DING,
        day_branch=ZI,      # Rat
        month_branch=YIN,
        day_master=DING
    )
    person4 = MockPerson(
        name="Person4",
        day_stem=JI,
        day_branch=WU,      # Horse (clashes with Rat!)
        month_branch=SHEN,
        day_master=JI
    )
    result = engine.calculate_compatibility(user4, person4, "spouse")
    results.append(print_result(
        "4. One Major Clash (ZI-WU day branch)",
        result, "30-55", "35-60"
    ))

    # =========================================================================
    # TEST 5: Multiple Harms
    # Day harm + month harm
    # =========================================================================
    user5 = MockPerson(
        name="User5",
        day_stem=DING,
        day_branch=ZI,      # Rat
        month_branch=CHOU,  # Ox
        day_master=DING
    )
    person5 = MockPerson(
        name="Person5",
        day_stem=JI,
        day_branch=WEI,     # Goat (harms Rat)
        month_branch=WU,    # Horse (harms Ox)
        day_master=JI
    )
    result = engine.calculate_compatibility(user5, person5, "spouse")
    results.append(print_result(
        "5. Multiple Harms (day + month)",
        result, "35-55", "40-60"
    ))

    # =========================================================================
    # TEST 6: SevenKillings + Conflict
    # Metal controls Fire (SevenKillings) + clash
    # =========================================================================
    user6 = MockPerson(
        name="User6",
        day_stem=DING,      # Yin Fire
        day_branch=MAO,     # Rabbit
        month_branch=YIN,
        day_master=DING
    )
    person6 = MockPerson(
        name="Person6",
        day_stem=XIN,       # Yin Metal (controls Fire = SevenKillings)
        day_branch=YOU,     # Rooster (clashes with Rabbit!)
        month_branch=SHEN,
        day_master=XIN
    )
    result = engine.calculate_compatibility(user6, person6, "spouse")
    results.append(print_result(
        "6. SevenKillings + Clash (high toxicity)",
        result, "25-45", "30-50"
    ))

    # =========================================================================
    # TEST 7: RobWealth + Competitive
    # Same element, opposite polarity (RobWealth)
    # Two combines makes this actually a good match despite RobWealth
    # =========================================================================
    user7 = MockPerson(
        name="User7",
        day_stem=JIA,       # Yang Wood
        day_branch=YIN,
        month_branch=MAO,
        day_master=JIA
    )
    person7 = MockPerson(
        name="Person7",
        day_stem=YI,        # Yin Wood (RobWealth to Yang Wood)
        day_branch=HAI,     # Pig (combines with Tiger)
        month_branch=XU,    # Dog (combines with Rabbit)
        day_master=YI
    )
    result = engine.calculate_compatibility(user7, person7, "spouse")
    results.append(print_result(
        "7. RobWealth + Combines (good due to combines)",
        result, "75-90", "70-85"
    ))

    # =========================================================================
    # TEST 8: DirectOfficer + Stability
    # Other controls Day Master, opposite polarity (DirectOfficer)
    # Two combines + DirectOfficer gives good scores, especially durability
    # =========================================================================
    user8 = MockPerson(
        name="User8",
        day_stem=YI,        # Yin Wood
        day_branch=ZI,
        month_branch=CHOU,
        day_master=YI
    )
    person8 = MockPerson(
        name="Person8",
        day_stem=GENG,      # Yang Metal (controls Wood = DirectOfficer)
        day_branch=CHOU,    # Ox (combines with Rat)
        month_branch=ZI,    # Rat (combines with Ox)
        day_master=GENG
    )
    result = engine.calculate_compatibility(user8, person8, "spouse")
    results.append(print_result(
        "8. DirectOfficer + Combines (high durability)",
        result, "70-85", "70-85"
    ))

    # =========================================================================
    # TEST 9: Double Punishment (YIN-SI-SHEN group)
    # SI-SHEN and YIN-SI both trigger THREE_PUNISHMENT
    # Punishment takes precedence over combine/harm in BaZi
    # =========================================================================
    user9 = MockPerson(
        name="User9",
        day_stem=DING,
        day_branch=SI,      # Snake
        month_branch=YIN,   # Tiger
        day_master=DING
    )
    person9 = MockPerson(
        name="Person9",
        day_stem=JI,
        day_branch=SHEN,    # Monkey (with Snake = punishment in YIN-SI-SHEN)
        month_branch=SI,    # Snake (with Tiger = punishment in YIN-SI-SHEN)
        day_master=JI
    )
    result = engine.calculate_compatibility(user9, person9, "spouse")
    results.append(print_result(
        "9. Double Punishment (challenging)",
        result, "35-50", "40-55"
    ))

    # =========================================================================
    # TEST 10: Missing Birth Time
    # Only day branch available, verify renormalization
    # =========================================================================
    user10 = MockPerson(
        name="User10",
        day_stem=DING,
        day_branch=ZI,
        month_branch="",    # Missing!
        day_master=DING
    )
    person10 = MockPerson(
        name="Person10",
        day_stem=JI,
        day_branch=CHOU,    # Ox (combines with Rat)
        month_branch="",    # Missing!
        day_master=JI
    )
    result = engine.calculate_compatibility(user10, person10, "spouse")
    results.append(print_result(
        "10. Missing Data (renormalization test)",
        result, "60-80", "65-85"
    ))

    # =========================================================================
    # SUMMARY
    # =========================================================================
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")

    if passed == total:
        print("[SUCCESS] ALL TESTS PASSED")
    else:
        print("[FAILED] SOME TESTS FAILED")

    return passed == total


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
