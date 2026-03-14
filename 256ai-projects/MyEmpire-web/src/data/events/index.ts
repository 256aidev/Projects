// ─────────────────────────────────────────
// EVENT REGISTRY — All events combined
// ─────────────────────────────────────────

export type { GameEventDef, GameEventChoice, EventOutcome, EventConditions, EventCategory, EventSystemState, ActiveEvent, EventBuff } from './types';
export { INITIAL_EVENT_STATE, EVENT_MIN_INTERVAL, EVENT_MAX_INTERVAL } from './types';

import { LIFE_EVENTS } from './lifeEvents';
import { CRIMINAL_EVENTS } from './criminalEvents';
import { BUSINESS_EVENTS } from './businessEvents';
import { VICE_EVENTS } from './viceEvents';

/** All game events combined */
export const ALL_EVENTS = [
  ...LIFE_EVENTS,
  ...CRIMINAL_EVENTS,
  ...BUSINESS_EVENTS,
  ...VICE_EVENTS,
];

/** Events by category for filtering */
export { LIFE_EVENTS, CRIMINAL_EVENTS, BUSINESS_EVENTS, VICE_EVENTS };
