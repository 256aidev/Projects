/**
 * Difficulty multiplier for leaderboard scoring.
 *
 * More rivals + shorter entry delay = harder = higher multiplier.
 *
 * Rival count contribution (0-5):
 *   0 rivals = 0, 1 = 0.1, 2 = 0.3, 3 = 0.6, 4 = 1.0, 5 = 1.5
 *
 * Entry delay contribution (0-60 min):
 *   0 min (instant) = 1.0, 10 min = 0.6, 20 min = 0.3, 30+ min = 0.1, 60 min = 0
 *
 * Base multiplier = 1.0
 * Max possible = 1.0 + 1.5 + 1.0 = 3.5× (5 rivals, instant start)
 * Min possible = 1.0 + 0.0 + 0.0 = 1.0× (0 rivals, 60 min delay)
 */

export function getDifficultyMultiplier(rivalCount: number, entryDelayMinutes: number): number {
  // Rival count bonus: scales from 0 (0 rivals) to 1.5 (5 rivals)
  // Exponential curve — each rival adds more than the last
  const rivalBonus = [0, 0.1, 0.3, 0.6, 1.0, 1.5][Math.min(Math.max(rivalCount, 0), 5)] ?? 0;

  // Entry delay bonus: shorter delay = harder = more bonus
  // 0 min = 1.0 (max), scales down to 0 at 60 min
  let delayBonus: number;
  if (entryDelayMinutes <= 0) delayBonus = 1.0;
  else if (entryDelayMinutes <= 10) delayBonus = 0.6;
  else if (entryDelayMinutes <= 20) delayBonus = 0.3;
  else if (entryDelayMinutes <= 30) delayBonus = 0.1;
  else if (entryDelayMinutes <= 50) delayBonus = 0.05;
  else delayBonus = 0;

  return Math.round((1 + rivalBonus + delayBonus) * 10) / 10;
}
