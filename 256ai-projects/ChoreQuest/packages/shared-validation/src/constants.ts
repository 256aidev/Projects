// Validation constants shared across API and clients

export const VALIDATION = {
  // User fields
  EMAIL_MAX_LENGTH: 255,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  DISPLAY_NAME_MIN_LENGTH: 1,
  DISPLAY_NAME_MAX_LENGTH: 50,
  AGE_MIN: 1,
  AGE_MAX: 120,

  // Household fields
  HOUSEHOLD_NAME_MIN_LENGTH: 1,
  HOUSEHOLD_NAME_MAX_LENGTH: 100,

  // Chore fields
  CHORE_TITLE_MIN_LENGTH: 1,
  CHORE_TITLE_MAX_LENGTH: 200,
  CHORE_DESCRIPTION_MAX_LENGTH: 1000,
  CHORE_POINTS_MIN: 0,
  CHORE_POINTS_MAX: 9999,
  DUE_TIME_REGEX: /^([01]\d|2[0-3]):[0-5]\d$/,

  // Assignments
  REJECTION_REASON_MAX_LENGTH: 500,

  // Auth
  JWT_MIN_SECRET_LENGTH: 16,

  // Avatar
  AVATAR_COLOR_REGEX: /^#[0-9a-fA-F]{6}$/,
  AVATAR_ICON_MAX_LENGTH: 50,

  // Recurrence config (weekday indices for custom schedules)
  WEEKDAY_MIN: 0,
  WEEKDAY_MAX: 6,
} as const;

export const ERROR_MESSAGES = {
  // Auth
  INVALID_EMAIL: 'Must be a valid email address',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`,
  PASSWORD_TOO_LONG: `Password must be at most ${VALIDATION.PASSWORD_MAX_LENGTH} characters`,
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Insufficient permissions',
  TOKEN_EXPIRED: 'Token has expired',

  // User
  DISPLAY_NAME_REQUIRED: 'Display name is required',
  DISPLAY_NAME_TOO_LONG: `Display name must be at most ${VALIDATION.DISPLAY_NAME_MAX_LENGTH} characters`,
  INVALID_ROLE: 'Role must be "parent" or "child"',
  INVALID_AGE: `Age must be between ${VALIDATION.AGE_MIN} and ${VALIDATION.AGE_MAX}`,

  // Household
  HOUSEHOLD_NAME_REQUIRED: 'Household name is required',
  HOUSEHOLD_NAME_TOO_LONG: `Household name must be at most ${VALIDATION.HOUSEHOLD_NAME_MAX_LENGTH} characters`,
  HOUSEHOLD_NOT_FOUND: 'Household not found',

  // Chore
  CHORE_TITLE_REQUIRED: 'Chore title is required',
  CHORE_TITLE_TOO_LONG: `Chore title must be at most ${VALIDATION.CHORE_TITLE_MAX_LENGTH} characters`,
  CHORE_DESCRIPTION_TOO_LONG: `Description must be at most ${VALIDATION.CHORE_DESCRIPTION_MAX_LENGTH} characters`,
  INVALID_POINTS: `Points must be between ${VALIDATION.CHORE_POINTS_MIN} and ${VALIDATION.CHORE_POINTS_MAX}`,
  INVALID_DUE_TIME: 'Due time must be in HH:MM format (24-hour)',
  INVALID_RECURRENCE: 'Invalid recurrence type',
  CHORE_NOT_FOUND: 'Chore not found',

  // Assignment
  ASSIGNMENT_NOT_FOUND: 'Assignment not found',
  ALREADY_COMPLETED: 'Assignment is already completed',
  REJECTION_REASON_TOO_LONG: `Rejection reason must be at most ${VALIDATION.REJECTION_REASON_MAX_LENGTH} characters`,

  // General
  INVALID_UUID: 'Must be a valid UUID',
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'An unexpected error occurred',
} as const;
