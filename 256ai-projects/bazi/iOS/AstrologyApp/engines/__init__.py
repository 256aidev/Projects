"""
BaZi Engines Package

Contains calculation engines for various BaZi features.
"""

from .relationship_engine import (
    RelationshipEngine,
    get_relationship_engine,
    branch_relation,
    stem_relation,
    compute_ten_god,
    CompatibilityResult,
    BRANCH_MAP,
    STEM_INFO,
    CLASHES,
    COMBINATIONS,
    HARMS,
    PUNISHMENTS,
    TRINES
)

__all__ = [
    "RelationshipEngine",
    "get_relationship_engine",
    "branch_relation",
    "stem_relation",
    "compute_ten_god",
    "CompatibilityResult",
    "BRANCH_MAP",
    "STEM_INFO",
    "CLASHES",
    "COMBINATIONS",
    "HARMS",
    "PUNISHMENTS",
    "TRINES"
]
