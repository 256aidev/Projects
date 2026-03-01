/**
 * Forecasts API
 * Weekly, monthly and yearly forecast endpoints (mock data for now)
 */

import { apiClient } from './client';

// Toggle this when backend is implemented
const USE_MOCK_DATA = true;

// Weekly Forecast Types
export interface WeeklyForecast {
  userId: number;
  weekStartDate: string;
  weekEndDate: string;
  overview: string;
  dailyHighlights: DailyHighlight[];
  weeklyTheme: string;
  luckyDays: string[];
  challengingDays: string[];
  advice: string;
  // Premium: Four Pillars weekly analysis
  fourPillarsAnalysis?: FourPillarsWeekly;
}

export interface DailyHighlight {
  date: string;
  dayName: string;
  pillar: string;
  element: string;
  theme: string;
  rating: number; // 1-5
  tip: string;
}

export interface FourPillarsWeekly {
  yearPillar: PillarWeeklyInfluence;
  monthPillar: PillarWeeklyInfluence;
  dayPillar: PillarWeeklyInfluence;
  hourPillar: PillarWeeklyInfluence;
}

export interface PillarWeeklyInfluence {
  pillarName: string;
  influence: string;
  supportiveDays: string[];
  advice: string;
}

export interface MonthlyForecast {
  userId: number;
  month: string;
  year: number;
  overview: string;
  weeklyHighlights: WeekHighlight[];
  keyDates: KeyDate[];
  advice: string;
  luckyElements: string[];
  challengingElements: string[];
}

export interface WeekHighlight {
  weekNumber: number;
  dateRange: string;
  theme: string;
  description: string;
}

export interface KeyDate {
  date: string;
  significance: string;
  recommendation: string;
}

export interface YearlyForecast {
  userId: number;
  year: number;
  overview: string;
  monthlyOutlook: MonthOutlook[];
  yearlyThemes: string[];
  opportunities: string[];
  challenges: string[];
  advice: string;
}

export interface MonthOutlook {
  month: string;
  monthNumber: number;
  theme: string;
  rating: number; // 1-5
  keyFocus: string;
}

// Mock data generators
function generateMockMonthlyForecast(userId: number): MonthlyForecast {
  const now = new Date();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonth = monthNames[now.getMonth()];

  return {
    userId,
    month: currentMonth,
    year: now.getFullYear(),
    overview: `This ${currentMonth} brings a powerful combination of energies that align well with your Day Master. The month's pillar creates favorable conditions for personal growth and professional advancement. You may find that communication flows more easily, and creative endeavors receive positive support from the cosmic energies.`,
    weeklyHighlights: [
      {
        weekNumber: 1,
        dateRange: '1st - 7th',
        theme: 'New Beginnings',
        description: 'The first week is ideal for starting new projects. Your energy levels are high, and others are more receptive to your ideas.',
      },
      {
        weekNumber: 2,
        dateRange: '8th - 14th',
        theme: 'Collaboration',
        description: 'Focus on partnerships and teamwork. This is an excellent time to reach out to mentors or form new alliances.',
      },
      {
        weekNumber: 3,
        dateRange: '15th - 21st',
        theme: 'Reflection',
        description: 'A period for introspection. Review your progress and make adjustments to your plans as needed.',
      },
      {
        weekNumber: 4,
        dateRange: '22nd - End',
        theme: 'Manifestation',
        description: 'Your efforts from the month start to bear fruit. Stay focused and persistent in your endeavors.',
      },
    ],
    keyDates: [
      {
        date: `${currentMonth} 5`,
        significance: 'Peak Energy Day',
        recommendation: 'Ideal for important meetings or decisions',
      },
      {
        date: `${currentMonth} 12`,
        significance: 'Creative Surge',
        recommendation: 'Best time for artistic or innovative pursuits',
      },
      {
        date: `${currentMonth} 20`,
        significance: 'Relationship Focus',
        recommendation: 'Nurture important personal connections',
      },
    ],
    advice: 'This month, focus on maintaining balance between action and rest. Your natural tendencies may push you towards overcommitment - practice saying no when necessary. Trust your intuition, especially in matters involving finances or career decisions.',
    luckyElements: ['Wood', 'Fire'],
    challengingElements: ['Metal'],
  };
}

function generateMockYearlyForecast(userId: number): YearlyForecast {
  const year = new Date().getFullYear();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return {
    userId,
    year,
    overview: `${year} is a year of transformation and growth for your chart. The year's pillar brings supportive energies that encourage personal development and the pursuit of long-held goals. This is particularly favorable for those seeking career advancement, educational pursuits, or significant life changes. The elemental influences suggest that relationships will play a key role in your journey this year.`,
    monthlyOutlook: monthNames.map((month, index) => ({
      month,
      monthNumber: index + 1,
      theme: getMonthlyTheme(index),
      rating: Math.floor(Math.random() * 2) + 3, // 3-5 rating
      keyFocus: getMonthlyFocus(index),
    })),
    yearlyThemes: [
      'Personal Growth & Self-Discovery',
      'Career Advancement',
      'Building Meaningful Relationships',
      'Financial Stability',
    ],
    opportunities: [
      'Leadership opportunities may arise in Q2',
      'Creative projects receive favorable energy throughout the year',
      'Travel and expansion possibilities in the latter half',
      'Learning and skill development strongly supported',
    ],
    challenges: [
      'Managing competing priorities in Q1',
      'Avoiding overcommitment during peak periods',
      'Maintaining work-life balance',
      'Navigating relationship dynamics requires patience',
    ],
    advice: `${year} calls for intentional action balanced with strategic patience. Set clear goals early in the year, but remain flexible in your approach. Your natural strengths are amplified this year - lean into them. Cultivate relationships that support your growth, and don't hesitate to seek guidance when needed. Remember that sustainable progress often comes in steady steps rather than giant leaps.`,
  };
}

function getMonthlyTheme(monthIndex: number): string {
  const themes = [
    'Fresh Starts', 'Building Momentum', 'Creative Expression',
    'Growth & Learning', 'Connection', 'Achievement',
    'Reflection', 'Transformation', 'Expansion',
    'Harvest', 'Gratitude', 'Completion'
  ];
  return themes[monthIndex];
}

function getMonthlyFocus(monthIndex: number): string {
  const focuses = [
    'Set intentions and goals', 'Execute plans with determination',
    'Express yourself authentically', 'Pursue knowledge and skills',
    'Nurture relationships', 'Celebrate accomplishments',
    'Review and adjust', 'Embrace change', 'Explore new horizons',
    'Reap rewards of your efforts', 'Appreciate your journey',
    'Close chapters and prepare for renewal'
  ];
  return focuses[monthIndex];
}

/**
 * Get monthly forecast for a user
 */
export async function getMonthlyForecast(userId: number): Promise<MonthlyForecast> {
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return generateMockMonthlyForecast(userId);
  }

  return apiClient.get<MonthlyForecast>(`/forecasts/monthly/${userId}`);
}

/**
 * Get yearly forecast for a user
 */
export async function getYearlyForecast(userId: number): Promise<YearlyForecast> {
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return generateMockYearlyForecast(userId);
  }

  return apiClient.get<YearlyForecast>(`/forecasts/yearly/${userId}`);
}

// Weekly forecast mock generator
function generateMockWeeklyForecast(userId: number, includeFourPillars: boolean): WeeklyForecast {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const elements = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
  const themes = ['Focus', 'Connection', 'Growth', 'Rest', 'Action', 'Reflection', 'Celebration'];
  const pillars = ['甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午'];

  const dailyHighlights: DailyHighlight[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    dailyHighlights.push({
      date: date.toISOString().split('T')[0],
      dayName: dayNames[i],
      pillar: pillars[i],
      element: elements[i % 5],
      theme: themes[i],
      rating: Math.floor(Math.random() * 2) + 3, // 3-5
      tip: getDailyTip(i),
    });
  }

  const forecast: WeeklyForecast = {
    userId,
    weekStartDate: startOfWeek.toISOString().split('T')[0],
    weekEndDate: endOfWeek.toISOString().split('T')[0],
    overview: 'This week brings a harmonious blend of energies that support both productivity and personal connection. The early part of the week favors planning and communication, while the latter half is ideal for taking action on your goals. Pay attention to subtle shifts in energy mid-week that may require flexibility.',
    dailyHighlights,
    weeklyTheme: 'Balance & Progress',
    luckyDays: [dayNames[2], dayNames[5]], // Tuesday, Friday
    challengingDays: [dayNames[3]], // Wednesday
    advice: 'This week, focus on maintaining equilibrium between your personal and professional life. Trust your intuition when making decisions, especially around mid-week. The weekend offers excellent opportunities for rest and rejuvenation.',
  };

  // Add Four Pillars analysis for premium users
  if (includeFourPillars) {
    forecast.fourPillarsAnalysis = {
      yearPillar: {
        pillarName: 'Year Pillar (甲辰)',
        influence: 'The Year Pillar brings steady foundation energy this week. Long-term projects receive support, and family matters may come into focus.',
        supportiveDays: ['Monday', 'Thursday'],
        advice: 'Use this week to strengthen family bonds and review annual goals.',
      },
      monthPillar: {
        pillarName: 'Month Pillar (丁丑)',
        influence: 'The Month Pillar emphasizes career and public image. Professional opportunities may present themselves unexpectedly.',
        supportiveDays: ['Tuesday', 'Friday'],
        advice: 'Network actively and be open to new professional connections.',
      },
      dayPillar: {
        pillarName: 'Day Pillar (己巳)',
        influence: 'Your Day Pillar interacts favorably with the week\'s energies, enhancing personal charisma and decision-making abilities.',
        supportiveDays: ['Wednesday', 'Saturday'],
        advice: 'Trust your instincts in personal matters and creative pursuits.',
      },
      hourPillar: {
        pillarName: 'Hour Pillar (庚申)',
        influence: 'The Hour Pillar governs your inner world this week. Meditation and self-reflection bring valuable insights.',
        supportiveDays: ['Sunday', 'Thursday'],
        advice: 'Set aside quiet time for introspection and planning.',
      },
    };
  }

  return forecast;
}

function getDailyTip(dayIndex: number): string {
  const tips = [
    'Perfect day for rest and setting intentions for the week ahead.',
    'Focus on communication and starting new projects.',
    'Ideal for creative work and collaborative efforts.',
    'Mid-week energy shift - stay flexible and patient.',
    'Great day for important meetings and decisions.',
    'Social connections are favored - reach out to others.',
    'Complete tasks and prepare for the new week.',
  ];
  return tips[dayIndex];
}

/**
 * Get weekly forecast for a user
 * @param includeFourPillars - Include Four Pillars analysis (premium feature)
 */
export async function getWeeklyForecast(
  userId: number,
  includeFourPillars: boolean = false
): Promise<WeeklyForecast> {
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return generateMockWeeklyForecast(userId, includeFourPillars);
  }

  const endpoint = includeFourPillars
    ? `/forecasts/weekly/${userId}?pillars=true`
    : `/forecasts/weekly/${userId}`;
  return apiClient.get<WeeklyForecast>(endpoint);
}
