/**
 * Family API functions
 * Handles family member CRUD and compatibility/family readings
 *
 * NOTE: Uses local storage until backend endpoints are implemented.
 * Set USE_MOCK_DATA = false once backend is ready.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, ApiError } from './client';
import {
  FamilyMember,
  CreateFamilyMemberRequest,
  UpdateFamilyMemberRequest,
  CompatibilityReading,
  FamilyReading,
} from '../types';
import { calculateFourPillars, calculateCompatibility, CompatibilityResult } from '../utils/baziCalculator';

// Toggle this to false once backend is implemented
const USE_MOCK_DATA = true;

const STORAGE_KEY = '@bazi_family_members';

// Relationship type limits
const RELATIONSHIP_LIMITS = {
  spouse_partner: 1,  // Combined: either 1 spouse OR 1 partner
  child: 7,
  parent: 2,
  grandparent: 4,
  sibling: 6,
  friend: 20,
  other: 20,
};

export interface RelationshipLimits {
  limits: Record<string, number>;
  counts: Record<string, number>;
  can_add: Record<string, boolean>;
  spouse_partner_combined: number;
}

// ============== Local Storage Helpers ==============

async function getStoredMembers(userId: number): Promise<FamilyMember[]> {
  try {
    const data = await AsyncStorage.getItem(`${STORAGE_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function saveMembers(userId: number, members: FamilyMember[]): Promise<void> {
  await AsyncStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(members));
}

// Generate pillars based on birth date and time using real BaZi calculation
function generatePillars(birthDate: string, birthTime?: string): Partial<FamilyMember> {
  const pillars = calculateFourPillars(birthDate, birthTime);

  return {
    year_pillar: pillars.yearPillar,
    month_pillar: pillars.monthPillar,
    day_pillar: pillars.dayPillar,
    hour_pillar: pillars.hourPillar,
    day_master: pillars.dayMaster,
    day_master_element: pillars.dayMasterElement,
    day_master_polarity: pillars.dayMasterPolarity,
  };
}

// ============== Family Member CRUD ==============

/**
 * Get all family members for a user
 * @param userId - User ID
 */
export async function getFamilyMembers(userId: number): Promise<FamilyMember[]> {
  if (USE_MOCK_DATA) {
    return getStoredMembers(userId);
  }

  try {
    return await apiClient.get<FamilyMember[]>(`/users/${userId}/family`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return [];
    }
    throw error;
  }
}

/**
 * Add a family member
 * @param userId - User ID
 * @param data - Family member data
 */
export async function addFamilyMember(
  userId: number,
  data: CreateFamilyMemberRequest
): Promise<FamilyMember> {
  if (USE_MOCK_DATA) {
    const members = await getStoredMembers(userId);

    // Generate a unique ID
    const maxId = members.reduce((max, m) => Math.max(max, m.id), 0);

    const newMember: FamilyMember = {
      id: maxId + 1,
      user_id: userId,
      ...data,
      ...generatePillars(data.birth_date, data.birth_time),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    members.push(newMember);
    await saveMembers(userId, members);

    return newMember;
  }

  return apiClient.post<FamilyMember>(`/users/${userId}/family`, data);
}

/**
 * Get a specific family member
 * @param userId - User ID
 * @param memberId - Family member ID
 */
export async function getFamilyMember(
  userId: number,
  memberId: number
): Promise<FamilyMember> {
  if (USE_MOCK_DATA) {
    const members = await getStoredMembers(userId);
    const member = members.find(m => m.id === memberId);
    if (!member) {
      throw new ApiError('Family member not found', 404);
    }
    return member;
  }

  return apiClient.get<FamilyMember>(`/users/${userId}/family/${memberId}`);
}

/**
 * Update a family member
 * @param userId - User ID
 * @param memberId - Family member ID
 * @param data - Updated data
 */
export async function updateFamilyMember(
  userId: number,
  memberId: number,
  data: UpdateFamilyMemberRequest
): Promise<FamilyMember> {
  if (USE_MOCK_DATA) {
    const members = await getStoredMembers(userId);
    const index = members.findIndex(m => m.id === memberId);
    if (index === -1) {
      throw new ApiError('Family member not found', 404);
    }

    // If birth date or time changed, regenerate pillars
    const updatedPillars = (data.birth_date || data.birth_time)
      ? generatePillars(
          data.birth_date || members[index].birth_date,
          data.birth_time || members[index].birth_time
        )
      : {};

    members[index] = {
      ...members[index],
      ...data,
      ...updatedPillars,
      updated_at: new Date().toISOString(),
    };

    await saveMembers(userId, members);
    return members[index];
  }

  return apiClient.patch<FamilyMember>(`/users/${userId}/family/${memberId}`, data);
}

/**
 * Delete a family member
 * @param userId - User ID
 * @param memberId - Family member ID
 */
export async function deleteFamilyMember(
  userId: number,
  memberId: number
): Promise<void> {
  if (USE_MOCK_DATA) {
    const members = await getStoredMembers(userId);
    const filtered = members.filter(m => m.id !== memberId);
    await saveMembers(userId, filtered);
    return;
  }

  return apiClient.delete(`/users/${userId}/family/${memberId}`);
}

// ============== Readings ==============

// User pillar data for compatibility calculation
interface UserPillars {
  day_master?: string | null;
  day_master_element?: string | null;
  year_pillar?: string | null;
  day_pillar?: string | null;
}

/**
 * Get compatibility reading between user and a family member
 * @param userId - User ID
 * @param memberId - Family member ID
 * @param userPillars - User's pillar data (required for mock mode to calculate real compatibility)
 */
export async function getCompatibilityReading(
  userId: number,
  memberId: number,
  userPillars?: UserPillars
): Promise<CompatibilityReading> {
  if (USE_MOCK_DATA) {
    const members = await getStoredMembers(userId);
    const member = members.find(m => m.id === memberId);

    if (!member) {
      throw new ApiError('Family member not found', 404);
    }

    // Calculate real compatibility score based on Four Pillars
    const compatibility = calculateCompatibility(
      {
        dayMaster: userPillars?.day_master,
        dayMasterElement: userPillars?.day_master_element,
        yearPillar: userPillars?.year_pillar,
        dayPillar: userPillars?.day_pillar,
      },
      {
        dayMaster: member.day_master,
        dayMasterElement: member.day_master_element,
        yearPillar: member.year_pillar,
        dayPillar: member.day_pillar,
      }
    );

    return {
      user_id: userId,
      partner_id: memberId,
      partner_name: member.name,
      relationship: member.relationship,
      compatibility_score: compatibility.score,
      content: generateMockCompatibilityContent(member, compatibility),
      generated_at: new Date().toISOString(),
    };
  }

  return apiClient.get<CompatibilityReading>(`/compatibility/${userId}/${memberId}`);
}

/**
 * Get full family reading for a user
 * @param userId - User ID
 */
export async function getFamilyReading(userId: number): Promise<FamilyReading> {
  if (USE_MOCK_DATA) {
    const members = await getStoredMembers(userId);

    if (members.length < 2) {
      throw new ApiError('Need at least 2 family members for a family reading', 400);
    }

    return {
      user_id: userId,
      members: members.map(m => ({
        id: m.id,
        name: m.name,
        relationship: m.relationship,
      })),
      content: generateMockFamilyContent(members),
      generated_at: new Date().toISOString(),
    };
  }

  return apiClient.get<FamilyReading>(`/family-reading/${userId}`);
}

// ============== Mock Content Generators ==============

function generateMockCompatibilityContent(member: FamilyMember, compatibility: CompatibilityResult): string {
  const relationship = member.relationship;
  const element = member.day_master_element || 'Earth';
  const score = compatibility.score;

  // More honest intro based on actual score
  let intro: string;
  if (score >= 80) {
    intro = relationship === 'spouse'
      ? `Your relationship with ${member.name} shows excellent elemental harmony. Your charts naturally support each other.`
      : relationship === 'child'
      ? `You and ${member.name} share a naturally supportive elemental connection.`
      : `Your bond with ${member.name} is strengthened by harmonious elemental flow.`;
  } else if (score >= 65) {
    intro = relationship === 'spouse'
      ? `Your relationship with ${member.name} shows good compatibility with room for growth.`
      : relationship === 'child'
      ? `Your elemental relationship with ${member.name} has solid foundations with some areas to nurture.`
      : `Your connection with ${member.name} is generally supportive with some dynamic tensions.`;
  } else if (score >= 50) {
    intro = relationship === 'spouse'
      ? `Your relationship with ${member.name} has moderate elemental compatibility. Understanding your differences is key.`
      : relationship === 'child'
      ? `Your elemental dynamics with ${member.name} require conscious effort to harmonize.`
      : `Your connection with ${member.name} involves balancing contrasting elemental energies.`;
  } else {
    intro = relationship === 'spouse'
      ? `Your relationship with ${member.name} faces elemental challenges. This doesn't mean incompatibility—it means more conscious effort is needed.`
      : relationship === 'child'
      ? `Your elemental dynamics with ${member.name} present real challenges that require patience and understanding.`
      : `Your connection with ${member.name} involves significant elemental tensions that need mindful navigation.`;
  }

  // Day Master relationship analysis - more direct
  let dayMasterDesc: string;
  if (score >= 80) {
    dayMasterDesc = `complements your elemental nature beautifully, creating natural support and understanding`;
  } else if (score >= 65) {
    dayMasterDesc = `creates a balanced dynamic with your elements, though some adjustment is needed`;
  } else if (score >= 50) {
    dayMasterDesc = `differs significantly from your elemental nature, requiring mutual adaptation`;
  } else {
    dayMasterDesc = `creates friction with your elemental nature—this is a real challenge that demands patience`;
  }

  const dayMasterAnalysis = `**Day Master Connection:** ${compatibility.dayMasterCompatibility}\n\n${member.name}'s Day Master is ${element}, which ${dayMasterDesc}.`;

  // Year branch (animal sign) analysis
  const yearBranchAnalysis = compatibility.yearBranchRelation !== 'Neutral'
    ? `**Animal Sign Relationship:** ${compatibility.yearBranchRelation}`
    : '';

  // More specific advice based on score
  let advice: string;
  if (score >= 65) {
    advice = relationship === 'spouse'
      ? '\n\n**Guidance:** Focus on nurturing the productive cycles between your elements. Schedule quality time during hours that favor both your Day Masters.'
      : relationship === 'child'
      ? '\n\n**Guidance:** Support their natural elemental tendencies while providing structure through your complementary energy.'
      : '\n\n**Guidance:** Honor the wisdom they bring while recognizing how your elements have shaped your journey together.';
  } else {
    // Advice for challenging relationships
    advice = relationship === 'spouse'
      ? '\n\n**Guidance:** Your elemental clash requires extra patience. Avoid major discussions during hours that strengthen the controlling element. Find activities that bring in balancing elements (like Water activities if Fire-Metal clash). Communication and timing are crucial.'
      : relationship === 'child'
      ? '\n\n**Guidance:** Your child\'s elemental nature may feel at odds with yours. Rather than trying to change them, focus on understanding their perspective. Introduce bridging elements through activities and environment.'
      : '\n\n**Guidance:** Respect the generational and elemental differences. Some tension is natural—focus on the wisdom exchange rather than forcing harmony.';
  }

  const parts = [intro, dayMasterAnalysis];
  if (yearBranchAnalysis) parts.push(yearBranchAnalysis);
  parts.push(advice);
  parts.push('\nThis reading is based on the interaction between your Four Pillars and provides guidance for strengthening your bond.');

  return parts.join('\n\n');
}

function generateMockFamilyContent(members: FamilyMember[]): string {
  const elements = members
    .map(m => m.day_master_element)
    .filter(Boolean);

  const uniqueElements = [...new Set(elements)];

  const intro = `Your family of ${members.length + 1} members (including yourself) creates a unique elemental ecosystem.`;

  const elementBalance = uniqueElements.length >= 4
    ? 'Your family has excellent elemental diversity, with representation across most of the five elements. This creates natural balance and mutual support.'
    : uniqueElements.length >= 2
    ? 'Your family has moderate elemental diversity. Focus on activities that bring in the missing elements to create greater harmony.'
    : 'Your family shares similar elemental energy, which creates strong understanding but may benefit from introducing complementary influences.';

  const dynamics = `Family members: ${members.map(m => `${m.name} (${m.relationship}, ${m.day_master_element || 'Unknown'} element)`).join(', ')}.`;

  const advice = `
**Strengthening Family Bonds:**
- Schedule family activities during hours that balance your collective elements
- Be mindful of elemental clashes during stressful periods
- Use each member's strengths to support others' challenges
- Celebrate the unique perspective each element brings to family decisions

**Growth Opportunities:**
Your family's elemental composition suggests focusing on ${uniqueElements.includes('Water') ? 'communication and flexibility' : 'grounding and stability'} as key themes for collective growth.`;

  return `${intro}\n\n${elementBalance}\n\n${dynamics}\n${advice}`;
}

// ============== Compatibility Forecasts ==============

export interface CompatibilityForecast {
  userId: number;
  memberId: number;
  memberName: string;
  period: 'weekly' | 'monthly' | 'yearly';
  periodLabel: string;
  currentScore: number;
  trend: 'improving' | 'stable' | 'declining';
  overview: string;
  keyDates: Array<{
    date: string;
    type: 'favorable' | 'challenging';
    description: string;
  }>;
  guidance: string;
  generatedAt: string;
}

/**
 * Get time-based compatibility forecast
 * Shows how compatibility changes based on transiting pillars
 */
export async function getCompatibilityForecast(
  userId: number,
  memberId: number,
  period: 'weekly' | 'monthly' | 'yearly',
  userPillars?: UserPillars
): Promise<CompatibilityForecast> {
  if (USE_MOCK_DATA) {
    const members = await getStoredMembers(userId);
    const member = members.find(m => m.id === memberId);

    if (!member) {
      throw new ApiError('Family member not found', 404);
    }

    // Calculate base compatibility
    const baseCompatibility = calculateCompatibility(
      {
        dayMaster: userPillars?.day_master,
        dayMasterElement: userPillars?.day_master_element,
        yearPillar: userPillars?.year_pillar,
        dayPillar: userPillars?.day_pillar,
      },
      {
        dayMaster: member.day_master,
        dayMasterElement: member.day_master_element,
        yearPillar: member.year_pillar,
        dayPillar: member.day_pillar,
      }
    );

    // Generate forecast based on period
    return generateCompatibilityForecast(member, period, baseCompatibility);
  }

  return apiClient.get<CompatibilityForecast>(
    `/compatibility/${userId}/${memberId}/forecast/${period}`
  );
}

function generateCompatibilityForecast(
  member: FamilyMember,
  period: 'weekly' | 'monthly' | 'yearly',
  baseCompatibility: CompatibilityResult
): CompatibilityForecast {
  const now = new Date();
  const memberElement = member.day_master_element || 'Earth';

  // Calculate period-specific pillar influence
  // This simulates how the current/upcoming pillars affect the relationship
  const { periodLabel, keyDates, trend, scoreModifier } = generatePeriodData(period, memberElement, now);

  // Adjust score based on current period energies
  const currentScore = Math.max(30, Math.min(98, baseCompatibility.score + scoreModifier));

  // Generate period-specific overview
  const overview = generatePeriodOverview(period, member, baseCompatibility, trend);

  // Generate guidance
  const guidance = generatePeriodGuidance(period, member, baseCompatibility, trend);

  return {
    userId: member.user_id,
    memberId: member.id,
    memberName: member.name,
    period,
    periodLabel,
    currentScore,
    trend,
    overview,
    keyDates,
    guidance,
    generatedAt: now.toISOString(),
  };
}

function generatePeriodData(
  period: 'weekly' | 'monthly' | 'yearly',
  memberElement: string,
  now: Date
): {
  periodLabel: string;
  keyDates: CompatibilityForecast['keyDates'];
  trend: 'improving' | 'stable' | 'declining';
  scoreModifier: number;
} {
  const month = now.getMonth();
  const year = now.getFullYear();

  // Simplified element cycle for the current period
  // In reality, this would use actual pillar calculations
  const monthElements = ['Water', 'Water', 'Wood', 'Wood', 'Wood', 'Fire', 'Fire', 'Fire', 'Earth', 'Metal', 'Metal', 'Water'];
  const currentElement = monthElements[month];

  // Determine trend based on element interaction
  const PRODUCTIVE = { Wood: 'Fire', Fire: 'Earth', Earth: 'Metal', Metal: 'Water', Water: 'Wood' };
  const CONTROLLING = { Wood: 'Earth', Earth: 'Water', Water: 'Fire', Fire: 'Metal', Metal: 'Wood' };

  let trend: 'improving' | 'stable' | 'declining';
  let scoreModifier: number;

  if (PRODUCTIVE[currentElement as keyof typeof PRODUCTIVE] === memberElement) {
    trend = 'improving';
    scoreModifier = 8;
  } else if (CONTROLLING[currentElement as keyof typeof CONTROLLING] === memberElement) {
    trend = 'declining';
    scoreModifier = -6;
  } else if (currentElement === memberElement) {
    trend = 'stable';
    scoreModifier = 3;
  } else {
    trend = 'stable';
    scoreModifier = 0;
  }

  // Generate period label and key dates
  let periodLabel: string;
  let keyDates: CompatibilityForecast['keyDates'] = [];

  if (period === 'weekly') {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    periodLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    // Add a few key days this week
    const favorableDay = new Date(weekStart);
    favorableDay.setDate(weekStart.getDate() + 2);
    const challengingDay = new Date(weekStart);
    challengingDay.setDate(weekStart.getDate() + 5);

    keyDates = [
      {
        date: favorableDay.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        type: 'favorable',
        description: `${currentElement} energy supports open communication and understanding.`,
      },
      {
        date: challengingDay.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        type: 'challenging',
        description: 'Elemental tensions may surface. Give each other space if needed.',
      },
    ];

  } else if (period === 'monthly') {
    periodLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Key weeks/periods in the month
    keyDates = [
      {
        date: '1st - 7th',
        type: trend === 'declining' ? 'challenging' : 'favorable',
        description: trend === 'declining'
          ? 'Month begins with some friction. Take things slowly.'
          : 'Strong start to the month for your connection.',
      },
      {
        date: '15th - 21st',
        type: 'favorable',
        description: 'Mid-month brings balanced energy. Good time for important conversations.',
      },
      {
        date: '22nd - end',
        type: trend === 'improving' ? 'favorable' : 'challenging',
        description: trend === 'improving'
          ? 'Month ends on a high note. Plan something special.'
          : 'Month may end with minor tensions. Practice patience.',
      },
    ];

  } else { // yearly
    periodLabel = `Year of ${year}`;

    // Quarterly outlook
    keyDates = [
      {
        date: 'Q1 (Jan-Mar)',
        type: 'favorable',
        description: 'Spring energy supports new beginnings together.',
      },
      {
        date: 'Q2 (Apr-Jun)',
        type: scoreModifier > 0 ? 'favorable' : 'challenging',
        description: scoreModifier > 0
          ? 'Summer brings warmth to your relationship.'
          : 'Summer may test your patience. Stay cool.',
      },
      {
        date: 'Q3 (Jul-Sep)',
        type: 'favorable',
        description: 'Harvest season rewards your efforts in the relationship.',
      },
      {
        date: 'Q4 (Oct-Dec)',
        type: trend === 'declining' ? 'challenging' : 'favorable',
        description: trend === 'declining'
          ? 'Year-end may bring up unresolved tensions. Address them openly.'
          : 'Year ends with strong connection. Celebrate together.',
      },
    ];
  }

  return { periodLabel, keyDates, trend, scoreModifier };
}

function generatePeriodOverview(
  period: 'weekly' | 'monthly' | 'yearly',
  member: FamilyMember,
  compatibility: CompatibilityResult,
  trend: 'improving' | 'stable' | 'declining'
): string {
  const timeFrame = period === 'weekly' ? 'this week' : period === 'monthly' ? 'this month' : 'this year';
  const memberElement = member.day_master_element || 'Earth';

  if (trend === 'improving') {
    return `Your compatibility with ${member.name} is strengthening ${timeFrame}. The current ${memberElement} energies in your combined charts are flowing harmoniously, creating opportunities for deeper connection and understanding. ${compatibility.dayMasterCompatibility}. This is an excellent time for meaningful conversations, shared activities, and building stronger bonds.`;
  } else if (trend === 'declining') {
    return `${timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)} brings some elemental friction between you and ${member.name}. The transiting energies may clash with ${member.name}'s ${memberElement} Day Master, potentially causing misunderstandings or tension. ${compatibility.dayMasterCompatibility}. Awareness of this dynamic helps you navigate challenges with patience and compassion.`;
  } else {
    return `Your connection with ${member.name} remains steady ${timeFrame}. The current energies neither significantly boost nor challenge your natural compatibility. ${compatibility.dayMasterCompatibility}. Use this stable period to maintain your bond through consistent, quality time together.`;
  }
}

function generatePeriodGuidance(
  period: 'weekly' | 'monthly' | 'yearly',
  member: FamilyMember,
  compatibility: CompatibilityResult,
  trend: 'improving' | 'stable' | 'declining'
): string {
  const relationship = member.relationship;
  const memberElement = member.day_master_element || 'Earth';

  // Element-specific advice
  const elementAdvice: Record<string, string> = {
    Wood: 'activities in nature, creative projects, or morning conversations',
    Fire: 'social outings, celebrations, or heartfelt expressions of appreciation',
    Earth: 'home-based activities, cooking together, or grounding routines',
    Metal: 'organized activities, goal-setting, or quiet quality time',
    Water: 'deep conversations, relaxation, or flowing with spontaneous plans',
  };

  const activity = elementAdvice[memberElement] || 'quality time together';

  if (trend === 'improving') {
    return relationship === 'spouse'
      ? `Lean into this positive energy with ${activity}. Your bond with ${member.name} has extra support right now—use it to address any lingering issues or simply enjoy each other's company more deeply.`
      : relationship === 'child'
      ? `This is an excellent time to connect with ${member.name} through ${activity}. They'll be more receptive to your guidance and support.`
      : `Honor this harmonious period with ${member.name} through ${activity}. Share gratitude for their presence in your life.`;
  } else if (trend === 'declining') {
    return relationship === 'spouse'
      ? `During this challenging period, avoid forcing major decisions with ${member.name}. Focus on ${activity} to ease tensions. Remember that this is temporary—your fundamental compatibility remains ${compatibility.overallHarmony.toLowerCase()}.`
      : relationship === 'child'
      ? `Be extra patient with ${member.name} during this time. Their elemental nature may clash with current energies. Support them through ${activity} rather than pushing for change.`
      : `Give ${member.name} some extra grace. Elemental tensions are temporary. Maintain connection through low-pressure ${activity}.`;
  } else {
    return relationship === 'spouse'
      ? `Maintain your bond with ${member.name} through consistent ${activity}. Stable periods are ideal for nurturing your everyday connection without external pressure.`
      : relationship === 'child'
      ? `Use this balanced time to strengthen your bond with ${member.name} through ${activity}. Small, consistent moments build lasting connection.`
      : `Appreciate the steady energy with ${member.name}. Connect through ${activity} and maintain your supportive presence.`;
  }
}

// ============== Relationship Limits ==============

/**
 * Get relationship limits and current counts for a user
 * Useful for frontend to show what can still be added
 */
export async function getRelationshipLimits(userId: number): Promise<RelationshipLimits> {
  if (USE_MOCK_DATA) {
    const members = await getStoredMembers(userId);

    // Count each type
    const counts: Record<string, number> = {
      spouse: 0,
      partner: 0,
      child: 0,
      parent: 0,
      grandparent: 0,
      sibling: 0,
      friend: 0,
      other: 0,
    };

    for (const member of members) {
      if (counts[member.relationship] !== undefined) {
        counts[member.relationship]++;
      }
    }

    // Calculate spouse/partner combined
    const spousePartnerCombined = counts.spouse + counts.partner;

    // Build can_add map
    const can_add: Record<string, boolean> = {
      spouse: spousePartnerCombined < RELATIONSHIP_LIMITS.spouse_partner,
      partner: spousePartnerCombined < RELATIONSHIP_LIMITS.spouse_partner,
      child: counts.child < RELATIONSHIP_LIMITS.child,
      parent: counts.parent < RELATIONSHIP_LIMITS.parent,
      grandparent: counts.grandparent < RELATIONSHIP_LIMITS.grandparent,
      sibling: counts.sibling < RELATIONSHIP_LIMITS.sibling,
      friend: counts.friend < RELATIONSHIP_LIMITS.friend,
      other: counts.other < RELATIONSHIP_LIMITS.other,
    };

    return {
      limits: {
        spouse: RELATIONSHIP_LIMITS.spouse_partner,
        partner: RELATIONSHIP_LIMITS.spouse_partner,
        child: RELATIONSHIP_LIMITS.child,
        parent: RELATIONSHIP_LIMITS.parent,
        grandparent: RELATIONSHIP_LIMITS.grandparent,
        sibling: RELATIONSHIP_LIMITS.sibling,
        friend: RELATIONSHIP_LIMITS.friend,
        other: RELATIONSHIP_LIMITS.other,
      },
      counts,
      can_add,
      spouse_partner_combined: spousePartnerCombined,
    };
  }

  return apiClient.get<RelationshipLimits>(`/api/relationship-limits?user_id=${userId}`);
}
