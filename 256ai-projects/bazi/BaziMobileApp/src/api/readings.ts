/**
 * Readings API functions
 */

import { apiClient } from './client';
import { DailyReading, WeeklyReading } from '../types';

/**
 * Get daily reading for a user
 * @param userId - User ID
 * @param date - Optional date in YYYY-MM-DD format (defaults to today)
 */
export async function getDailyReading(
  userId: number,
  date?: string
): Promise<DailyReading> {
  // Backend uses path parameter for date: /daily/{user_id}/{date}
  const endpoint = date
    ? `/daily/${userId}/${date}`
    : `/daily/${userId}`;

  return apiClient.get<DailyReading>(endpoint);
}

/**
 * Get weekly reading for a user
 * @param userId - User ID
 */
export async function getWeeklyReading(userId: number): Promise<WeeklyReading> {
  return apiClient.get<WeeklyReading>(`/weekly/${userId}`);
}

/**
 * Get reading for a specific date
 * @param userId - User ID
 * @param date - Date in YYYY-MM-DD format
 */
export async function getReadingByDate(
  userId: number,
  date: string
): Promise<DailyReading> {
  return getDailyReading(userId, date);
}
