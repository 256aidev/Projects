"""
Template Engine

Generates daily readings using pre-written templates.
NO LLM COST - just string formatting with dynamic Bazi data.
"""

import logging
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass

from templates.daily_templates import (
    get_template_for_interaction,
    render_template,
)

logger = logging.getLogger(__name__)


@dataclass
class TemplateResult:
    """Result of template-based generation."""
    content_en: str
    content_zh: str
    template_id: str
    success: bool = True
    error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "content_en": self.content_en,
            "content_zh": self.content_zh,
            "template_id": self.template_id,
            "success": self.success,
            "error": self.error,
        }


class TemplateEngine:
    """
    Generates daily readings using templates instead of LLM.

    This approach:
    - Costs $0 per reading (no LLM API calls)
    - Is instant (no API latency)
    - Provides consistent quality
    - Covers all major interaction scenarios
    """

    def generate_daily_reading(
        self,
        user_data: Dict[str, Any],
        daily_data: Dict[str, Any],
    ) -> TemplateResult:
        """
        Generate a daily reading using templates.

        Args:
            user_data: User profile with day_master_element, etc.
            daily_data: Daily energy analysis with interactions

        Returns:
            TemplateResult with bilingual content
        """
        try:
            # Extract needed data
            day_master_element = user_data.get("day_master_element", "Earth")
            daily_element = daily_data.get("daily_element", "Earth")
            daily_branch = daily_data.get("daily_branch", "")
            element_relationship = daily_data.get("element_relationship", "neutral")

            clashes = daily_data.get("clashes", [])
            combinations = daily_data.get("combinations", [])
            favorable_hours = daily_data.get("favorable_hours", [])

            # Get the first clash/combination natal branch if any
            natal_branch = ""
            if clashes:
                natal_branch = clashes[0].get("natal_branch", "")
            elif combinations:
                natal_branch = combinations[0].get("natal_branch", "")

            # Select appropriate template
            template, template_id = get_template_for_interaction(
                day_master_element=day_master_element,
                daily_element=daily_element,
                element_relationship=element_relationship,
                clashes=clashes,
                combinations=combinations,
            )

            logger.debug(f"Selected template: {template_id}")

            # Render for both languages
            content_en = render_template(
                template=template,
                language="en",
                daily_element=daily_element,
                daily_branch=daily_branch,
                natal_branch=natal_branch,
                day_master_element=day_master_element,
                favorable_hours=favorable_hours,
            )

            content_zh = render_template(
                template=template,
                language="zh",
                daily_element=daily_element,
                daily_branch=daily_branch,
                natal_branch=natal_branch,
                day_master_element=day_master_element,
                favorable_hours=favorable_hours,
            )

            return TemplateResult(
                content_en=content_en,
                content_zh=content_zh,
                template_id=template_id,
                success=True,
            )

        except Exception as e:
            logger.exception(f"Template generation failed: {e}")
            return TemplateResult(
                content_en="Your daily reading is being prepared.",
                content_zh="您的每日运势正在准备中。",
                template_id="error_fallback",
                success=False,
                error=str(e),
            )


def generate_daily_from_template(
    user_data: Dict[str, Any],
    daily_data: Dict[str, Any],
) -> TemplateResult:
    """
    Convenience function to generate a daily reading from template.

    Example:
        >>> user_data = {"day_master_element": "Metal", ...}
        >>> daily_data = {"daily_element": "Fire", "element_relationship": "controlling", ...}
        >>> result = generate_daily_from_template(user_data, daily_data)
        >>> print(result.content_en)
    """
    engine = TemplateEngine()
    return engine.generate_daily_reading(user_data, daily_data)
