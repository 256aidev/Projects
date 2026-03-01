/**
 * Type definitions for BaZi Mobile App
 */

// ============== User Types ==============

export interface User {
  id: number;
  name: string;
  email: string | null;
  birth_date: string;
  birth_time: string;
  birth_location: string | null;
  year_pillar: string | null;
  month_pillar: string | null;
  day_pillar: string | null;
  hour_pillar: string | null;
  day_master: string | null;
  day_master_element: string | null;
  day_master_polarity: string | null;
  year_ten_god: string | null;
  month_ten_god: string | null;
  hour_ten_god: string | null;
  preferred_tone: string;
  language: string;
  auth_provider: string;
}

export interface UserUpdateRequest {
  name?: string;
  birth_date?: string;
  birth_time?: string;
  birth_location?: string;
  preferred_tone?: 'mystical' | 'balanced' | 'practical';
  language?: 'en' | 'zh';
}

// ============== Auth Types ==============

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  birth_date: string;
  birth_time: string;
  birth_longitude?: number;
  birth_latitude?: number;
  birth_location?: string;
  preferred_tone?: string;
  language?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SocialLoginRequest {
  provider: 'google' | 'apple';
  token: string;
  name?: string;
  birth_date?: string;
  birth_time?: string;
  birth_longitude?: number;
  birth_latitude?: number;
  birth_location?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  needs_onboarding: boolean;
}

// Alias for backward compatibility
export type AuthResponse = TokenResponse;

// ============== Reading Types ==============

export interface DailyReading {
  user_id: number;
  user_name: string;
  date: string;
  daily_pillar: string | null;
  daily_element: string | null;
  content: string;
  language: string;
  template_id: string | null;
  generation_method: string | null;
  generated_at: string;
}

export interface WeeklyReading {
  user_id: number;
  user_name: string;
  week_start: string;
  week_end: string;
  content: string;
  language: string;
  llm_provider: string | null;
  generated_at: string;
}

export interface PillarInfo {
  date: string;
  pillar: string;
  stem: string;
  branch: string;
  element: string;
  polarity: string;
}

// ============== App State Types ==============

export type ConnectionStatus = 'untested' | 'testing' | 'success' | 'failed';

export type QueryLevel = 'PATIENT' | 'STUDY' | 'SERIES';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
}

// ============== Element Types ==============

export type Element = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';
export type Polarity = 'Yang' | 'Yin';

export interface ElementInfo {
  name: Element;
  chinese: string;
  color: string;
  season: string;
  direction: string;
}

export const ELEMENTS: Record<Element, ElementInfo> = {
  Wood: { name: 'Wood', chinese: '木', color: '#22c55e', season: 'Spring', direction: 'East' },
  Fire: { name: 'Fire', chinese: '火', color: '#ef4444', season: 'Summer', direction: 'South' },
  Earth: { name: 'Earth', chinese: '土', color: '#eab308', season: 'Late Summer', direction: 'Center' },
  Metal: { name: 'Metal', chinese: '金', color: '#94a3b8', season: 'Autumn', direction: 'West' },
  Water: { name: 'Water', chinese: '水', color: '#3b82f6', season: 'Winter', direction: 'North' },
};

// ============== Family Types ==============
// Re-export all family-related types
export * from './family';

// ============== Purchase Types ==============
export * from './purchases';

// ============== Achievement Types ==============
export * from './achievements';

// ============== Reward Types ==============
export * from './rewards';
