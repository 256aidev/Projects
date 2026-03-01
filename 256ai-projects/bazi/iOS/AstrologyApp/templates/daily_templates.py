"""
Daily Reading Templates

Pre-written bilingual templates for daily readings.
NO LLM COST - just string formatting with dynamic data.

These templates are designed to provide comprehensive, multi-paragraph readings
similar to AI-generated content, but at zero cost.

Template Selection Logic:
1. Check for clashes -> use clash template
2. Check for combinations -> use combination template
3. Check element relationship -> use element template
4. Fallback to neutral template
"""

from typing import Dict, List, Optional, Tuple
import random

# Activity suggestions by element
ACTIVITIES = {
    "Wood": {
        "en": ["creative projects", "planning", "starting new ventures", "learning", "brainstorming", "strategic thinking"],
        "zh": ["创意项目", "规划", "开始新事业", "学习", "头脑风暴", "战略思考"]
    },
    "Fire": {
        "en": ["networking", "presentations", "social events", "leadership tasks", "public speaking", "team building"],
        "zh": ["社交活动", "演讲", "聚会", "领导工作", "公开演讲", "团队建设"]
    },
    "Earth": {
        "en": ["organizing", "real estate matters", "building foundations", "nurturing relationships", "consolidating resources", "meditation"],
        "zh": ["整理", "房产事务", "打基础", "维护关系", "整合资源", "冥想"]
    },
    "Metal": {
        "en": ["financial decisions", "negotiations", "precision work", "decluttering", "completing projects", "analytical tasks"],
        "zh": ["财务决策", "谈判", "精细工作", "断舍离", "完成项目", "分析任务"]
    },
    "Water": {
        "en": ["reflection", "research", "intuitive decisions", "going with the flow", "healing activities", "creative writing"],
        "zh": ["反思", "研究", "直觉决策", "顺其自然", "疗愈活动", "创意写作"]
    }
}

# Activity descriptions for more variety
ACTIVITY_DESCRIPTIONS = {
    "Wood": {
        "en": "Your creativity and vision are amplified, making it ideal for planning and initiating new projects.",
        "zh": "您的创造力和远见得到增强，非常适合规划和启动新项目。"
    },
    "Fire": {
        "en": "Your charisma and communication skills are heightened, perfect for social interactions and leadership.",
        "zh": "您的魅力和沟通能力得到提升，非常适合社交互动和领导工作。"
    },
    "Earth": {
        "en": "Your grounding presence and reliability are enhanced, excellent for building trust and stability.",
        "zh": "您的稳定感和可靠性得到加强，非常适合建立信任和稳定性。"
    },
    "Metal": {
        "en": "Your clarity and decisiveness are sharpened, ideal for making important decisions and cutting through complexity.",
        "zh": "您的清晰度和果断性得到增强，非常适合做出重要决策和理清复杂问题。"
    },
    "Water": {
        "en": "Your intuition and adaptability are deepened, perfect for navigating uncertain situations with wisdom.",
        "zh": "您的直觉和适应力得到深化，非常适合以智慧应对不确定的情况。"
    }
}


# ============== ELEMENT NAMES ==============

ELEMENT_NAMES_ZH = {
    "Wood": "木",
    "Fire": "火",
    "Earth": "土",
    "Metal": "金",
    "Water": "水",
}


# ============== COMPREHENSIVE TEMPLATES ==============

# When daily element SUPPORTS (produces) Day Master
ELEMENT_SUPPORTING_TEMPLATES = {
    "Wood": [
        {
            "id": "support_wood_1",
            "en": """**Today's Theme**
Today carries nurturing {daily_element} energy that flows harmoniously with your Wood nature, creating an environment of growth and expansion. The cosmic energies are aligned to support your natural tendencies toward creativity and forward movement.

**Personal Impact**
As a Wood Day Master, you thrive when given room to grow and expand. Today's supportive energy amplifies your natural ability to envision possibilities and create new pathways. Your intuition is particularly strong, and ideas that seemed unclear before may suddenly crystallize into actionable plans.

**Practical Guidance**
This is an excellent day for {activities}. Your natural talents for innovation and strategic thinking are enhanced. Don't hesitate to share your ideas with others, as your vision can inspire and lead. Collaborative projects are especially favored, as others will be receptive to your direction.

**Timing Tips**
The most favorable hours for important activities are during {favorable_hours}. Use these windows for meetings, important decisions, or launching new initiatives. The afternoon may bring opportunities for creative breakthroughs.""",
            "zh": """**今日主题**
今日{daily_element_zh}能量流畅地滋养您的木性，创造一个成长和扩展的环境。宇宙能量与您天生的创造力和向前发展的倾向相协调。

**个人影响**
作为木日主，您在有成长空间时最能发挥。今日的支持性能量增强了您天生的远见和创造新路径的能力。您的直觉特别敏锐，之前不清晰的想法可能会突然形成可行的计划。

**实用建议**
今天非常适合{activities_zh}。您在创新和战略思维方面的天赋得到增强。不要犹豫与他人分享您的想法，因为您的愿景可以激励和引导他人。合作项目特别受眷顾，因为其他人会接受您的指导。

**时机提示**
重要活动的最有利时段是{favorable_hours}。利用这些时间窗口进行会议、重要决策或启动新计划。下午可能带来创意突破的机会。"""
        },
        {
            "id": "support_wood_2",
            "en": """**Today's Theme**
The {daily_element} energy today creates a fertile ground for your Wood essence to flourish. Like spring rain nourishing young trees, today's cosmic climate supports your growth in all directions.

**Personal Impact**
Your Wood Day Master nature connects you to themes of growth, creativity, and benevolent leadership. Today these qualities are magnified. You may find yourself naturally taking charge of situations, guiding others with compassion and clear vision. Your ability to see the big picture while managing details is enhanced.

**Practical Guidance**
Channel today's energy into {activities}. This is a powerful day for planting seeds—both literally and metaphorically. New projects initiated today have strong potential for long-term growth. Your communication skills are particularly effective, making this ideal for important conversations.

**Timing Tips**
Favorable hours include {favorable_hours}. Morning activities may flow especially well. Consider scheduling creative work or strategic planning during peak energy times. Evening hours support reflection and preparation for tomorrow.""",
            "zh": """**今日主题**
今日{daily_element_zh}能量为您的木性本质创造了肥沃的土壤。就像春雨滋润幼苗，今日的宇宙气候支持您向各个方向成长。

**个人影响**
您的木日主本性使您与成长、创造力和仁慈领导的主题相连。今天这些品质被放大。您可能会自然而然地掌控局面，以同情心和清晰的愿景引导他人。您在把握大局的同时管理细节的能力得到增强。

**实用建议**
将今日的能量用于{activities_zh}。这是播种的强势日子——无论是字面意义还是比喻意义。今天启动的新项目具有长期成长的强大潜力。您的沟通技巧特别有效，非常适合进行重要对话。

**时机提示**
吉时包括{favorable_hours}。早晨的活动可能特别顺利。考虑在能量高峰期安排创意工作或战略规划。晚间适合反思和为明天做准备。"""
        },
    ],
    "Fire": [
        {
            "id": "support_fire_1",
            "en": """**Today's Theme**
Today's {daily_element} energy feeds your Fire nature like kindling to a flame. Your natural radiance is amplified, and you may find yourself drawn to the spotlight in positive ways.

**Personal Impact**
As a Fire Day Master, you embody warmth, passion, and illumination. Today these qualities burn brightly. Your enthusiasm is contagious, making this an excellent day for inspiring others and leading by example. Your clarity of vision helps others see possibilities they might have missed.

**Practical Guidance**
This is an ideal day for {activities}. Your natural charisma and communication skills are at their peak. Presentations, negotiations, and social gatherings are especially favored. Don't shy away from taking center stage when opportunities arise—your fire attracts positive attention today.

**Timing Tips**
The most powerful hours for you are {favorable_hours}. Use these periods for activities requiring confidence and visibility. Midday energy tends to be especially strong for Fire nature individuals today.""",
            "zh": """**今日主题**
今日{daily_element_zh}能量像薪柴点燃火焰一样滋养您的火性。您天生的光芒被放大，您可能发现自己以积极的方式被聚光灯吸引。

**个人影响**
作为火日主，您体现着温暖、热情和光明。今天这些品质燃烧得格外明亮。您的热情具有感染力，使今天成为激励他人和以身作则的绝佳日子。您清晰的愿景帮助他人看到他们可能错过的可能性。

**实用建议**
今天非常适合{activities_zh}。您天生的魅力和沟通技巧达到顶峰。演讲、谈判和社交聚会特别受眷顾。当机会出现时，不要回避站在舞台中央——您的火焰今天会吸引积极的关注。

**时机提示**
您最有力量的时段是{favorable_hours}。将这些时间用于需要自信和曝光的活动。对于火性个体，中午的能量今天往往特别强烈。"""
        },
    ],
    "Earth": [
        {
            "id": "support_earth_1",
            "en": """**Today's Theme**
The {daily_element} energy today strengthens your Earth foundation, creating a day of stability and trustworthiness. Your natural grounding influence is amplified, making you a reliable anchor for those around you.

**Personal Impact**
As an Earth Day Master, you embody stability, nurturing, and practical wisdom. Today these qualities are enhanced. Others may naturally turn to you for advice and support. Your ability to see practical solutions while remaining compassionate is particularly strong.

**Practical Guidance**
This is an excellent day for {activities}. Your talent for building lasting foundations—whether in relationships, finances, or projects—is heightened. Consider addressing matters that require patience and steady effort. Negotiations and contracts are favored.

**Timing Tips**
Favorable hours are {favorable_hours}. These windows are ideal for important meetings and decisions. Your energy remains steady throughout the day, but morning hours may feel especially grounded and productive.""",
            "zh": """**今日主题**
今日{daily_element_zh}能量加强您的土性根基，创造一个稳定和值得信赖的日子。您天生的稳定影响力得到放大，使您成为周围人可靠的支柱。

**个人影响**
作为土日主，您体现着稳定、滋养和实际智慧。今天这些品质得到增强。他人可能自然而然地向您寻求建议和支持。您在保持同情心的同时看到实际解决方案的能力特别强。

**实用建议**
今天非常适合{activities_zh}。您建立持久基础的才能——无论是在人际关系、财务还是项目方面——都得到提升。考虑处理需要耐心和稳定努力的事务。谈判和合同受到眷顾。

**时机提示**
吉时是{favorable_hours}。这些时间窗口非常适合重要会议和决策。您的能量全天保持稳定，但早晨可能感觉特别踏实和高效。"""
        },
    ],
    "Metal": [
        {
            "id": "support_metal_1",
            "en": """**Today's Theme**
Today's {daily_element} energy refines and strengthens your Metal nature. Your natural precision and clarity are sharpened to a fine edge, making this an excellent day for decisive action.

**Personal Impact**
As a Metal Day Master, you embody clarity, righteousness, and the ability to discern truth. Today these qualities are particularly pronounced. Your judgments are likely to be accurate, and your ability to cut through confusion is enhanced. Others may seek your counsel on complex matters.

**Practical Guidance**
This is an ideal day for {activities}. Financial decisions, negotiations, and anything requiring precision are highly favored. Your ability to see what needs to be released or concluded is strong—use this energy to finish projects or make clean breaks where needed.

**Timing Tips**
The most favorable hours are {favorable_hours}. Use these times for important decisions and negotiations. Afternoon energy may be particularly sharp for analytical work.""",
            "zh": """**今日主题**
今日{daily_element_zh}能量精炼并加强您的金性。您天生的精确性和清晰度被磨砺得锋利，使今天成为果断行动的绝佳日子。

**个人影响**
作为金日主，您体现着清晰、正义和辨别真相的能力。今天这些品质特别突出。您的判断很可能是准确的，您穿透困惑的能力得到增强。他人可能会就复杂事务寻求您的建议。

**实用建议**
今天非常适合{activities_zh}。财务决策、谈判以及任何需要精确的事务都非常受眷顾。您看到需要放手或结束的事物的能力很强——利用这种能量来完成项目或在需要时做出干净的决断。

**时机提示**
最有利的时段是{favorable_hours}。将这些时间用于重要决策和谈判。下午的能量可能对分析工作特别敏锐。"""
        },
    ],
    "Water": [
        {
            "id": "support_water_1",
            "en": """**Today's Theme**
The {daily_element} energy today deepens your Water nature, enhancing your natural intuition and adaptability. Like a deep river receiving fresh tributaries, your inner wisdom is nourished and flows more freely.

**Personal Impact**
As a Water Day Master, you embody wisdom, flexibility, and the ability to navigate complex situations. Today these qualities are heightened. Your intuition is particularly reliable, and you may receive insights that seemed hidden before. Trust your inner guidance.

**Practical Guidance**
This is a favorable day for {activities}. Research, reflection, and activities requiring subtle perception are especially supported. Creative work that draws on subconscious inspiration may yield surprising results. Go with the flow rather than forcing outcomes.

**Timing Tips**
Favorable hours include {favorable_hours}. Evening hours may be particularly intuitive. Consider using quiet times for meditation or journaling to capture insights that arise.""",
            "zh": """**今日主题**
今日{daily_element_zh}能量深化您的水性，增强您天生的直觉和适应力。就像深河接收新鲜支流，您内在的智慧得到滋养，流动更加自由。

**个人影响**
作为水日主，您体现着智慧、灵活性和应对复杂情况的能力。今天这些品质得到提升。您的直觉特别可靠，您可能会获得之前隐藏的洞察。相信您内在的指引。

**实用建议**
今天很适合{activities_zh}。研究、反思和需要微妙感知的活动特别受支持。依赖潜意识灵感的创意工作可能会产生惊人的结果。顺其自然而不是强求结果。

**时机提示**
吉时包括{favorable_hours}。晚间可能直觉特别敏锐。考虑利用安静时间进行冥想或写日记，以捕捉出现的洞察。"""
        },
    ],
}

# When daily element CHALLENGES (controls) Day Master
ELEMENT_CHALLENGING_TEMPLATES = {
    "Wood": [
        {
            "id": "challenge_wood_1",
            "en": """**Today's Theme**
Today's {daily_element} energy creates some resistance to your Wood nature. Like a gardener pruning branches, this energy asks you to refine rather than expand. While growth may feel limited, this is an opportunity for strengthening what already exists.

**Personal Impact**
As a Wood Day Master, you naturally seek growth and expansion. Today that drive may meet obstacles. Rather than pushing against these limitations, consider what refinement or consolidation might serve you better. Sometimes the strongest trees are those that have weathered resistance.

**Practical Guidance**
This is a day to practice patience and strategic thinking. Focus on {activities} but with measured effort rather than bold expansion. Avoid forcing outcomes or making impulsive decisions. Review existing plans rather than starting new ones.

**Timing Tips**
Navigate carefully during challenging hours, and maximize {favorable_hours} for important matters. Morning may require extra patience, while afternoon could offer clearer paths forward.""",
            "zh": """**今日主题**
今日{daily_element_zh}能量对您的木性造成一些阻力。就像园丁修剪枝条，这种能量要求您精进而非扩张。虽然成长可能感觉受限，但这是加强现有事物的机会。

**个人影响**
作为木日主，您天生追求成长和扩张。今天这种驱动可能遇到障碍。与其对抗这些限制，不如考虑什么样的精进或整合可能更好地服务于您。有时最强壮的树木是那些经历过阻力的。

**实用建议**
今天是练习耐心和战略思维的日子。专注于{activities_zh}，但要有节制地努力而非大胆扩张。避免强求结果或做出冲动的决定。审视现有计划而非开始新的。

**时机提示**
在挑战性时段谨慎行事，在{favorable_hours}最大化处理重要事务。早晨可能需要额外的耐心，而下午可能提供更清晰的前进道路。"""
        },
    ],
    "Fire": [
        {
            "id": "challenge_fire_1",
            "en": """**Today's Theme**
The {daily_element} energy today may dampen your Fire's natural brightness. Like clouds partially obscuring the sun, your radiance meets some resistance. This is not a day to force your light, but to let it glow steadily through patience.

**Personal Impact**
As a Fire Day Master, your natural warmth and enthusiasm are your strengths. Today these may feel muted or misunderstood. Rather than burning brighter to compensate, consider the value of steady warmth over dramatic flames. Your influence works best through gentle persistence today.

**Practical Guidance**
Avoid high-stakes presentations or confrontational situations if possible. Focus on {activities} that don't require you to be center stage. Behind-the-scenes work and one-on-one connections may be more effective than group leadership.

**Timing Tips**
Be strategic about timing. Use {favorable_hours} for any activities requiring your charisma. Conserve energy during challenging periods and avoid overcommitting.""",
            "zh": """**今日主题**
今日{daily_element_zh}能量可能减弱您火性的自然光芒。就像云层部分遮蔽太阳，您的光芒遇到一些阻力。今天不是强行发光的日子，而是通过耐心让它稳定发光。

**个人影响**
作为火日主，您天生的温暖和热情是您的优势。今天这些可能感觉被压制或被误解。与其燃烧得更亮来补偿，不如考虑稳定的温暖比戏剧性的火焰更有价值。您的影响力今天通过温和的坚持效果最好。

**实用建议**
如果可能，避免高风险的演讲或对抗性情况。专注于不需要您成为焦点的{activities_zh}。幕后工作和一对一的联系可能比团体领导更有效。

**时机提示**
对时机要有策略。在{favorable_hours}进行任何需要您魅力的活动。在挑战性时段保存能量，避免过度承诺。"""
        },
    ],
    "Earth": [
        {
            "id": "challenge_earth_1",
            "en": """**Today's Theme**
Today's {daily_element} energy may shake your usually stable Earth foundation. Like mild tremors testing a building's strength, this energy challenges your groundedness. However, this is an opportunity to discover how resilient your foundations truly are.

**Personal Impact**
As an Earth Day Master, stability and reliability are your hallmarks. Today you may feel less grounded than usual, or find others testing your patience. Rather than resisting this instability, use it to identify areas where your foundation could be strengthened.

**Practical Guidance**
Avoid making major decisions that require long-term stability. Focus on {activities} that are flexible and can adapt to changing circumstances. This is a good day for contingency planning rather than firm commitments.

**Timing Tips**
Seek stability during {favorable_hours}. Morning may feel unsettled, but energy typically steadies as the day progresses. Evening offers good opportunity for grounding activities.""",
            "zh": """**今日主题**
今日{daily_element_zh}能量可能动摇您通常稳定的土性根基。就像轻微震动测试建筑物的强度，这种能量挑战您的稳定性。然而，这是发现您的基础真正有多坚韧的机会。

**个人影响**
作为土日主，稳定和可靠是您的标志。今天您可能感觉比平时不那么稳定，或发现他人在考验您的耐心。与其抵抗这种不稳定，不如用它来识别您的基础可以加强的地方。

**实用建议**
避免做出需要长期稳定的重大决定。专注于灵活且能适应变化情况的{activities_zh}。这是制定应急计划而非做出坚定承诺的好日子。

**时机提示**
在{favorable_hours}寻求稳定。早晨可能感觉不安，但能量通常随着一天的进展而稳定。晚间为接地活动提供好机会。"""
        },
    ],
    "Metal": [
        {
            "id": "challenge_metal_1",
            "en": """**Today's Theme**
The {daily_element} energy today may dull your Metal's usual sharpness. Like a blade needing re-tempering, your decisive edge meets some resistance. This is a day for patience rather than swift cuts.

**Personal Impact**
As a Metal Day Master, clarity and decisiveness are your natural gifts. Today these may feel less accessible. Decisions that would normally come easily might require more deliberation. This is not weakness—it's an invitation to consider multiple angles before acting.

**Practical Guidance**
Postpone major financial decisions or negotiations if possible. Focus on {activities} that benefit from careful consideration rather than quick judgment. Review and refine existing work rather than initiating new cuts or conclusions.

**Timing Tips**
Your clarity returns during {favorable_hours}. Use these windows for any decisions that can't wait. Otherwise, gather information today and decide tomorrow when your edge is sharper.""",
            "zh": """**今日主题**
今日{daily_element_zh}能量可能钝化您金性通常的锋利。就像刀刃需要重新淬炼，您果断的锋芒遇到一些阻力。今天是需要耐心而非迅速决断的日子。

**个人影响**
作为金日主，清晰和果断是您的天赋。今天这些可能感觉不那么容易获得。通常很容易做出的决定可能需要更多考虑。这不是软弱——这是在行动前考虑多个角度的邀请。

**实用建议**
如果可能，推迟重大财务决策或谈判。专注于受益于仔细考虑而非快速判断的{activities_zh}。审视和完善现有工作，而非发起新的决断或结论。

**时机提示**
您的清晰度在{favorable_hours}恢复。将这些时间窗口用于任何不能等待的决定。否则，今天收集信息，明天当您的锋芒更锐利时再决定。"""
        },
    ],
    "Water": [
        {
            "id": "challenge_water_1",
            "en": """**Today's Theme**
Today's {daily_element} energy may create obstacles in your Water nature's natural flow. Like a dam across a river, you might encounter blockages or feel your adaptability limited. This is a day for finding alternative routes rather than forcing through.

**Personal Impact**
As a Water Day Master, you excel at flowing around obstacles. Today even this flexibility may be tested. Your intuition might feel clouded, or paths that usually open easily seem blocked. Trust that water always finds a way, even if today requires patience.

**Practical Guidance**
Avoid situations requiring quick adaptation or complex navigation. Focus on {activities} where the path is already clear. If facing obstacles, step back and observe rather than immediately seeking to flow around them.

**Timing Tips**
Flow resumes more easily during {favorable_hours}. Morning may feel especially restricted, while evening often brings relief and renewed intuition.""",
            "zh": """**今日主题**
今日{daily_element_zh}能量可能在您水性的自然流动中制造障碍。就像河流上的水坝，您可能遇到阻塞或感觉适应力受限。今天是寻找替代路线而非强行突破的日子。

**个人影响**
作为水日主，您擅长绕过障碍流动。今天即使是这种灵活性也可能受到考验。您的直觉可能感觉模糊，或者通常容易打开的路径似乎被阻塞。相信水总是能找到出路，即使今天需要耐心。

**实用建议**
避免需要快速适应或复杂导航的情况。专注于道路已经明确的{activities_zh}。如果面对障碍，后退观察而不是立即寻求绕过它们。

**时机提示**
在{favorable_hours}流动更容易恢复。早晨可能感觉特别受限，而晚间通常带来解脱和恢复的直觉。"""
        },
    ],
}

# When daily element is WEALTH (Day Master controls it)
ELEMENT_WEALTH_TEMPLATES = {
    "default": [
        {
            "id": "wealth_1",
            "en": """**Today's Theme**
Today's {daily_element} energy represents wealth and resources for your chart. The cosmic alignment favors financial matters and practical achievements. Your ability to attract and manage resources is enhanced.

**Personal Impact**
When the daily element represents wealth for your Day Master, opportunities for material gain and practical progress are highlighted. You may find yourself naturally attuned to profitable opportunities or ways to increase your resources. Your practical skills are particularly effective.

**Practical Guidance**
This is an excellent day for {activities}. Financial decisions, business negotiations, and resource management are all favored. Your ability to assess value and make sound practical judgments is heightened. Consider addressing money matters you've been postponing.

**Timing Tips**
The most favorable hours for wealth-related activities are {favorable_hours}. Use these windows for important financial discussions or decisions. Your practical instincts are particularly reliable during these periods.""",
            "zh": """**今日主题**
今日{daily_element_zh}能量代表您命盘中的财富和资源。宇宙对齐有利于财务事务和实际成就。您吸引和管理资源的能力得到增强。

**个人影响**
当日元素代表您日主的财富时，物质收益和实际进展的机会被突出。您可能发现自己自然而然地注意到有利可图的机会或增加资源的方法。您的实际技能特别有效。

**实用建议**
今天非常适合{activities_zh}。财务决策、商业谈判和资源管理都受到眷顾。您评估价值和做出合理实际判断的能力得到提升。考虑处理您一直推迟的金钱事务。

**时机提示**
与财富相关活动的最有利时段是{favorable_hours}。将这些时间窗口用于重要的财务讨论或决策。在这些时期，您的实际直觉特别可靠。"""
        },
    ]
}

# When daily element is OUTPUT (Day Master produces it)
ELEMENT_OUTPUT_TEMPLATES = {
    "default": [
        {
            "id": "output_1",
            "en": """**Today's Theme**
Today's {daily_element} energy encourages expression and creativity. The cosmic climate supports your natural talents flowing outward into the world. This is a day when your inner gifts seek external manifestation.

**Personal Impact**
When the daily element represents your output, self-expression and creative endeavors are highlighted. You may feel a strong urge to share your ideas, create something meaningful, or make your mark. Your unique talents are particularly visible to others today.

**Practical Guidance**
This is an ideal day for {activities}. Creative projects, presentations, teaching, and any form of self-expression are favored. Your ideas want to emerge—give them form through writing, speaking, or creating. Others are receptive to your unique perspective.

**Timing Tips**
Creative energy peaks during {favorable_hours}. Schedule important creative work or presentations during these windows. Morning may bring inspiration, while afternoon often supports bringing ideas to completion.""",
            "zh": """**今日主题**
今日{daily_element_zh}能量鼓励表达和创造力。宇宙气候支持您的天赋向外流向世界。今天是您内在天赋寻求外在展现的日子。

**个人影响**
当日元素代表您的产出时，自我表达和创意努力被突出。您可能强烈渴望分享想法、创造有意义的东西或留下印记。您独特的才能今天对他人特别明显。

**实用建议**
今天非常适合{activities_zh}。创意项目、演讲、教学和任何形式的自我表达都受到眷顾。您的想法想要涌现——通过写作、演讲或创作给它们形式。他人对您独特的视角很接受。

**时机提示**
创意能量在{favorable_hours}达到顶峰。在这些时间窗口安排重要的创意工作或演讲。早晨可能带来灵感，而下午通常支持将想法完成。"""
        },
    ]
}

# ============== CLASH TEMPLATES ==============

CLASH_TEMPLATES = [
    {
        "id": "clash_1",
        "en": """**Today's Theme**
Today brings dynamic clash energy between the daily {daily_branch} and your natal {natal_branch}. In Bazi wisdom, clashes signify movement, change, and the breaking of stagnant patterns. While this may feel unsettling, it often heralds necessary transformation.

**Personal Impact**
The {daily_branch}-{natal_branch} clash activates a point of change in your chart. You may experience unexpected shifts, encounters with challenging situations, or a need to make decisions you've been avoiding. Remember that clashes, while uncomfortable, often clear the way for new beginnings.

**Practical Guidance**
Stay flexible and avoid rigid positions today. Focus on {activities} but be prepared to adapt your approach. Major commitments or confrontations are best postponed if possible. If conflicts arise, seek resolution through understanding rather than force.

**Timing Tips**
Navigate carefully throughout the day, especially during clash-sensitive hours. Your favorable hours of {favorable_hours} offer more stable energy. Use these windows for important activities while remaining adaptable elsewhere.""",
        "zh": """**今日主题**
今天日支{daily_branch}与您命盘中的{natal_branch}带来动态的冲克能量。在八字智慧中，冲代表移动、变化和打破停滞模式。虽然这可能让人不安，但它往往预示着必要的转变。

**个人影响**
{daily_branch}{natal_branch}冲激活了您命盘中的变化点。您可能经历意外的转变、遇到挑战性情况，或需要做出一直回避的决定。记住，冲虽然不舒服，但往往为新的开始扫清道路。

**实用建议**
今天保持灵活，避免固执立场。专注于{activities_zh}，但准备好调整您的方法。如果可能，最好推迟重大承诺或对抗。如果冲突出现，通过理解而非强力寻求解决。

**时机提示**
全天谨慎行事，特别是在冲敏感时段。您的吉时{favorable_hours}提供更稳定的能量。在这些时间窗口进行重要活动，同时在其他时候保持适应性。"""
    },
    {
        "id": "clash_2",
        "en": """**Today's Theme**
A powerful {daily_branch}-{natal_branch} clash is active today, creating dynamic tension in your life. Like tectonic plates shifting, this energy can feel disruptive but ultimately reshapes your landscape in meaningful ways.

**Personal Impact**
This clash stirs energy that has been settled, potentially bringing change to areas of life connected to the clashing branches. Relationships, projects, or situations may demand attention or reveal hidden tensions. Your adaptability and emotional resilience are your greatest assets today.

**Practical Guidance**
Channel the dynamic energy into constructive action rather than resisting it. Today favors {activities}, especially those involving transformation or releasing what no longer serves you. Avoid starting new long-term commitments; instead, focus on necessary changes.

**Timing Tips**
The clash energy fluctuates throughout the day. Find stability during {favorable_hours}, using these periods for activities requiring calm judgment. Early morning and late evening may feel more settled than midday.""",
        "zh": """**今日主题**
强大的{daily_branch}{natal_branch}冲今日活跃，在您的生活中创造动态张力。就像地壳板块移动，这种能量可能感觉破坏性，但最终以有意义的方式重塑您的格局。

**个人影响**
这个冲搅动了已经稳定的能量，可能给与冲克分支相关的生活领域带来变化。关系、项目或情况可能需要关注或揭示隐藏的紧张。您的适应能力和情感韧性是今天最大的资产。

**实用建议**
将动态能量引导到建设性行动中，而不是抵抗它。今天有利于{activities_zh}，特别是涉及转变或释放不再服务于您的事物。避免开始新的长期承诺；相反，专注于必要的变化。

**时机提示**
冲克能量全天波动。在{favorable_hours}找到稳定，将这些时段用于需要冷静判断的活动。清晨和傍晚可能比中午感觉更稳定。"""
    },
    {
        "id": "clash_3",
        "en": """**Today's Theme**
The cosmic tension between today's {daily_branch} and your {natal_branch} creates a day of potential breakthrough. Clashes in Bazi are not simply negative—they represent necessary movement that can lead to positive transformation.

**Personal Impact**
This clash energy may manifest as external events demanding response, internal restlessness seeking expression, or both. The key is to work with this energy consciously rather than being swept along unconsciously. What needs to change in your life? Today provides the energy to move it.

**Practical Guidance**
Embrace change rather than clinging to stability today. This energy supports {activities}, particularly anything involving release, renewal, or redirection. Clear communications are essential—misunderstandings are more likely today, so speak clearly and listen carefully.

**Timing Tips**
Ground yourself during {favorable_hours} for important decisions or conversations. The clash energy may peak at certain times—if you feel unusually agitated, step back and breathe before reacting. Evening typically brings relief and perspective.""",
        "zh": """**今日主题**
今日{daily_branch}与您的{natal_branch}之间的宇宙张力创造了潜在突破的一天。八字中的冲不仅仅是负面的——它们代表可能导致积极转变的必要运动。

**个人影响**
这种冲克能量可能表现为需要回应的外部事件、寻求表达的内在不安，或两者兼有。关键是有意识地与这种能量合作，而不是被无意识地席卷。您生活中什么需要改变？今天提供了推动它的能量。

**实用建议**
今天拥抱变化而不是执着于稳定。这种能量支持{activities_zh}，特别是涉及释放、更新或重新定向的任何事物。清晰的沟通至关重要——今天更容易产生误解，所以说清楚，仔细倾听。

**时机提示**
在{favorable_hours}为重要决定或对话稳定自己。冲克能量可能在某些时候达到顶峰——如果您感到异常烦躁，在反应之前后退呼吸。晚间通常带来解脱和视角。"""
    },
]

# ============== COMBINATION TEMPLATES ==============

COMBINATION_TEMPLATES = [
    {
        "id": "combo_1",
        "en": """**Today's Theme**
A harmonious {daily_branch}-{natal_branch} combination graces your chart today. In Bazi wisdom, combinations represent union, cooperation, and the coming together of beneficial forces. This is a day when things naturally align in your favor.

**Personal Impact**
This combination activates supportive energy in your chart, enhancing relationships and collaborative efforts. You may find people more agreeable, circumstances more cooperative, and opportunities more accessible. Your natural charm and likability are amplified.

**Practical Guidance**
This is an excellent day for {activities}. Partnership matters, negotiations, and social connections are especially favored. If you've been seeking agreement or cooperation from others, today offers the best chances. Building bridges and strengthening alliances pays dividends.

**Timing Tips**
The harmonious energy flows most strongly during {favorable_hours}. Schedule important meetings, relationship conversations, or collaborative work during these windows. The day generally supports connection and cooperation from morning to evening.""",
        "zh": """**今日主题**
和谐的{daily_branch}{natal_branch}合今日为您的命盘增添光彩。在八字智慧中，合代表联合、合作和有益力量的汇聚。今天是事物自然向您有利方向对齐的日子。

**个人影响**
这个合激活了您命盘中的支持性能量，增强了人际关系和合作努力。您可能发现人们更容易相处，情况更加配合，机会更容易获得。您天生的魅力和可爱性得到放大。

**实用建议**
今天非常适合{activities_zh}。合作事务、谈判和社交联系特别受眷顾。如果您一直在寻求他人的同意或合作，今天提供最佳机会。搭建桥梁和加强联盟会带来回报。

**时机提示**
和谐能量在{favorable_hours}流动最强。在这些时间窗口安排重要会议、关系对话或合作工作。从早到晚，这一天通常支持联系和合作。"""
    },
    {
        "id": "combo_2",
        "en": """**Today's Theme**
The beautiful {daily_branch}-{natal_branch} combination today creates an atmosphere of natural harmony and mutual benefit. Like two puzzle pieces fitting perfectly together, today's energy and your natal chart align seamlessly.

**Personal Impact**
This combination enhances your ability to connect with others and attract positive circumstances. Synchronicities may seem more frequent, and you might notice doors opening more easily than usual. Your presence has a unifying effect on those around you.

**Practical Guidance**
Leverage this harmonious energy for {activities}. Today particularly favors activities requiring cooperation, diplomacy, or relationship building. If there's someone you've been wanting to reach out to, or a partnership you've been considering, today's energy supports these connections.

**Timing Tips**
Favorable hours of {favorable_hours} amplify the already positive energy. Use the entire day for relationship matters, but schedule especially important connections during these optimal windows.""",
        "zh": """**今日主题**
今日美丽的{daily_branch}{natal_branch}合创造了自然和谐与互利的氛围。就像两块拼图完美契合，今日的能量与您的命盘无缝对齐。

**个人影响**
这个合增强了您与他人联系和吸引积极情况的能力。同步性可能看起来更频繁，您可能注意到门比平时更容易打开。您的存在对周围的人有统一的影响。

**实用建议**
利用这种和谐能量进行{activities_zh}。今天特别有利于需要合作、外交或建立关系的活动。如果有您一直想联系的人，或您一直在考虑的合作，今天的能量支持这些联系。

**时机提示**
{favorable_hours}的吉时放大了已经积极的能量。全天用于关系事务，但在这些最佳时间窗口安排特别重要的联系。"""
    },
    {
        "id": "combo_3",
        "en": """**Today's Theme**
Today's {daily_branch} forms an auspicious combination with your natal {natal_branch}, creating a day blessed with cooperative energy. The universe seems to conspire in your favor, smoothing paths and opening doors.

**Personal Impact**
This combination suggests a day when relationships strengthen naturally and new connections form easily. You may feel more socially confident and find others responding positively to your presence. Joint ventures and partnerships receive cosmic blessing.

**Practical Guidance**
This is an ideal day for {activities}. Focus on building and strengthening relationships, whether personal or professional. Collaborations started today have favorable long-term potential. If you need support from others, today is the day to ask.

**Timing Tips**
The combination energy is strongest during {favorable_hours}. Plan important social or partnership activities during these times. Morning gatherings and afternoon collaborations both benefit from today's harmonious climate.""",
        "zh": """**今日主题**
今日{daily_branch}与您命盘的{natal_branch}形成吉祥的合，创造了一个被合作能量祝福的日子。宇宙似乎在为您密谋，铺平道路，打开大门。

**个人影响**
这个合暗示今天关系自然加强，新联系容易形成。您可能感觉社交更自信，发现他人对您的存在反应积极。合资企业和合作伙伴关系受到宇宙祝福。

**实用建议**
今天非常适合{activities_zh}。专注于建立和加强关系，无论是个人还是职业。今天开始的合作具有良好的长期潜力。如果您需要他人的支持，今天是开口的日子。

**时机提示**
合的能量在{favorable_hours}最强。在这些时间计划重要的社交或合作活动。早晨的聚会和下午的合作都受益于今天和谐的气候。"""
    },
]

# ============== NEUTRAL TEMPLATES ==============

NEUTRAL_TEMPLATES = [
    {
        "id": "neutral_1",
        "en": """**Today's Theme**
Today's {daily_element} energy moves through your chart without major activation, creating a day of steady, balanced conditions. Like calm waters, today allows you to navigate at your own pace without strong currents pushing or pulling.

**Personal Impact**
As a {day_master_element} Day Master, today's energy neither strongly supports nor challenges you. This neutrality can be valuable—it's a day when outcomes depend more on your own effort and choice than on cosmic tailwinds or headwinds.

**Practical Guidance**
This is a good day for {activities}. Steady progress on ongoing projects is favored over dramatic new initiatives. Routine matters proceed smoothly. Use this stable day to address tasks that require consistent effort rather than inspiration.

**Timing Tips**
Energy remains relatively constant throughout the day, with {favorable_hours} offering slightly enhanced focus. Without strong cosmic currents, your own energy management becomes more important—pace yourself and take breaks as needed.""",
        "zh": """**今日主题**
今日{daily_element_zh}能量流过您的命盘而没有重大激活，创造了一个稳定、平衡的日子。就像平静的水面，今天允许您按自己的节奏航行，没有强烈的潮流推拉。

**个人影响**
作为{day_master_element}日主，今天的能量既不强烈支持也不挑战您。这种中性可能很有价值——这是结果更多取决于您自己的努力和选择，而非宇宙顺风或逆风的日子。

**实用建议**
今天适合{activities_zh}。持续项目的稳步进展比戏剧性的新举措更受眷顾。日常事务顺利进行。利用这个稳定的日子处理需要持续努力而非灵感的任务。

**时机提示**
能量全天保持相对恒定，{favorable_hours}提供略微增强的专注力。没有强烈的宇宙潮流，您自己的能量管理变得更重要——调整节奏，根据需要休息。"""
    },
    {
        "id": "neutral_2",
        "en": """**Today's Theme**
A balanced day arrives with {daily_element} energy creating neutral conditions. Think of this as a blank canvas—neither preset for success nor failure, but open to whatever you choose to create.

**Personal Impact**
This neutral energy gives you more control over your day's direction. Without strong cosmic influences pushing you one way or another, your intentions and actions carry more weight. It's a day for self-direction and personal responsibility.

**Practical Guidance**
Focus on {activities} that benefit from careful, measured effort. This is an excellent day for tasks requiring attention to detail rather than bold strokes. Administrative work, organization, and methodical progress are all supported.

**Timing Tips**
Your favorable hours of {favorable_hours} provide windows of slightly elevated energy. Otherwise, maintain steady effort throughout the day. Evening offers a good time for reflection on progress made.""",
        "zh": """**今日主题**
平衡的一天到来，{daily_element_zh}能量创造中性条件。把这想象成一块空白画布——既不预设成功也不预设失败，而是对您选择创造的任何事物开放。

**个人影响**
这种中性能量让您对一天的方向有更多控制。没有强烈的宇宙影响推动您向任何一个方向，您的意图和行动更有分量。这是自我引导和个人责任的日子。

**实用建议**
专注于受益于仔细、有节制努力的{activities_zh}。这是需要注意细节而非大胆笔触的任务的绝佳日子。行政工作、组织和有条不紊的进步都得到支持。

**时机提示**
您的吉时{favorable_hours}提供能量略微提升的时间窗口。否则，全天保持稳定努力。晚间为反思所取得的进展提供好时机。"""
    },
    {
        "id": "neutral_3",
        "en": """**Today's Theme**
Today's {daily_element} energy creates a peaceful equilibrium in your chart. Like a still pond reflecting the sky perfectly, conditions are calm and clear, allowing for undistorted perception and measured action.

**Personal Impact**
This tranquil day offers you the gift of clarity without drama. Your {day_master_element} nature can express itself naturally, without being amplified or suppressed by external forces. It's an opportunity to connect with your authentic self.

**Practical Guidance**
This is a favorable day for {activities}. Tasks requiring objectivity and clear thinking are especially supported. Decision-making benefits from today's lack of emotional charge. Consider addressing matters where unbiased assessment is valuable.

**Timing Tips**
The balanced energy holds throughout the day, with {favorable_hours} offering enhanced clarity. Use morning for analytical work and afternoon for implementation. Evening suits reflection and planning.""",
        "zh": """**今日主题**
今日{daily_element_zh}能量在您的命盘中创造和平的平衡。就像静止的池塘完美地反射天空，条件平静清晰，允许不失真的感知和有节制的行动。

**个人影响**
这个宁静的日子为您提供没有戏剧性的清晰礼物。您的{day_master_element}本性可以自然表达，不被外力放大或压制。这是与您真实自我连接的机会。

**实用建议**
今天有利于{activities_zh}。需要客观性和清晰思维的任务特别受支持。决策受益于今天缺乏情感波动。考虑处理无偏评估有价值的事务。

**时机提示**
平衡的能量全天保持，{favorable_hours}提供增强的清晰度。用早晨进行分析工作，下午进行实施。晚间适合反思和规划。"""
    },
]


# ============== TEMPLATE SELECTION LOGIC ==============

def get_template_for_interaction(
    day_master_element: str,
    daily_element: str,
    element_relationship: str,
    clashes: List[Dict],
    combinations: List[Dict],
) -> Tuple[Dict, str]:
    """
    Select the appropriate template based on the day's interactions.

    Returns:
        Tuple of (template_dict, template_id)
    """
    # Priority 1: Clashes (most impactful)
    if clashes:
        template = random.choice(CLASH_TEMPLATES)
        return template, template["id"]

    # Priority 2: Combinations (positive impact)
    if combinations:
        template = random.choice(COMBINATION_TEMPLATES)
        return template, template["id"]

    # Priority 3: Element relationship
    if element_relationship == "supporting":
        templates = ELEMENT_SUPPORTING_TEMPLATES.get(day_master_element, [])
        if templates:
            template = random.choice(templates)
            return template, template["id"]

    elif element_relationship in ("controlled", "draining"):
        templates = ELEMENT_CHALLENGING_TEMPLATES.get(day_master_element, [])
        if templates:
            template = random.choice(templates)
            return template, template["id"]

    elif element_relationship == "controlling":
        templates = ELEMENT_WEALTH_TEMPLATES["default"]
        template = random.choice(templates)
        return template, template["id"]

    elif element_relationship == "producing":
        templates = ELEMENT_OUTPUT_TEMPLATES["default"]
        template = random.choice(templates)
        return template, template["id"]

    # Fallback: Neutral
    template = random.choice(NEUTRAL_TEMPLATES)
    return template, template["id"]


def render_template(
    template: Dict,
    language: str,
    daily_element: str,
    daily_branch: str,
    natal_branch: str,
    day_master_element: str,
    favorable_hours: List[str],
    **kwargs
) -> str:
    """
    Render a template with the provided data.
    """
    template_str = template.get(language, template.get("en", ""))

    # Get activities for the daily element (what activities this energy supports)
    activities_list = ACTIVITIES.get(daily_element, ACTIVITIES["Earth"])
    activities = ", ".join(random.sample(activities_list.get(language, activities_list["en"]), min(2, len(activities_list["en"]))))
    activities_zh = ", ".join(random.sample(ACTIVITIES.get(daily_element, ACTIVITIES["Earth"])["zh"], min(2, len(ACTIVITIES.get(daily_element, ACTIVITIES["Earth"])["zh"]))))

    # Format favorable hours
    favorable_hours_str = ", ".join(favorable_hours) if favorable_hours else "morning hours"

    # Render
    try:
        return template_str.format(
            daily_element=daily_element,
            daily_element_zh=ELEMENT_NAMES_ZH.get(daily_element, daily_element),
            daily_branch=daily_branch,
            natal_branch=natal_branch or "",
            day_master_element=day_master_element,
            activities=activities,
            activities_zh=activities_zh,
            favorable_hours=favorable_hours_str,
            **kwargs
        )
    except KeyError as e:
        # If a placeholder is missing, return template with available data
        return template_str


# Convenience dict for external access
DAILY_TEMPLATES = {
    "supporting": ELEMENT_SUPPORTING_TEMPLATES,
    "challenging": ELEMENT_CHALLENGING_TEMPLATES,
    "wealth": ELEMENT_WEALTH_TEMPLATES,
    "output": ELEMENT_OUTPUT_TEMPLATES,
    "clash": CLASH_TEMPLATES,
    "combination": COMBINATION_TEMPLATES,
    "neutral": NEUTRAL_TEMPLATES,
}
