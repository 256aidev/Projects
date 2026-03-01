"""
Additional methods for NarrativeAgent - Monthly and Yearly readings
Append this content to ~/AstrologyApp/agents/narrative_agent.py
"""

# Monthly reading prompt templates
MONTHLY_PROMPT_EN = """You are a Bazi (Four Pillars of Destiny) advisor providing a comprehensive monthly reading.

## User Profile
- Name: {name}
- Day Master: {day_master} ({day_master_element}, {day_master_polarity})
- Element Balance: {element_summary}

## This Month's Energy Overview ({month_name} {year})
{month_summary}

## Instructions
Write a comprehensive monthly reading for {name}. Include:

1. **Monthly Theme** - The dominant energy theme for this month (2-3 sentences)
2. **Day Master Impact** - How this month's energies affect someone with {day_master_element} Day Master (2-3 sentences)
3. **Key Weeks to Watch** - Highlight any particularly favorable or challenging periods
4. **Lucky Days** - Best days for important decisions, meetings, or new beginnings
5. **Challenging Days** - Days requiring extra caution or patience
6. **Career & Finance** - Monthly outlook for professional matters
7. **Relationships & Health** - Monthly outlook for personal matters
8. **Practical Guidance** - Actionable advice for navigating the month

Keep it warm, insightful, and practical. About 6-8 paragraphs total.
Avoid technical Bazi jargon - use accessible language."""

MONTHLY_PROMPT_ZH = """你是一位八字命理顾问，提供全面的每月运势分析。

## 用户资料
- 姓名：{name}
- 日主：{day_master}（{day_master_element}，{day_master_polarity}）
- 五行分布：{element_summary}

## 本月能量概述（{year}年{month_name}）
{month_summary}

## 要求
请为{name}撰写全面的每月运势。包括：

1. **月度主题** - 本月的主导能量主题（2-3句）
2. **日主影响** - 本月能量对{day_master_element}日主的影响（2-3句）
3. **关键周期** - 特别有利或需要注意的时段
4. **吉利日子** - 适合重要决策、会议或新开始的日子
5. **挑战日子** - 需要额外谨慎或耐心的日子
6. **事业财运** - 本月职业方面的展望
7. **感情健康** - 本月个人生活方面的展望
8. **实用建议** - 如何应对本月能量的具体建议

保持温暖、有洞察力且实用。约6-8个段落。
使用通俗易懂的语言，避免专业术语。"""


# Yearly reading prompt templates
YEARLY_PROMPT_EN = """You are a Bazi (Four Pillars of Destiny) advisor providing a comprehensive yearly reading.

## User Profile
- Name: {name}
- Day Master: {day_master} ({day_master_element}, {day_master_polarity})
- Element Balance: {element_summary}

## Year {year} Energy Overview
{year_summary}

## Instructions
Write a comprehensive yearly reading for {name} for the year {year}. Include:

1. **Year Theme** - The overarching energy theme for this year (3-4 sentences)
2. **Day Master's Year** - How this year's energies specifically affect someone with {day_master_element} Day Master (3-4 sentences)
3. **Quarterly Overview** - Brief outlook for each quarter (Q1-Q4)
4. **Best Months** - Which months are most favorable and why
5. **Challenging Periods** - Months requiring extra attention or caution
6. **Career & Finance Outlook** - Year-long professional trajectory
7. **Relationships & Personal Growth** - Year-long personal development themes
8. **Health & Wellness** - Areas to focus on for wellbeing
9. **Key Advice** - The most important guidance for thriving this year

Keep it warm, insightful, and practical. About 10-12 paragraphs total.
This is a significant reading - make it comprehensive and meaningful.
Avoid technical Bazi jargon - use accessible language."""

YEARLY_PROMPT_ZH = """你是一位八字命理顾问，提供全面的年度运势分析。

## 用户资料
- 姓名：{name}
- 日主：{day_master}（{day_master_element}，{day_master_polarity}）
- 五行分布：{element_summary}

## {year}年能量概述
{year_summary}

## 要求
请为{name}撰写{year}年的全面年度运势。包括：

1. **年度主题** - 今年的总体能量主题（3-4句）
2. **日主之年** - 今年能量对{day_master_element}日主的具体影响（3-4句）
3. **季度概览** - 每个季度的简要展望（第一至第四季度）
4. **最佳月份** - 哪些月份最有利及原因
5. **挑战时期** - 需要特别注意或谨慎的月份
6. **事业财运展望** - 全年职业发展轨迹
7. **感情与成长** - 全年个人发展主题
8. **健康养生** - 需要关注的健康领域
9. **核心建议** - 今年最重要的生活指导

保持温暖、有洞察力且实用。约10-12个段落。
这是一份重要的运势分析，请使其全面而有意义。
使用通俗易懂的语言，避免专业术语。"""


# Monthly generation methods
def _generate_monthly_wrapper(self, user_data, month_data, language="both"):
    """
    Generate a MONTHLY reading using Ollama (FREE) or OpenAI fallback.

    Args:
        user_data: User profile data
        month_data: Month energy summary
        language: "en", "zh", or "both"

    Returns:
        NarrativeResult with monthly reading
    """
    result = NarrativeResult()

    try:
        if self.ollama_available and self.prefer_ollama:
            logger.info("Generating monthly reading with Ollama (FREE)")
            result = self._generate_monthly_ollama(user_data, month_data, language)
            result.provider = "ollama"
        elif self.openai_client:
            logger.info("Generating monthly reading with OpenAI (fallback)")
            result = self._generate_monthly_openai(user_data, month_data, language)
            result.provider = "openai"
        else:
            result.success = False
            result.error = "No LLM provider available"

    except Exception as e:
        logger.exception(f"Monthly generation failed: {e}")
        result.success = False
        result.error = str(e)

    return result


def _generate_monthly_ollama_wrapper(self, user_data, month_data, language):
    """Generate monthly reading using local Ollama."""
    result = NarrativeResult()
    variables = self._prepare_monthly_variables(user_data, month_data)

    if language in ("en", "both"):
        prompt = MONTHLY_PROMPT_EN.format(**variables)
        response = ollama.chat(
            model=self.ollama_model,
            messages=[{"role": "user", "content": prompt}]
        )
        result.content_en = response["message"]["content"]

    if language in ("zh", "both"):
        prompt = MONTHLY_PROMPT_ZH.format(**variables)
        response = ollama.chat(
            model=self.ollama_model,
            messages=[{"role": "user", "content": prompt}]
        )
        result.content_zh = response["message"]["content"]

    result.success = True
    return result


def _generate_monthly_openai_wrapper(self, user_data, month_data, language):
    """Generate monthly reading using OpenAI (fallback)."""
    result = NarrativeResult()
    variables = self._prepare_monthly_variables(user_data, month_data)

    if language in ("en", "both"):
        prompt = MONTHLY_PROMPT_EN.format(**variables)
        response = self.openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a Bazi advisor."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.7,
        )
        result.content_en = response.choices[0].message.content

    if language in ("zh", "both"):
        prompt = MONTHLY_PROMPT_ZH.format(**variables)
        response = self.openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a Bazi advisor in Chinese."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.7,
        )
        result.content_zh = response.choices[0].message.content

    result.success = True
    return result


def _prepare_monthly_variables_wrapper(self, user_data, month_data):
    """Prepare variables for monthly prompt."""
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
        "month_name": month_data.get("month_name", ""),
        "year": month_data.get("year", ""),
        "month_summary": month_data.get("summary", ""),
    }


# Yearly generation methods
def _generate_yearly_wrapper(self, user_data, year_data, language="both"):
    """
    Generate a YEARLY reading using Ollama (FREE) or OpenAI fallback.
    """
    result = NarrativeResult()

    try:
        if self.ollama_available and self.prefer_ollama:
            logger.info("Generating yearly reading with Ollama (FREE)")
            result = self._generate_yearly_ollama(user_data, year_data, language)
            result.provider = "ollama"
        elif self.openai_client:
            logger.info("Generating yearly reading with OpenAI (fallback)")
            result = self._generate_yearly_openai(user_data, year_data, language)
            result.provider = "openai"
        else:
            result.success = False
            result.error = "No LLM provider available"

    except Exception as e:
        logger.exception(f"Yearly generation failed: {e}")
        result.success = False
        result.error = str(e)

    return result


def _generate_yearly_ollama_wrapper(self, user_data, year_data, language):
    """Generate yearly reading using local Ollama."""
    result = NarrativeResult()
    variables = self._prepare_yearly_variables(user_data, year_data)

    if language in ("en", "both"):
        prompt = YEARLY_PROMPT_EN.format(**variables)
        response = ollama.chat(
            model=self.ollama_model,
            messages=[{"role": "user", "content": prompt}]
        )
        result.content_en = response["message"]["content"]

    if language in ("zh", "both"):
        prompt = YEARLY_PROMPT_ZH.format(**variables)
        response = ollama.chat(
            model=self.ollama_model,
            messages=[{"role": "user", "content": prompt}]
        )
        result.content_zh = response["message"]["content"]

    result.success = True
    return result


def _generate_yearly_openai_wrapper(self, user_data, year_data, language):
    """Generate yearly reading using OpenAI (fallback)."""
    result = NarrativeResult()
    variables = self._prepare_yearly_variables(user_data, year_data)

    if language in ("en", "both"):
        prompt = YEARLY_PROMPT_EN.format(**variables)
        response = self.openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a Bazi advisor."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.7,
        )
        result.content_en = response.choices[0].message.content

    if language in ("zh", "both"):
        prompt = YEARLY_PROMPT_ZH.format(**variables)
        response = self.openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a Bazi advisor in Chinese."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.7,
        )
        result.content_zh = response.choices[0].message.content

    result.success = True
    return result


def _prepare_yearly_variables_wrapper(self, user_data, year_data):
    """Prepare variables for yearly prompt."""
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
        "year": year_data.get("year", ""),
        "year_summary": year_data.get("summary", ""),
    }


# Monkey-patch the methods onto NarrativeAgent
NarrativeAgent.generate_monthly = _generate_monthly_wrapper
NarrativeAgent._generate_monthly_ollama = _generate_monthly_ollama_wrapper
NarrativeAgent._generate_monthly_openai = _generate_monthly_openai_wrapper
NarrativeAgent._prepare_monthly_variables = _prepare_monthly_variables_wrapper

NarrativeAgent.generate_yearly = _generate_yearly_wrapper
NarrativeAgent._generate_yearly_ollama = _generate_yearly_ollama_wrapper
NarrativeAgent._generate_yearly_openai = _generate_yearly_openai_wrapper
NarrativeAgent._prepare_yearly_variables = _prepare_yearly_variables_wrapper
