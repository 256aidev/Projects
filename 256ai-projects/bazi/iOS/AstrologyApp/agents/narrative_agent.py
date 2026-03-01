"""
Narrative Agent

Generates personalized Bazi readings using:
1. Ollama (local LLM) for weekly readings - FREE
2. Templates for daily readings - FREE
3. OpenAI as optional fallback

This hybrid approach reduces costs from ~$0.07/reading to $0.00/reading.
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

from openai import OpenAI
from dotenv import load_dotenv

try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False
    ollama = None

load_dotenv()

logger = logging.getLogger(__name__)

# Prompt templates directory
PROMPTS_DIR = Path(__file__).parent.parent / "prompts"

# Tone translations
TONES_EN = {
    "balanced": "balanced and thoughtful",
    "gentle": "gentle and nurturing",
    "direct": "direct and pragmatic",
    "motivational": "motivational and encouraging",
}

TONES_ZH = {
    "balanced": "平衡理性",
    "gentle": "温柔关怀",
    "direct": "直接务实",
    "motivational": "激励鼓舞",
}

# Element translations
ELEMENTS_ZH = {
    "Wood": "木",
    "Fire": "火",
    "Earth": "土",
    "Metal": "金",
    "Water": "水",
}

# Polarity translations
POLARITY_ZH = {
    "Yang": "阳",
    "Yin": "阴",
}

# Relationship translations
RELATIONSHIP_ZH = {
    "supporting": "生助",
    "draining": "泄耗",
    "controlling": "克制（财运）",
    "controlled": "受克（压力）",
    "neutral": "平和",
}


@dataclass
class NarrativeResult:
    """Result of narrative generation."""
    content_en: Optional[str] = None
    content_zh: Optional[str] = None
    success: bool = True
    error: Optional[str] = None
    provider: str = "unknown"  # "ollama", "openai", or "template"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "content_en": self.content_en,
            "content_zh": self.content_zh,
            "success": self.success,
            "error": self.error,
            "provider": self.provider,
        }


# Weekly reading prompt template
WEEKLY_PROMPT_EN = """You are a Bazi (Four Pillars of Destiny) advisor providing a comprehensive weekly reading.

## User Profile
- Name: {name}
- Day Master: {day_master} ({day_master_element}, {day_master_polarity})
- Element Balance: {element_summary}

## This Week's Energy Overview ({week_start} to {week_end})
{week_summary}

## Instructions
Write a comprehensive weekly reading for {name}. Include:

1. **Overall Theme** - The main energy theme for this week (2-3 sentences)
2. **Day Master Impact** - How this week's energies affect someone with {day_master_element} Day Master (2-3 sentences)
3. **Key Days to Watch** - Highlight any particularly favorable or challenging days
4. **Practical Guidance** - Actionable advice for navigating the week
5. **Best Focus Areas** - What to prioritize this week

Keep it warm, insightful, and practical. About 4-5 paragraphs total.
Avoid technical Bazi jargon - use accessible language."""

WEEKLY_PROMPT_ZH = """你是一位八字命理顾问，提供全面的每周运势分析。

## 用户资料
- 姓名：{name}
- 日主：{day_master}（{day_master_element}，{day_master_polarity}）
- 五行分布：{element_summary}

## 本周能量概述（{week_start} 至 {week_end}）
{week_summary}

## 要求
请为{name}撰写全面的每周运势。包括：

1. **整体主题** - 本周的主要能量主题（2-3句）
2. **日主影响** - 本周能量对{day_master_element}日主的影响（2-3句）
3. **关键日期** - 特别有利或需要注意的日子
4. **实用建议** - 如何应对本周能量的具体建议
5. **重点关注** - 本周应优先考虑的事项

保持温暖、有洞察力且实用。约4-5个段落。
使用通俗易懂的语言，避免专业术语。"""


class NarrativeAgent:
    """
    Generates personalized readings using:
    - Ollama (local) for weekly readings - FREE
    - OpenAI as fallback if Ollama unavailable
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        ollama_model: Optional[str] = None,
        prefer_ollama: bool = True
    ):
        # Default to llama3, can override via OLLAMA_MODEL env var
        self.ollama_model = ollama_model or os.getenv("OLLAMA_MODEL", "llama3")
        self.prefer_ollama = prefer_ollama
        self.ollama_available = OLLAMA_AVAILABLE

        # Check if Ollama is running
        if self.ollama_available:
            try:
                ollama.list()
                logger.info(f"Ollama available, using model: {ollama_model}")
            except Exception as e:
                logger.warning(f"Ollama not responding: {e}")
                self.ollama_available = False

        # Setup OpenAI as fallback
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if self.api_key:
            key_preview = f"{self.api_key[:10]}...{self.api_key[-4:]}" if len(self.api_key) > 14 else "***"
            logger.info(f"OpenAI API key loaded: {key_preview}")
            self.openai_client = OpenAI(api_key=self.api_key)
        else:
            logger.info("No OpenAI API key - using Ollama only")
            self.openai_client = None

        # Load prompt templates
        self.prompt_en = self._load_prompt("daily_reading_en.txt")
        self.prompt_zh = self._load_prompt("daily_reading_zh.txt")

    def _load_prompt(self, filename: str) -> str:
        """Load a prompt template from file."""
        filepath = PROMPTS_DIR / filename
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return f.read()
        except FileNotFoundError:
            logger.error(f"Prompt template not found: {filepath}")
            return ""

    def generate_weekly(
        self,
        user_data: Dict[str, Any],
        week_data: Dict[str, Any],
        language: str = "both",
    ) -> NarrativeResult:
        """
        Generate a WEEKLY reading using Ollama (FREE) or OpenAI fallback.

        Args:
            user_data: User profile data
            week_data: Week's energy summary (pillars for all 7 days)
            language: "en", "zh", or "both"

        Returns:
            NarrativeResult with weekly reading
        """
        result = NarrativeResult()

        try:
            # Try Ollama first (FREE)
            if self.ollama_available and self.prefer_ollama:
                logger.info("Generating weekly reading with Ollama (FREE)")
                result = self._generate_weekly_ollama(user_data, week_data, language)
                result.provider = "ollama"
            # Fallback to OpenAI
            elif self.openai_client:
                logger.info("Generating weekly reading with OpenAI (fallback)")
                result = self._generate_weekly_openai(user_data, week_data, language)
                result.provider = "openai"
            else:
                result.success = False
                result.error = "No LLM provider available (Ollama not running, no OpenAI key)"

        except Exception as e:
            logger.exception(f"Weekly generation failed: {e}")
            result.success = False
            result.error = str(e)

        return result

    def _generate_weekly_ollama(
        self,
        user_data: Dict[str, Any],
        week_data: Dict[str, Any],
        language: str
    ) -> NarrativeResult:
        """Generate weekly reading using local Ollama."""
        result = NarrativeResult()

        variables = self._prepare_weekly_variables(user_data, week_data)

        if language in ("en", "both"):
            prompt = WEEKLY_PROMPT_EN.format(**variables)
            response = ollama.chat(
                model=self.ollama_model,
                messages=[{"role": "user", "content": prompt}]
            )
            result.content_en = response["message"]["content"]

        if language in ("zh", "both"):
            prompt = WEEKLY_PROMPT_ZH.format(**variables)
            response = ollama.chat(
                model=self.ollama_model,
                messages=[{"role": "user", "content": prompt}]
            )
            result.content_zh = response["message"]["content"]

        result.success = True
        return result

    def _generate_weekly_openai(
        self,
        user_data: Dict[str, Any],
        week_data: Dict[str, Any],
        language: str
    ) -> NarrativeResult:
        """Generate weekly reading using OpenAI (fallback)."""
        result = NarrativeResult()

        variables = self._prepare_weekly_variables(user_data, week_data)

        if language in ("en", "both"):
            prompt = WEEKLY_PROMPT_EN.format(**variables)
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",  # Use cheaper model for weekly
                messages=[
                    {"role": "system", "content": "You are a Bazi advisor."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.7,
            )
            result.content_en = response.choices[0].message.content

        if language in ("zh", "both"):
            prompt = WEEKLY_PROMPT_ZH.format(**variables)
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "你是一位八字命理顾问。"},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.7,
            )
            result.content_zh = response.choices[0].message.content

        result.success = True
        return result

    def _prepare_weekly_variables(
        self,
        user_data: Dict[str, Any],
        week_data: Dict[str, Any]
    ) -> Dict[str, str]:
        """Prepare variables for weekly prompt."""
        element_counts = user_data.get("element_counts", {})
        if isinstance(element_counts, str):
            element_counts = json.loads(element_counts)

        element_parts = [f"{elem}: {count}" for elem, count in element_counts.items() if count > 0]
        element_summary = ", ".join(element_parts)

        return {
            "name": user_data.get("name", "Friend"),
            "day_master": user_data.get("day_master", ""),
            "day_master_element": user_data.get("day_master_element", ""),
            "day_master_polarity": user_data.get("day_master_polarity", ""),
            "element_summary": element_summary,
            "week_start": week_data.get("week_start", ""),
            "week_end": week_data.get("week_end", ""),
            "week_summary": week_data.get("summary", ""),
        }

    def generate(
        self,
        user_data: Dict[str, Any],
        daily_data: Dict[str, Any],
        language: str = "en",
        tone: str = "balanced"
    ) -> NarrativeResult:
        """
        Generate a daily reading narrative using OpenAI.
        NOTE: For cost savings, prefer using templates via template_engine.py

        Args:
            user_data: User profile data (name, pillars, day master, etc.)
            daily_data: Daily energy analysis data
            language: "en" for English, "zh" for Chinese, "both" for bilingual
            tone: Tone preference (balanced, gentle, direct, motivational)

        Returns:
            NarrativeResult with generated content
        """
        if not self.openai_client:
            return NarrativeResult(
                success=False,
                error="OpenAI API key not configured"
            )

        result = NarrativeResult()
        result.provider = "openai"

        try:
            if language in ("en", "both"):
                content_en = self._generate_single(
                    user_data, daily_data, "en", tone
                )
                result.content_en = content_en

            if language in ("zh", "both"):
                content_zh = self._generate_single(
                    user_data, daily_data, "zh", tone
                )
                result.content_zh = content_zh

            result.success = True

        except Exception as e:
            logger.error(f"Narrative generation failed: {e}")
            result.success = False
            result.error = str(e)

        return result

    def _generate_single(
        self,
        user_data: Dict[str, Any],
        daily_data: Dict[str, Any],
        language: str,
        tone: str
    ) -> str:
        """Generate narrative in a single language."""
        # Prepare template variables
        variables = self._prepare_variables(user_data, daily_data, language, tone)

        # Get appropriate template
        template = self.prompt_en if language == "en" else self.prompt_zh

        # Fill in the template
        try:
            prompt = template.format(**variables)
        except KeyError as e:
            logger.warning(f"Missing template variable: {e}")
            prompt = template

        # Call OpenAI API
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert Bazi (Chinese astrology) advisor who provides warm, insightful, and practical daily guidance."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=800,
            temperature=0.7,
        )

        return response.choices[0].message.content

    def _prepare_variables(
        self,
        user_data: Dict[str, Any],
        daily_data: Dict[str, Any],
        language: str,
        tone: str
    ) -> Dict[str, str]:
        """Prepare all variables for the prompt template."""
        # Element summary
        element_counts = user_data.get("element_counts", {})
        if isinstance(element_counts, str):
            element_counts = json.loads(element_counts)

        element_parts = []
        for elem, count in sorted(element_counts.items(), key=lambda x: x[1], reverse=True):
            if count > 0:
                if language == "zh":
                    element_parts.append(f"{ELEMENTS_ZH.get(elem, elem)}: {count}")
                else:
                    element_parts.append(f"{elem}: {count}")
        element_summary = ", ".join(element_parts)

        # Interactions summary
        clashes = daily_data.get("clashes", [])
        combinations = daily_data.get("combinations", [])
        punishments = daily_data.get("punishments", [])

        if language == "zh":
            interactions = []
            for c in clashes:
                interactions.append(c.get("description_zh", ""))
            for c in combinations:
                interactions.append(c.get("description_zh", ""))
            interactions_str = "；".join(interactions) if interactions else "无特殊互动"

            challenges = []
            for p in punishments:
                challenges.append(p.get("description_zh", ""))
            challenges_str = "；".join(challenges) if challenges else "无"
        else:
            interactions = []
            for c in clashes:
                interactions.append(c.get("description_en", ""))
            for c in combinations:
                interactions.append(c.get("description_en", ""))
            interactions_str = "; ".join(interactions) if interactions else "No major interactions"

            challenges = []
            for p in punishments:
                challenges.append(p.get("description_en", ""))
            challenges_str = "; ".join(challenges) if challenges else "None"

        # Favorable hours
        favorable_hours = daily_data.get("favorable_hours", [])
        favorable_str = ", ".join(favorable_hours) if favorable_hours else "No specific favorable hours"

        # Build variables dict
        dm_element = user_data.get("day_master_element", "Unknown")
        dm_polarity = user_data.get("day_master_polarity", "Unknown")
        daily_element = daily_data.get("daily_element", "Unknown")
        daily_polarity = daily_data.get("daily_polarity", "Unknown")
        element_rel = daily_data.get("element_relationship", "neutral")

        variables = {
            # User data
            "name": user_data.get("name", "Friend"),
            "day_master": user_data.get("day_master", ""),
            "day_master_element": dm_element if language == "en" else ELEMENTS_ZH.get(dm_element, dm_element),
            "day_master_polarity": dm_polarity if language == "en" else POLARITY_ZH.get(dm_polarity, dm_polarity),
            "element_summary": element_summary,
            "year_pillar": user_data.get("year_pillar", ""),
            "month_pillar": user_data.get("month_pillar", ""),
            "day_pillar": user_data.get("day_pillar", ""),
            "hour_pillar": user_data.get("hour_pillar", ""),

            # Daily data
            "date": daily_data.get("date", ""),
            "daily_pillar": daily_data.get("daily_pillar", ""),
            "daily_element": daily_element if language == "en" else ELEMENTS_ZH.get(daily_element, daily_element),
            "daily_polarity": daily_polarity if language == "en" else POLARITY_ZH.get(daily_polarity, daily_polarity),
            "day_master_ten_god": daily_data.get("day_master_ten_god", ""),
            "day_master_ten_god_en": daily_data.get("day_master_ten_god_en", ""),
            "element_relationship": element_rel,
            "element_relationship_zh": RELATIONSHIP_ZH.get(element_rel, element_rel),
            "interactions": interactions_str,
            "interactions_zh": interactions_str,
            "favorable_hours": favorable_str,
            "challenges": challenges_str,
            "challenges_zh": challenges_str,
            "summary": daily_data.get("summary", ""),
            "summary_zh": daily_data.get("summary", ""),

            # Tone
            "tone": TONES_EN.get(tone, tone),
            "tone_zh": TONES_ZH.get(tone, tone),
        }

        return variables


def generate_narrative(
    user_data: Dict[str, Any],
    daily_data: Dict[str, Any],
    language: str = "en",
    tone: str = "balanced",
    api_key: Optional[str] = None
) -> NarrativeResult:
    """
    Convenience function to generate a narrative.

    Example:
        >>> user_data = {"name": "Alice", "day_master": "辛", ...}
        >>> daily_data = {"daily_pillar": "丙寅", ...}
        >>> result = generate_narrative(user_data, daily_data, language="both")
        >>> print(result.content_en)
    """
    agent = NarrativeAgent(api_key=api_key)
    return agent.generate(user_data, daily_data, language, tone)
