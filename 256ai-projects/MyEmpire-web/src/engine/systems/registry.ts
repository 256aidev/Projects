import type { GameSystem } from './types';
import { tickCriminalOpSystem } from './criminalOp';
import { tickBusinessesSystem } from './businesses';
import { tickCashFlowSystem } from './cashFlow';
import { tickStreetEconomySystem } from './streetEconomy';
import { tickLegalSystem } from './legal';
import { tickJobsSystem } from './jobs';
import { tickRivalSystem } from './rivalSystem';
import { tickEventSystem } from './eventSystem';

/**
 * Ordered list of game systems that run each tick.
 * ORDER MATTERS — each system reads/writes the shared TickState accumulator.
 *
 * 1. Criminal op produces dirtyCash + updates operation
 * 2. Businesses launder dirtyCash -> cleanCash, dispensaries consume product
 * 3. Cash flow reconciles reverse flow + net cash
 * 4. Street economy updates sell quota
 * 5. Legal handles lawyer cost + heat calculation
 * 6. Jobs handles job income + hitman upkeep
 * 7. Rivals runs AI attacks/defense
 * 8. Events checks for random events based on final state
 */
export const GAME_SYSTEMS: GameSystem[] = [
  tickCriminalOpSystem,
  tickBusinessesSystem,
  tickCashFlowSystem,
  tickStreetEconomySystem,
  tickLegalSystem,
  tickJobsSystem,
  tickRivalSystem,
  tickEventSystem,
];
