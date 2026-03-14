/**
 * Difficulty multiplier for leaderboard scoring.
 *
 * More rivals + shorter entry delay = harder = higher multiplier.
 *
 * Rival count contribution (1-5):
 *   1 rival = 0, 2 = 0.1, 3 = 0.2, 4 = 0.35, 5 = 0.5
 *
 * Entry delay contribution (0-60 min):
 *   0 min (instant) = 0.5, 10 min = 0.35, 20 min = 0.2, 30+ min = 0.1, 60 min = 0
 *
 * Base multiplier = 1.0
 * Max possible = 1.0 + 0.5 + 0.5 = 2.0× (5 rivals, instant start)
 * Min possible = 1.0 + 0.0 + 0.0 = 1.0× (1 rival, 60 min delay)
 */

export function getDifficultyMultiplier(rivalCount: number, entryDelayMinutes: number): number {
  // Rival count bonus: scales from 0 (1 rival) to 0.5 (5 rivals)
  const rivalBonus = [0, 0.1, 0.2, 0.35, 0.5][Math.min(rivalCount, 5) - 1] ?? 0;

  // Entry delay bonus: shorter delay = harder = more bonus
  // 0 min = 0.5, 10 min = 0.35, 20 min = 0.2, 30 min = 0.1, 40+ min = 0.05, 60 min = 0
  let delayBonus: number;
  if (entryDelayMinutes <= 0) delayBonus = 0.5;
  else if (entryDelayMinutes <= 10) delayBonus = 0.35;
  else if (entryDelayMinutes <= 20) delayBonus = 0.2;
  else if (entryDelayMinutes <= 30) delayBonus = 0.1;
  else if (entryDelayMinutes <= 50) delayBonus = 0.05;
  else delayBonus = 0;

  return Math.round((1 + rivalBonus + delayBonus) * 10) / 10;
}
