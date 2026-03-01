/**
 * Family member and compatibility types
 */

// ============== Family Member Types ==============

export type FamilyRelationship = 'spouse' | 'partner' | 'child' | 'parent' | 'sibling' | 'friend' | 'grandparent';

export interface FamilyMember {
  id: number;
  user_id: number;
  relationship: FamilyRelationship;
  name: string;
  birth_date: string;
  birth_time: string;
  birth_location?: string;
  // Calculated pillars (from backend)
  year_pillar?: string;
  month_pillar?: string;
  day_pillar?: string;
  hour_pillar?: string;
  day_master?: string;
  day_master_element?: string;
  day_master_polarity?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFamilyMemberRequest {
  relationship: FamilyRelationship;
  name: string;
  birth_date: string;
  birth_time: string;
  birth_location?: string;
}

export interface UpdateFamilyMemberRequest {
  name?: string;
  birth_date?: string;
  birth_time?: string;
  birth_location?: string;
}

// ============== Compatibility Types ==============

export interface CompatibilityReading {
  user_id: number;
  partner_id: number;
  partner_name: string;
  relationship: string;
  // Legacy single score (deprecated)
  compatibility_score?: number;
  // New Ease × Durability scores
  ease_score?: number;
  durability_score?: number;
  display_ease?: number;
  display_durability?: number;
  // Effort-based labels (user-facing)
  effort_label?: string;
  effort_framing?: string;
  quadrant_interpretation?: string;
  // Additional metadata
  toxicity_index?: number;
  toxicity_level?: string;
  confidence_percent?: number;
  confidence_level?: string;
  strengths?: string[];
  watchouts?: string[];
  ten_god_role?: string;
  ten_god_interpretation?: string;
  // Content
  content: string;
  generated_at: string;
}

// Daily relationship reading for "Today's Relationship Focus"
export interface DailyRelationshipReading {
  user_id: number;
  partner_id: number;
  date: string;
  content: string;
  generated_at: string;
}

// ============== Family Reading Types ==============

export interface FamilyMemberSummary {
  id: number;
  name: string;
  relationship: string;
}

export interface FamilyReading {
  user_id: number;
  members: FamilyMemberSummary[];
  content: string;
  generated_at: string;
}
