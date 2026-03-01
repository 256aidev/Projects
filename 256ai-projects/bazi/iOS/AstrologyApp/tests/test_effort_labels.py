"""
Unit tests for effort-based relationship labels.

Tests:
1. Threshold boundary tests for get_effort_label
2. Forbidden terms verification
3. Quadrant interpretation consistency
4. API payload tone audit
"""

import pytest
import json
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engines.relationship_engine import (
    get_effort_label,
    get_effort_framing,
    get_quadrant_interpretation,
    EFFORT_LABELS,
    EFFORT_FRAMING,
    QUADRANT_LABELS,
    STANDARD_DISCLAIMER,
    FORBIDDEN_TERMS,
    HIGH_THRESHOLD,
    MID_THRESHOLD,
    LOW_THRESHOLD,
)


class TestEffortLabelThresholds:
    """Test that effort labels are assigned at correct thresholds."""

    def test_low_friction_dynamic_at_100(self):
        assert get_effort_label(100) == "Low-Friction Dynamic"

    def test_low_friction_dynamic_at_80(self):
        assert get_effort_label(80) == "Low-Friction Dynamic"

    def test_stable_with_awareness_at_79(self):
        assert get_effort_label(79) == "Stable with Awareness"

    def test_stable_with_awareness_at_high_threshold(self):
        assert get_effort_label(HIGH_THRESHOLD) == "Stable with Awareness"

    def test_workable_with_intention_at_64(self):
        assert get_effort_label(64) == "Workable with Intention"

    def test_workable_with_intention_at_mid_threshold(self):
        assert get_effort_label(MID_THRESHOLD) == "Workable with Intention"

    def test_growth_focused_at_49(self):
        assert get_effort_label(49) == "Growth-Focused"

    def test_growth_focused_at_low_threshold(self):
        assert get_effort_label(LOW_THRESHOLD) == "Growth-Focused"

    def test_high_effort_relationship_at_34(self):
        assert get_effort_label(34) == "High-Effort Relationship"

    def test_high_effort_relationship_at_0(self):
        assert get_effort_label(0) == "High-Effort Relationship"

    def test_edge_case_negative(self):
        """Negative scores should map to High-Effort Relationship."""
        assert get_effort_label(-10) == "High-Effort Relationship"

    def test_edge_case_over_100(self):
        """Scores over 100 should map to Low-Friction Dynamic."""
        assert get_effort_label(150) == "Low-Friction Dynamic"


class TestForbiddenTerms:
    """Test that forbidden terms never appear in user-facing text."""

    def test_no_forbidden_terms_in_effort_labels(self):
        """No forbidden terms in EFFORT_LABELS."""
        for threshold, label in EFFORT_LABELS:
            label_lower = label.lower()
            for term in FORBIDDEN_TERMS:
                assert term not in label_lower, f"Forbidden term '{term}' found in label '{label}'"

    def test_no_forbidden_terms_in_effort_framing(self):
        """No forbidden terms in EFFORT_FRAMING sentences."""
        for label, framing in EFFORT_FRAMING.items():
            combined = (label + " " + framing).lower()
            for term in FORBIDDEN_TERMS:
                assert term not in combined, f"Forbidden term '{term}' found in framing for '{label}'"

    def test_no_forbidden_terms_in_quadrant_labels(self):
        """No forbidden terms in QUADRANT_LABELS."""
        for key, label in QUADRANT_LABELS.items():
            label_lower = label.lower()
            for term in FORBIDDEN_TERMS:
                assert term not in label_lower, f"Forbidden term '{term}' found in quadrant label '{label}'"

    def test_no_forbidden_terms_in_disclaimer(self):
        """No forbidden terms in STANDARD_DISCLAIMER."""
        disclaimer_lower = STANDARD_DISCLAIMER.lower()
        for term in FORBIDDEN_TERMS:
            assert term not in disclaimer_lower, f"Forbidden term '{term}' found in disclaimer"

    def test_all_effort_label_scores_have_framing(self):
        """Every effort label should have a corresponding framing sentence."""
        for threshold, label in EFFORT_LABELS:
            framing = get_effort_framing(label)
            assert framing, f"No framing found for label '{label}'"
            assert len(framing) > 20, f"Framing for '{label}' is too short: '{framing}'"


class TestQuadrantInterpretation:
    """Test quadrant interpretation logic."""

    def test_high_ease_high_dur(self):
        """High ease + high durability should give positive interpretation."""
        result = get_quadrant_interpretation(80, 80)
        assert "easy" in result.lower() or "alignment" in result.lower()

    def test_low_ease_high_dur(self):
        """Low ease + high durability = 'hard but stable'."""
        result = get_quadrant_interpretation(40, 80)
        assert "stable" in result.lower() or "challenging" in result.lower()

    def test_high_ease_low_dur(self):
        """High ease + low durability = 'easy but fragile'."""
        result = get_quadrant_interpretation(80, 40)
        assert "easy" in result.lower() or "attention" in result.lower()

    def test_low_ease_low_dur(self):
        """Low ease + low durability = growth opportunity."""
        result = get_quadrant_interpretation(40, 40)
        assert "effort" in result.lower() or "growth" in result.lower()

    def test_uses_high_threshold_boundary(self):
        """Quadrant boundaries should use HIGH_THRESHOLD (65)."""
        # At threshold boundary
        assert get_quadrant_interpretation(HIGH_THRESHOLD, HIGH_THRESHOLD) == \
               get_quadrant_interpretation(80, 80)  # Same quadrant

        # Just below threshold
        assert get_quadrant_interpretation(HIGH_THRESHOLD - 1, HIGH_THRESHOLD - 1) == \
               get_quadrant_interpretation(40, 40)  # Same quadrant (low/low)


class TestThresholdConstants:
    """Test that threshold constants are defined correctly."""

    def test_high_threshold_value(self):
        assert HIGH_THRESHOLD == 65

    def test_mid_threshold_value(self):
        assert MID_THRESHOLD == 50

    def test_low_threshold_value(self):
        assert LOW_THRESHOLD == 35

    def test_thresholds_in_order(self):
        assert LOW_THRESHOLD < MID_THRESHOLD < HIGH_THRESHOLD


class TestAPIPayloadToneAudit:
    """Test that API-like payloads don't contain forbidden terms."""

    def test_simulated_compatibility_response(self):
        """Simulate a CompatibilityResponse and check for forbidden terms."""
        # Simulate what the API would return for various score combinations
        test_scores = [0, 20, 35, 50, 65, 80, 100]

        for ease in test_scores:
            for dur in test_scores:
                effort_label = get_effort_label(ease)
                effort_framing = get_effort_framing(effort_label)
                quadrant = get_quadrant_interpretation(ease, dur)

                # Build simulated payload
                payload = {
                    "ease_score": ease,
                    "durability_score": dur,
                    "effort_label": effort_label,
                    "effort_framing": effort_framing,
                    "quadrant_interpretation": quadrant,
                    "disclaimer": STANDARD_DISCLAIMER,
                }

                # Serialize and check
                payload_str = json.dumps(payload).lower()
                for term in FORBIDDEN_TERMS:
                    assert term not in payload_str, \
                        f"Forbidden term '{term}' found in payload for scores ({ease}, {dur})"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
