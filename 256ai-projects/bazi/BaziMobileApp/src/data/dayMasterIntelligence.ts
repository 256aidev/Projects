/**
 * Day Master Intelligence Content
 * Cognitive style interpretations for each of the 10 Day Masters
 *
 * BaZi Intelligence describes how a person naturally thinks, processes
 * information, reacts under stress, and makes decisions.
 */

export interface DayMasterIntelligence {
  dayMaster: string;
  element: string;
  polarity: string;
  thinkingStyle: string;
  decisionRhythm: string;
  stressResponse: string;
  processingTendencies: string;
}

const DAY_MASTER_INTELLIGENCE: Record<string, DayMasterIntelligence> = {
  // Yang Wood - 甲
  '甲': {
    dayMaster: '甲',
    element: 'Wood',
    polarity: 'Yang',
    thinkingStyle: 'You think in terms of growth and expansion. Like a tall tree reaching upward, your mind naturally gravitates toward big-picture vision and long-term goals. You prefer clarity and directness over complexity.',
    decisionRhythm: 'You make decisions steadily and confidently once you see the path forward. You prefer to commit fully rather than hedge. Once rooted in a direction, you follow through with persistence.',
    stressResponse: 'Under pressure, you may become rigid or inflexible. Your natural response is to stand firm, which can be a strength, but sometimes adapting would serve you better.',
    processingTendencies: 'You process information by looking for the main trunk - the core idea. Details feel secondary until the big picture is clear. You learn best through structure and clear hierarchies.',
  },

  // Yin Wood - 乙
  '乙': {
    dayMaster: '乙',
    element: 'Wood',
    polarity: 'Yin',
    thinkingStyle: 'You think flexibly and adaptively, like vines that find their way around obstacles. Your mind is resourceful and finds creative paths where others see dead ends.',
    decisionRhythm: 'You prefer to feel your way through decisions, adjusting as you go. You are comfortable with ambiguity and don\'t need everything mapped out in advance.',
    stressResponse: 'Under pressure, you may become indecisive or overly accommodating. Your strength is adaptability, but sometimes you need to take a firmer stance.',
    processingTendencies: 'You process information relationally - how things connect and influence each other. You learn well through relationships and practical experience.',
  },

  // Yang Fire - 丙
  '丙': {
    dayMaster: '丙',
    element: 'Fire',
    polarity: 'Yang',
    thinkingStyle: 'You think expansively and optimistically, like the sun illuminating everything it touches. Your mind naturally sees possibilities and potential in people and situations.',
    decisionRhythm: 'You decide quickly and enthusiastically. You trust your instincts and aren\'t afraid to act on inspiration. Sometimes this means revisiting decisions later.',
    stressResponse: 'Under pressure, you may become scattered or burn out from overextending. Your natural warmth can turn to frustration when things feel blocked.',
    processingTendencies: 'You process information through enthusiasm and connection. You learn best when engaged emotionally and when you can share what you\'re learning with others.',
  },

  // Yin Fire - 丁
  '丁': {
    dayMaster: '丁',
    element: 'Fire',
    polarity: 'Yin',
    thinkingStyle: 'You think with precision and depth, like a focused flame or candle light. Your mind notices subtle details and nuances that others miss.',
    decisionRhythm: 'You prefer to observe and understand before committing. Your decisions are thoughtful and considered, based on careful analysis of what you\'ve witnessed.',
    stressResponse: 'Under pressure, you may become overly critical or anxious about small details. Your sensitivity can turn inward and create unnecessary worry.',
    processingTendencies: 'You process information through careful observation and reflection. You learn best when you have quiet time to digest and integrate new ideas.',
  },

  // Yang Earth - 戊
  '戊': {
    dayMaster: '戊',
    element: 'Earth',
    polarity: 'Yang',
    thinkingStyle: 'You think with stability and groundedness, like a mountain that provides perspective. Your mind naturally seeks solid foundations and reliable principles.',
    decisionRhythm: 'You decide deliberately and don\'t rush. You want to be sure before committing. Once decided, you are steady and reliable in following through.',
    stressResponse: 'Under pressure, you may become stubborn or immovable. Your stability can turn to inflexibility when circumstances require adjustment.',
    processingTendencies: 'You process information by grounding it in practical reality. You learn best through direct experience and tangible examples.',
  },

  // Yin Earth - 己
  '己': {
    dayMaster: '己',
    element: 'Earth',
    polarity: 'Yin',
    thinkingStyle: 'You think nurturingly and practically, like fertile soil that supports growth. Your mind naturally considers how to help things develop and flourish.',
    decisionRhythm: 'You prefer collaborative decision-making and value input from others. You are patient and willing to cultivate outcomes over time.',
    stressResponse: 'Under pressure, you may become overly worried about others or take on too much responsibility. Your supportive nature can lead to neglecting your own needs.',
    processingTendencies: 'You process information through relationships and care. You learn best in supportive environments where you can grow at your own pace.',
  },

  // Yang Metal - 庚
  '庚': {
    dayMaster: '庚',
    element: 'Metal',
    polarity: 'Yang',
    thinkingStyle: 'You think decisively and directly, like a sharp blade cutting through confusion. Your mind naturally seeks clarity, efficiency, and results.',
    decisionRhythm: 'You decide boldly and are comfortable with the consequences. You prefer action to endless deliberation and have strong convictions.',
    stressResponse: 'Under pressure, you may become harsh or overly forceful. Your directness can turn to aggression when you feel challenged.',
    processingTendencies: 'You process information by evaluating what works and what doesn\'t. You learn best through challenge and competition.',
  },

  // Yin Metal - 辛
  '辛': {
    dayMaster: '辛',
    element: 'Metal',
    polarity: 'Yin',
    thinkingStyle: 'You think with refinement and precision, like a finely crafted jewel. Your mind naturally seeks beauty, quality, and perfection in details.',
    decisionRhythm: 'You decide based on high standards and careful discernment. You prefer quality over quantity and won\'t settle for less than your standards allow.',
    stressResponse: 'Under pressure, you may become overly critical or perfectionistic. Your high standards can create unnecessary tension.',
    processingTendencies: 'You process information through aesthetic and quality filters. You learn best when content is well-organized and elegantly presented.',
  },

  // Yang Water - 壬
  '壬': {
    dayMaster: '壬',
    element: 'Water',
    polarity: 'Yang',
    thinkingStyle: 'You think expansively and philosophically, like a great river or ocean. Your mind naturally flows across boundaries and explores diverse perspectives.',
    decisionRhythm: 'You prefer to let decisions emerge organically. You are comfortable with uncertainty and trust that clarity will come in time.',
    stressResponse: 'Under pressure, you may become restless or escapist. Your natural flow can scatter when there\'s too much constraint.',
    processingTendencies: 'You process information through synthesis and connection. You learn best by exploring freely and following your curiosity.',
  },

  // Yin Water - 癸
  '癸': {
    dayMaster: '癸',
    element: 'Water',
    polarity: 'Yin',
    thinkingStyle: 'You think intuitively and deeply, like underground springs or morning dew. Your mind works beneath the surface, making connections others don\'t see.',
    decisionRhythm: 'You prefer to feel your way through decisions using intuition. You often know before you can explain why you know.',
    stressResponse: 'Under pressure, you may become withdrawn or emotionally overwhelmed. Your sensitivity needs protection from harsh environments.',
    processingTendencies: 'You process information through feeling and intuition. You learn best when given time for quiet reflection and when emotional safety is present.',
  },
};

export function getDayMasterIntelligence(dayMaster: string): DayMasterIntelligence | null {
  return DAY_MASTER_INTELLIGENCE[dayMaster] || null;
}

export function getAllDayMasters(): string[] {
  return Object.keys(DAY_MASTER_INTELLIGENCE);
}
