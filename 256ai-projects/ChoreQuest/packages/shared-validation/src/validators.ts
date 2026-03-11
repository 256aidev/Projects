// Pure TypeScript validation functions — usable in API and client code
// These are framework-agnostic; the API wraps them with class-validator decorators

import { VALIDATION } from './constants';

export function isValidEmail(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (value.length > VALIDATION.EMAIL_MAX_LENGTH) return false;
  // RFC 5322 simplified — good enough for client-side + API validates further
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidPassword(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return (
    value.length >= VALIDATION.PASSWORD_MIN_LENGTH &&
    value.length <= VALIDATION.PASSWORD_MAX_LENGTH
  );
}

export function isValidDisplayName(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return (
    trimmed.length >= VALIDATION.DISPLAY_NAME_MIN_LENGTH &&
    trimmed.length <= VALIDATION.DISPLAY_NAME_MAX_LENGTH
  );
}

export function isValidHouseholdName(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return (
    trimmed.length >= VALIDATION.HOUSEHOLD_NAME_MIN_LENGTH &&
    trimmed.length <= VALIDATION.HOUSEHOLD_NAME_MAX_LENGTH
  );
}

export function isValidChoreTitle(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return (
    trimmed.length >= VALIDATION.CHORE_TITLE_MIN_LENGTH &&
    trimmed.length <= VALIDATION.CHORE_TITLE_MAX_LENGTH
  );
}

export function isValidPoints(value: unknown): value is number {
  if (typeof value !== 'number' || !Number.isInteger(value)) return false;
  return value >= VALIDATION.CHORE_POINTS_MIN && value <= VALIDATION.CHORE_POINTS_MAX;
}

export function isValidDueTime(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return VALIDATION.DUE_TIME_REGEX.test(value);
}

export function isValidAvatarColor(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return VALIDATION.AVATAR_COLOR_REGEX.test(value);
}

export function isValidAge(value: unknown): value is number {
  if (typeof value !== 'number' || !Number.isInteger(value)) return false;
  return value >= VALIDATION.AGE_MIN && value <= VALIDATION.AGE_MAX;
}

export function isValidWeekday(value: unknown): value is number {
  if (typeof value !== 'number' || !Number.isInteger(value)) return false;
  return value >= VALIDATION.WEEKDAY_MIN && value <= VALIDATION.WEEKDAY_MAX;
}

export function isValidRecurrenceConfig(values: unknown): values is number[] {
  if (!Array.isArray(values)) return false;
  return values.every(isValidWeekday);
}
