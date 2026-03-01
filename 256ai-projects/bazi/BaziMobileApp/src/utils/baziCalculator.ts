/**
 * BaZi (Four Pillars) Calculator
 * Calculates the Four Pillars of Destiny based on birth date and time
 */

// Heavenly Stems (天干)
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// Earthly Branches (地支)
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// Stem to Element mapping
const STEM_ELEMENTS: Record<string, string> = {
  '甲': 'Wood', '乙': 'Wood',
  '丙': 'Fire', '丁': 'Fire',
  '戊': 'Earth', '己': 'Earth',
  '庚': 'Metal', '辛': 'Metal',
  '壬': 'Water', '癸': 'Water',
};

// Stem to Polarity mapping (Yang = odd index, Yin = even index in traditional order)
const STEM_POLARITY: Record<string, string> = {
  '甲': 'Yang', '乙': 'Yin',
  '丙': 'Yang', '丁': 'Yin',
  '戊': 'Yang', '己': 'Yin',
  '庚': 'Yang', '辛': 'Yin',
  '壬': 'Yang', '癸': 'Yin',
};

// Solar term approximate dates (month, day) for determining Chinese month
// These are the "Jie" (节) terms that start each Chinese month
const SOLAR_TERMS = [
  { month: 2, day: 4 },   // 立春 Start of Spring - Month 1 (Tiger)
  { month: 3, day: 6 },   // 惊蛰 Awakening of Insects - Month 2 (Rabbit)
  { month: 4, day: 5 },   // 清明 Clear and Bright - Month 3 (Dragon)
  { month: 5, day: 6 },   // 立夏 Start of Summer - Month 4 (Snake)
  { month: 6, day: 6 },   // 芒种 Grain in Ear - Month 5 (Horse)
  { month: 7, day: 7 },   // 小暑 Minor Heat - Month 6 (Goat)
  { month: 8, day: 8 },   // 立秋 Start of Autumn - Month 7 (Monkey)
  { month: 9, day: 8 },   // 白露 White Dew - Month 8 (Rooster)
  { month: 10, day: 8 },  // 寒露 Cold Dew - Month 9 (Dog)
  { month: 11, day: 7 },  // 立冬 Start of Winter - Month 10 (Pig)
  { month: 12, day: 7 },  // 大雪 Major Snow - Month 11 (Rat)
  { month: 1, day: 6 },   // 小寒 Minor Cold - Month 12 (Ox)
];

// Month stem calculation table based on year stem
// yearStemIndex -> first month stem index
const MONTH_STEM_START: Record<number, number> = {
  0: 2,  // 甲/己 year -> 丙寅 month starts
  1: 4,  // 乙/庚 year -> 戊寅 month starts
  2: 6,  // 丙/辛 year -> 庚寅 month starts
  3: 8,  // 丁/壬 year -> 壬寅 month starts
  4: 0,  // 戊/癸 year -> 甲寅 month starts
  5: 2,
  6: 4,
  7: 6,
  8: 8,
  9: 0,
};

// Hour branch based on time (2-hour periods)
function getHourBranch(hour: number): number {
  // 23:00-00:59 = 子 (0), 01:00-02:59 = 丑 (1), etc.
  if (hour === 23) return 0;
  return Math.floor((hour + 1) / 2) % 12;
}

// Hour stem calculation based on day stem
// dayStemIndex -> first hour (子) stem index
const HOUR_STEM_START: Record<number, number> = {
  0: 0,  // 甲/己 day -> 甲子 hour starts
  1: 2,  // 乙/庚 day -> 丙子 hour starts
  2: 4,  // 丙/辛 day -> 戊子 hour starts
  3: 6,  // 丁/壬 day -> 庚子 hour starts
  4: 8,  // 戊/癸 day -> 壬子 hour starts
  5: 0,
  6: 2,
  7: 4,
  8: 6,
  9: 8,
};

/**
 * Calculate the Chinese year (may differ from Western year before 立春)
 */
function getChineseYear(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Before 立春 (around Feb 4), still previous Chinese year
  if (month < 2 || (month === 2 && day < 4)) {
    return year - 1;
  }
  return year;
}

/**
 * Calculate the Chinese month (1-12 based on solar terms)
 */
function getChineseMonth(date: Date): number {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Find which solar term period we're in
  for (let i = 0; i < SOLAR_TERMS.length; i++) {
    const term = SOLAR_TERMS[i];
    const nextTerm = SOLAR_TERMS[(i + 1) % 12];

    const termMonth = term.month;
    const nextTermMonth = nextTerm.month;

    // Check if date is in this term's period
    if (month === termMonth && day >= term.day) {
      return (i + 1); // Chinese month 1-12
    }
    if (month === termMonth && day < term.day && i > 0) {
      return i; // Previous month
    }
  }

  // Handle edge cases - January before 小寒
  if (month === 1 && day < 6) {
    return 12; // Still month 12 (Ox month)
  }

  // December after 大雪
  if (month === 12 && day >= 7) {
    return 11;
  }

  // Fallback based on approximate mapping
  const monthMap = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  return monthMap[month - 1];
}

/**
 * Calculate day pillar index (0-59 in the 60-day cycle)
 * Reference: January 1, 1900 was day 甲戌 (index 10 in the 60-cycle)
 */
function getDayPillarIndex(date: Date): number {
  // Reference date: Jan 1, 1900 = 甲戌 (Jia-Xu)
  // 甲戌 is stem index 0, branch index 10, so cycle index = 10
  const reference = new Date(1900, 0, 1);
  const referenceIndex = 10;

  // Calculate days difference
  const diffTime = date.getTime() - reference.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Calculate position in 60-day cycle
  return ((referenceIndex + diffDays) % 60 + 60) % 60;
}

/**
 * Convert cycle index (0-59) to stem and branch indices
 */
function cycleToStemBranch(cycleIndex: number): { stemIndex: number; branchIndex: number } {
  return {
    stemIndex: cycleIndex % 10,
    branchIndex: cycleIndex % 12,
  };
}

export interface FourPillars {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  dayMaster: string;
  dayMasterElement: string;
  dayMasterPolarity: string;
}

/**
 * Calculate the Four Pillars of Destiny
 * @param birthDate - Birth date in YYYY-MM-DD format
 * @param birthTime - Birth time in HH:MM or HH:MM:SS format (optional, defaults to 12:00)
 */
export function calculateFourPillars(birthDate: string, birthTime?: string): FourPillars {
  const date = new Date(birthDate + 'T12:00:00');

  // Parse birth time
  const timeStr = birthTime || '12:00:00';
  const [hours] = timeStr.split(':').map(Number);

  // === Year Pillar ===
  const chineseYear = getChineseYear(date);
  const yearStemIndex = (chineseYear - 4) % 10;
  const yearBranchIndex = (chineseYear - 4) % 12;
  const yearPillar = STEMS[yearStemIndex] + BRANCHES[yearBranchIndex];

  // === Month Pillar ===
  const chineseMonth = getChineseMonth(date);
  // Month branch: Tiger (寅) is month 1, cycles through
  const monthBranchIndex = (chineseMonth + 1) % 12; // Month 1 = 寅 (index 2)
  // Month stem: Based on year stem
  const monthStemStart = MONTH_STEM_START[yearStemIndex];
  const monthStemIndex = (monthStemStart + chineseMonth - 1) % 10;
  const monthPillar = STEMS[monthStemIndex] + BRANCHES[monthBranchIndex];

  // === Day Pillar ===
  const dayIndex = getDayPillarIndex(date);
  const { stemIndex: dayStemIndex, branchIndex: dayBranchIndex } = cycleToStemBranch(dayIndex);
  const dayPillar = STEMS[dayStemIndex] + BRANCHES[dayBranchIndex];

  // === Hour Pillar ===
  const hourBranchIndex = getHourBranch(hours);
  const hourStemStart = HOUR_STEM_START[dayStemIndex];
  const hourStemIndex = (hourStemStart + hourBranchIndex) % 10;
  const hourPillar = STEMS[hourStemIndex] + BRANCHES[hourBranchIndex];

  // === Day Master ===
  const dayMaster = STEMS[dayStemIndex];
  const dayMasterElement = STEM_ELEMENTS[dayMaster];
  const dayMasterPolarity = STEM_POLARITY[dayMaster];

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    dayMaster,
    dayMasterElement,
    dayMasterPolarity,
  };
}

// ============== Compatibility Calculation ==============

// Element productive cycle: Wood → Fire → Earth → Metal → Water → Wood
const PRODUCTIVE_CYCLE: Record<string, string> = {
  'Wood': 'Fire',
  'Fire': 'Earth',
  'Earth': 'Metal',
  'Metal': 'Water',
  'Water': 'Wood',
};

// Element controlling cycle: Wood → Earth → Water → Fire → Metal → Wood
const CONTROLLING_CYCLE: Record<string, string> = {
  'Wood': 'Earth',
  'Earth': 'Water',
  'Water': 'Fire',
  'Fire': 'Metal',
  'Metal': 'Wood',
};

// Six Harmonies (六合) - Highly compatible branch pairs
const SIX_HARMONIES: [number, number][] = [
  [0, 1],   // 子-丑 Rat-Ox
  [2, 11],  // 寅-亥 Tiger-Pig
  [3, 10],  // 卯-戌 Rabbit-Dog
  [4, 9],   // 辰-酉 Dragon-Rooster
  [5, 8],   // 巳-申 Snake-Monkey
  [6, 7],   // 午-未 Horse-Goat
];

// Three Harmonies (三合) - Triangular affinities
const THREE_HARMONIES: [number, number, number][] = [
  [0, 4, 8],   // 子辰申 Water frame: Rat-Dragon-Monkey
  [1, 5, 9],   // 丑巳酉 Metal frame: Ox-Snake-Rooster
  [2, 6, 10],  // 寅午戌 Fire frame: Tiger-Horse-Dog
  [3, 7, 11],  // 卯未亥 Wood frame: Rabbit-Goat-Pig
];

// Six Clashes (六冲) - Opposing branches
const SIX_CLASHES: [number, number][] = [
  [0, 6],   // 子-午 Rat-Horse
  [1, 7],   // 丑-未 Ox-Goat
  [2, 8],   // 寅-申 Tiger-Monkey
  [3, 9],   // 卯-酉 Rabbit-Rooster
  [4, 10],  // 辰-戌 Dragon-Dog
  [5, 11],  // 巳-亥 Snake-Pig
];

// Extract branch index from pillar string
function getBranchIndex(pillar: string): number {
  if (!pillar || pillar.length < 2) return -1;
  const branch = pillar[1];
  return BRANCHES.indexOf(branch);
}

// Extract stem and get its element
function getStemElement(pillar: string): string | null {
  if (!pillar || pillar.length < 1) return null;
  const stem = pillar[0];
  return STEM_ELEMENTS[stem] || null;
}

// Check if two branches form a Six Harmony
function isSixHarmony(branch1: number, branch2: number): boolean {
  return SIX_HARMONIES.some(([a, b]) =>
    (branch1 === a && branch2 === b) || (branch1 === b && branch2 === a)
  );
}

// Check if two branches are part of the same Three Harmony group
function isThreeHarmony(branch1: number, branch2: number): boolean {
  return THREE_HARMONIES.some(group =>
    group.includes(branch1) && group.includes(branch2) && branch1 !== branch2
  );
}

// Check if two branches clash
function isSixClash(branch1: number, branch2: number): boolean {
  return SIX_CLASHES.some(([a, b]) =>
    (branch1 === a && branch2 === b) || (branch1 === b && branch2 === a)
  );
}

// Calculate element relationship score
function getElementRelationshipScore(elem1: string | null, elem2: string | null): number {
  if (!elem1 || !elem2) return 0;

  // Same element - moderate compatibility
  if (elem1 === elem2) return 5;

  // Productive relationship (one produces the other)
  if (PRODUCTIVE_CYCLE[elem1] === elem2) return 8;  // elem1 produces elem2
  if (PRODUCTIVE_CYCLE[elem2] === elem1) return 6;  // elem2 produces elem1

  // Controlling relationship (one controls the other)
  if (CONTROLLING_CYCLE[elem1] === elem2) return 2;  // elem1 controls elem2
  if (CONTROLLING_CYCLE[elem2] === elem1) return 3;  // elem2 controls elem1

  return 4; // Neutral
}

export interface CompatibilityResult {
  score: number;
  dayMasterCompatibility: string;
  yearBranchRelation: string;
  overallHarmony: string;
}

/**
 * Calculate compatibility between two people based on their Four Pillars
 * Returns a deterministic score (0-100) based on BaZi principles
 */
export function calculateCompatibility(
  person1: {
    dayMaster?: string | null;
    dayMasterElement?: string | null;
    yearPillar?: string | null;
    dayPillar?: string | null;
  },
  person2: {
    dayMaster?: string | null;
    dayMasterElement?: string | null;
    yearPillar?: string | null;
    dayPillar?: string | null;
  }
): CompatibilityResult {
  let score = 50; // Base score
  let dayMasterCompatibility = 'Neutral';
  let yearBranchRelation = 'Neutral';

  // 1. Day Master Element Compatibility (most important - up to 25 points)
  const dm1 = person1.dayMasterElement ?? null;
  const dm2 = person2.dayMasterElement ?? null;
  const dmScore = getElementRelationshipScore(dm1, dm2);
  score += (dmScore - 4) * 5; // -10 to +20 points

  if (dm1 && dm2) {
    if (dm1 === dm2) {
      dayMasterCompatibility = 'Same Element - Strong Understanding';
    } else if (PRODUCTIVE_CYCLE[dm1] === dm2 || PRODUCTIVE_CYCLE[dm2] === dm1) {
      dayMasterCompatibility = 'Productive - Supportive Energy';
    } else if (CONTROLLING_CYCLE[dm1] === dm2 || CONTROLLING_CYCLE[dm2] === dm1) {
      dayMasterCompatibility = 'Controlling - Growth Through Challenge';
    } else {
      dayMasterCompatibility = 'Complementary Elements';
    }
  }

  // 2. Year Branch (Animal Sign) Compatibility (up to 20 points)
  const yearBranch1 = getBranchIndex(person1.yearPillar || '');
  const yearBranch2 = getBranchIndex(person2.yearPillar || '');

  if (yearBranch1 >= 0 && yearBranch2 >= 0) {
    if (isSixHarmony(yearBranch1, yearBranch2)) {
      score += 15;
      yearBranchRelation = 'Six Harmony - Deep Bond';
    } else if (isThreeHarmony(yearBranch1, yearBranch2)) {
      score += 10;
      yearBranchRelation = 'Three Harmony - Natural Affinity';
    } else if (isSixClash(yearBranch1, yearBranch2)) {
      score -= 10;
      yearBranchRelation = 'Six Clash - Dynamic Tension';
    } else if (yearBranch1 === yearBranch2) {
      score += 5;
      yearBranchRelation = 'Same Sign - Shared Understanding';
    }
  }

  // 3. Day Branch Compatibility (up to 15 points)
  const dayBranch1 = getBranchIndex(person1.dayPillar || '');
  const dayBranch2 = getBranchIndex(person2.dayPillar || '');

  if (dayBranch1 >= 0 && dayBranch2 >= 0) {
    if (isSixHarmony(dayBranch1, dayBranch2)) {
      score += 12;
    } else if (isThreeHarmony(dayBranch1, dayBranch2)) {
      score += 8;
    } else if (isSixClash(dayBranch1, dayBranch2)) {
      score -= 8;
    }
  }

  // 4. Day Pillar Element Harmony (up to 10 points)
  const dayElem1 = getStemElement(person1.dayPillar || '');
  const dayElem2 = getStemElement(person2.dayPillar || '');
  const dayElemScore = getElementRelationshipScore(dayElem1, dayElem2);
  score += (dayElemScore - 4) * 2; // -4 to +8 points

  // Clamp score between 30 and 98
  score = Math.max(30, Math.min(98, score));

  // Determine overall harmony description
  let overallHarmony: string;
  if (score >= 85) {
    overallHarmony = 'Excellent';
  } else if (score >= 70) {
    overallHarmony = 'Good';
  } else if (score >= 55) {
    overallHarmony = 'Moderate';
  } else {
    overallHarmony = 'Challenging';
  }

  return {
    score,
    dayMasterCompatibility,
    yearBranchRelation,
    overallHarmony,
  };
}
