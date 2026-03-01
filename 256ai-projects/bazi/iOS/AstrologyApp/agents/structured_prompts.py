"""
Structured JSON Prompts for Weekly/Monthly/Yearly Readings

These prompts instruct the LLM to return JSON that matches the frontend's expected structure.
"""

# Weekly Structured Prompt - Returns JSON matching WeeklyForecast interface
WEEKLY_STRUCTURED_PROMPT_EN = """You are a Bazi (Four Pillars of Destiny) advisor. Generate a weekly reading in STRICT JSON format.

## User Profile
- Name: {name}
- Day Master: {day_master} ({day_master_element}, {day_master_polarity})
- Element Balance: {element_summary}

## This Week's Energy Overview ({week_start} to {week_end})
{week_summary}

## Daily Pillars This Week
{daily_pillars}

RESPOND WITH VALID JSON ONLY. No markdown, no explanation, just the JSON object.

{{
  "overview": "2-3 sentence overview of the week's energy theme for this person",
  "weeklyTheme": "3-5 word theme like 'Balance & Progress' or 'Strategic Patience'",
  "dailyHighlights": [
    {{
      "date": "YYYY-MM-DD",
      "dayName": "Monday",
      "pillar": "甲子",
      "element": "Wood",
      "theme": "Focus",
      "rating": 4,
      "tip": "Practical tip for this day"
    }}
  ],
  "luckyDays": ["Tuesday", "Friday"],
  "challengingDays": ["Wednesday"],
  "advice": "2-3 sentence practical advice for navigating the week"
}}

IMPORTANT:
- Include ALL 7 days in dailyHighlights with their actual pillars
- Rating is 1-5 based on how supportive the day is for {day_master_element} Day Master
- Use accessible language, no jargon
- Return ONLY valid JSON, nothing else"""

WEEKLY_STRUCTURED_PROMPT_ZH = """你是八字命理顾问。请用严格的JSON格式生成周运分析。

## 用户资料
- 姓名：{name}
- 日主：{day_master}（{day_master_element}，{day_master_polarity}）
- 五行分布：{element_summary}

## 本周能量概述（{week_start} 至 {week_end}）
{week_summary}

## 本周日柱
{daily_pillars}

只返回有效的JSON，不要其他文字。使用以下格式：

{{
  "overview": "2-3句关于本周能量主题的概述",
  "weeklyTheme": "3-5字主题",
  "dailyHighlights": [
    {{
      "date": "YYYY-MM-DD",
      "dayName": "周一",
      "pillar": "甲子",
      "element": "木",
      "theme": "专注",
      "rating": 4,
      "tip": "今日建议"
    }}
  ],
  "luckyDays": ["周二", "周五"],
  "challengingDays": ["周三"],
  "advice": "2-3句实用建议"
}}"""

# Monthly Structured Prompt
MONTHLY_STRUCTURED_PROMPT_EN = """You are a Bazi (Four Pillars of Destiny) advisor. Generate a monthly reading in STRICT JSON format.

## User Profile
- Name: {name}
- Day Master: {day_master} ({day_master_element}, {day_master_polarity})
- Element Balance: {element_summary}

## This Month's Energy Overview ({month_name} {year})
{month_summary}

RESPOND WITH VALID JSON ONLY. No markdown, no explanation.

{{
  "overview": "3-4 sentence overview of the month's energy",
  "weeklyHighlights": [
    {{
      "weekNumber": 1,
      "dateRange": "1st - 7th",
      "theme": "New Beginnings",
      "description": "2-3 sentence description"
    }},
    {{
      "weekNumber": 2,
      "dateRange": "8th - 14th",
      "theme": "Collaboration",
      "description": "Description for week 2"
    }},
    {{
      "weekNumber": 3,
      "dateRange": "15th - 21st",
      "theme": "Reflection",
      "description": "Description for week 3"
    }},
    {{
      "weekNumber": 4,
      "dateRange": "22nd - End",
      "theme": "Manifestation",
      "description": "Description for week 4"
    }}
  ],
  "keyDates": [
    {{
      "date": "{month_name} 5",
      "significance": "Peak Energy Day",
      "recommendation": "Ideal for important decisions"
    }},
    {{
      "date": "{month_name} 12",
      "significance": "Creative Surge",
      "recommendation": "Best for innovative pursuits"
    }},
    {{
      "date": "{month_name} 20",
      "significance": "Relationship Focus",
      "recommendation": "Nurture connections"
    }}
  ],
  "advice": "3-4 sentence practical advice",
  "luckyElements": ["Wood", "Fire"],
  "challengingElements": ["Metal"]
}}

IMPORTANT:
- Include exactly 4 weeklyHighlights
- Include 3 meaningful keyDates
- luckyElements support {day_master_element} Day Master
- Return ONLY valid JSON"""

MONTHLY_STRUCTURED_PROMPT_ZH = """你是八字命理顾问。请用严格的JSON格式生成月运分析。

## 用户资料
- 姓名：{name}
- 日主：{day_master}（{day_master_element}，{day_master_polarity}）
- 五行分布：{element_summary}

## 本月能量概述（{year}年{month_name}）
{month_summary}

只返回有效的JSON。

{{
  "overview": "3-4句本月概述",
  "weeklyHighlights": [
    {{"weekNumber": 1, "dateRange": "1日-7日", "theme": "新开始", "description": "描述"}},
    {{"weekNumber": 2, "dateRange": "8日-14日", "theme": "合作", "description": "描述"}},
    {{"weekNumber": 3, "dateRange": "15日-21日", "theme": "反思", "description": "描述"}},
    {{"weekNumber": 4, "dateRange": "22日-月底", "theme": "收获", "description": "描述"}}
  ],
  "keyDates": [
    {{"date": "5日", "significance": "能量高峰", "recommendation": "适合重要决定"}},
    {{"date": "12日", "significance": "创意涌现", "recommendation": "适合创新"}},
    {{"date": "20日", "significance": "感情重点", "recommendation": "关注关系"}}
  ],
  "advice": "3-4句建议",
  "luckyElements": ["木", "火"],
  "challengingElements": ["金"]
}}"""

# Yearly Structured Prompt
YEARLY_STRUCTURED_PROMPT_EN = """You are a Bazi (Four Pillars of Destiny) advisor. Generate a yearly reading in STRICT JSON format.

## User Profile
- Name: {name}
- Day Master: {day_master} ({day_master_element}, {day_master_polarity})
- Element Balance: {element_summary}

## Year {year} Energy Overview
{year_summary}

RESPOND WITH VALID JSON ONLY.

{{
  "overview": "4-5 sentence overview of the year's energy",
  "monthlyOutlook": [
    {{"month": "January", "monthNumber": 1, "theme": "Fresh Starts", "rating": 4, "keyFocus": "Set intentions"}},
    {{"month": "February", "monthNumber": 2, "theme": "Building", "rating": 3, "keyFocus": "Execute plans"}},
    {{"month": "March", "monthNumber": 3, "theme": "Growth", "rating": 4, "keyFocus": "Learn and grow"}},
    {{"month": "April", "monthNumber": 4, "theme": "Connection", "rating": 4, "keyFocus": "Nurture relationships"}},
    {{"month": "May", "monthNumber": 5, "theme": "Expression", "rating": 3, "keyFocus": "Be authentic"}},
    {{"month": "June", "monthNumber": 6, "theme": "Achievement", "rating": 5, "keyFocus": "Celebrate wins"}},
    {{"month": "July", "monthNumber": 7, "theme": "Reflection", "rating": 3, "keyFocus": "Review progress"}},
    {{"month": "August", "monthNumber": 8, "theme": "Transform", "rating": 4, "keyFocus": "Embrace change"}},
    {{"month": "September", "monthNumber": 9, "theme": "Expansion", "rating": 4, "keyFocus": "Explore new horizons"}},
    {{"month": "October", "monthNumber": 10, "theme": "Harvest", "rating": 5, "keyFocus": "Reap rewards"}},
    {{"month": "November", "monthNumber": 11, "theme": "Gratitude", "rating": 4, "keyFocus": "Appreciate journey"}},
    {{"month": "December", "monthNumber": 12, "theme": "Completion", "rating": 4, "keyFocus": "Close chapters"}}
  ],
  "yearlyThemes": [
    "Personal Growth",
    "Career Advancement",
    "Meaningful Relationships",
    "Financial Stability"
  ],
  "opportunities": [
    "Leadership opportunities in Q2",
    "Creative projects receive support",
    "Travel and expansion later",
    "Learning strongly supported"
  ],
  "challenges": [
    "Managing priorities in Q1",
    "Avoiding overcommitment",
    "Work-life balance",
    "Relationship dynamics"
  ],
  "advice": "4-5 sentence advice for the year"
}}

IMPORTANT:
- Include all 12 months
- Rating 1-5 based on support for {day_master_element}
- Return ONLY valid JSON"""

YEARLY_STRUCTURED_PROMPT_ZH = """你是八字命理顾问。请用严格的JSON格式生成年运分析。

## 用户资料
- 姓名：{name}
- 日主：{day_master}（{day_master_element}，{day_master_polarity}）

## {year}年能量概述
{year_summary}

只返回有效的JSON，包含12个月outlook和年度主题、机遇、挑战、建议。格式参考英文版本结构。"""


def parse_json_response(response_text: str) -> dict:
    """Parse JSON from LLM response, handling common issues."""
    import json
    import re

    # Remove markdown code blocks if present
    text = response_text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    # Try to parse as-is first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try to find JSON object in the response
    json_match = re.search(r'\{[\s\S]*\}', text)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass

    # Return empty dict if parsing fails
    return {}
