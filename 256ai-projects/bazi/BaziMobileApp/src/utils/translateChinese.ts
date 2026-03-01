/**
 * Translate Chinese BaZi characters to English
 * Used to make readings more accessible when language is English
 */

// Earthly Branches (地支) with their animals
const BRANCHES: Record<string, string> = {
  '子': 'Rat (子)',
  '丑': 'Ox (丑)',
  '寅': 'Tiger (寅)',
  '卯': 'Rabbit (卯)',
  '辰': 'Dragon (辰)',
  '巳': 'Snake (巳)',
  '午': 'Horse (午)',
  '未': 'Goat (未)',
  '申': 'Monkey (申)',
  '酉': 'Rooster (酉)',
  '戌': 'Dog (戌)',
  '亥': 'Pig (亥)',
};

// Branch to time mapping
const BRANCH_TIMES: Record<string, { animal: string; time: string; order: number }> = {
  '子': { animal: 'Rat', time: '11pm-1am', order: 0 },
  '丑': { animal: 'Ox', time: '1am-3am', order: 1 },
  '寅': { animal: 'Tiger', time: '3am-5am', order: 2 },
  '卯': { animal: 'Rabbit', time: '5am-7am', order: 3 },
  '辰': { animal: 'Dragon', time: '7am-9am', order: 4 },
  '巳': { animal: 'Snake', time: '9am-11am', order: 5 },
  '午': { animal: 'Horse', time: '11am-1pm', order: 6 },
  '未': { animal: 'Goat', time: '1pm-3pm', order: 7 },
  '申': { animal: 'Monkey', time: '3pm-5pm', order: 8 },
  '酉': { animal: 'Rooster', time: '5pm-7pm', order: 9 },
  '戌': { animal: 'Dog', time: '7pm-9pm', order: 10 },
  '亥': { animal: 'Pig', time: '9pm-11pm', order: 11 },
};

// Heavenly Stems (天干) with elements
const STEMS: Record<string, string> = {
  '甲': 'Jia-Wood (甲)',
  '乙': 'Yi-Wood (乙)',
  '丙': 'Bing-Fire (丙)',
  '丁': 'Ding-Fire (丁)',
  '戊': 'Wu-Earth (戊)',
  '己': 'Ji-Earth (己)',
  '庚': 'Geng-Metal (庚)',
  '辛': 'Xin-Metal (辛)',
  '壬': 'Ren-Water (壬)',
  '癸': 'Gui-Water (癸)',
};

// Common pillar combinations (stem + branch)
const PILLARS: Record<string, string> = {
  '甲子': 'Jia-Zi (甲子)',
  '乙丑': 'Yi-Chou (乙丑)',
  '丙寅': 'Bing-Yin (丙寅)',
  '丁卯': 'Ding-Mao (丁卯)',
  '戊辰': 'Wu-Chen (戊辰)',
  '己巳': 'Ji-Si (己巳)',
  '庚午': 'Geng-Wu (庚午)',
  '辛未': 'Xin-Wei (辛未)',
  '壬申': 'Ren-Shen (壬申)',
  '癸酉': 'Gui-You (癸酉)',
  '甲戌': 'Jia-Xu (甲戌)',
  '乙亥': 'Yi-Hai (乙亥)',
  '丙子': 'Bing-Zi (丙子)',
  '丁丑': 'Ding-Chou (丁丑)',
  '戊寅': 'Wu-Yin (戊寅)',
  '己卯': 'Ji-Mao (己卯)',
  '庚辰': 'Geng-Chen (庚辰)',
  '辛巳': 'Xin-Si (辛巳)',
  '壬午': 'Ren-Wu (壬午)',
  '癸未': 'Gui-Wei (癸未)',
  '甲申': 'Jia-Shen (甲申)',
  '乙酉': 'Yi-You (乙酉)',
  '丙戌': 'Bing-Xu (丙戌)',
  '丁亥': 'Ding-Hai (丁亥)',
  '戊子': 'Wu-Zi (戊子)',
  '己丑': 'Ji-Chou (己丑)',
  '庚寅': 'Geng-Yin (庚寅)',
  '辛卯': 'Xin-Mao (辛卯)',
  '壬辰': 'Ren-Chen (壬辰)',
  '癸巳': 'Gui-Si (癸巳)',
  '甲午': 'Jia-Wu (甲午)',
  '乙未': 'Yi-Wei (乙未)',
  '丙申': 'Bing-Shen (丙申)',
  '丁酉': 'Ding-You (丁酉)',
  '戊戌': 'Wu-Xu (戊戌)',
  '己亥': 'Ji-Hai (己亥)',
  '庚子': 'Geng-Zi (庚子)',
  '辛丑': 'Xin-Chou (辛丑)',
  '壬寅': 'Ren-Yin (壬寅)',
  '癸卯': 'Gui-Mao (癸卯)',
  '甲辰': 'Jia-Chen (甲辰)',
  '乙巳': 'Yi-Si (乙巳)',
  '丙午': 'Bing-Wu (丙午)',
  '丁未': 'Ding-Wei (丁未)',
  '戊申': 'Wu-Shen (戊申)',
  '己酉': 'Ji-You (己酉)',
  '庚戌': 'Geng-Xu (庚戌)',
  '辛亥': 'Xin-Hai (辛亥)',
  '壬子': 'Ren-Zi (壬子)',
  '癸丑': 'Gui-Chou (癸丑)',
  '甲寅': 'Jia-Yin (甲寅)',
  '乙卯': 'Yi-Mao (乙卯)',
  '丙辰': 'Bing-Chen (丙辰)',
  '丁巳': 'Ding-Si (丁巳)',
  '戊午': 'Wu-Wu (戊午)',
  '己未': 'Ji-Wei (己未)',
  '庚申': 'Geng-Shen (庚申)',
  '辛酉': 'Xin-You (辛酉)',
  '壬戌': 'Ren-Xu (壬戌)',
  '癸亥': 'Gui-Hai (癸亥)',
};

/**
 * Translate Chinese characters in reading content to English
 * Keeps original Chinese in parentheses for reference
 */
export function translateReadingContent(content: string, language: string = 'en'): string {
  if (language === 'zh') {
    return content; // No translation needed for Chinese
  }

  let translated = content;

  // First, replace two-character pillars (stem+branch combinations)
  for (const [chinese, english] of Object.entries(PILLARS)) {
    translated = translated.replace(new RegExp(chinese, 'g'), english);
  }

  // Then replace individual branches that weren't part of pillars
  for (const [chinese, english] of Object.entries(BRANCHES)) {
    translated = translated.replace(new RegExp(chinese, 'g'), english);
  }

  // Finally replace any remaining stems
  for (const [chinese, english] of Object.entries(STEMS)) {
    translated = translated.replace(new RegExp(chinese, 'g'), english);
  }

  return translated;
}

/**
 * Translate a single pillar (e.g., "辛卯" -> "Xin-Mao (辛卯)")
 */
export function translatePillar(pillar: string | null): string {
  if (!pillar) return '—';
  return PILLARS[pillar] || pillar;
}

/**
 * Translate a single Heavenly Stem (e.g., "甲" -> "Jia-Wood (甲)")
 */
export function translateStem(stem: string | null): string {
  if (!stem) return '—';
  return STEMS[stem] || stem;
}

/**
 * Translate a single Earthly Branch (e.g., "子" -> "Rat (子)")
 */
export function translateBranch(branch: string | null): string {
  if (!branch) return '—';
  return BRANCHES[branch] || branch;
}

/**
 * Extract lucky hours from reading content
 * Returns array of { animal, time, chinese } sorted by time of day
 */
export function extractLuckyHours(content: string): Array<{ animal: string; time: string; chinese: string }> {
  const found: Array<{ animal: string; time: string; chinese: string; order: number }> = [];
  const seen = new Set<string>();

  // Look for branch characters in the content
  for (const [chinese, info] of Object.entries(BRANCH_TIMES)) {
    if (content.includes(chinese) && !seen.has(chinese)) {
      seen.add(chinese);
      found.push({
        animal: info.animal,
        time: info.time,
        chinese,
        order: info.order,
      });
    }
  }

  // Sort by time of day order
  found.sort((a, b) => a.order - b.order);

  return found.map(({ animal, time, chinese }) => ({ animal, time, chinese }));
}
