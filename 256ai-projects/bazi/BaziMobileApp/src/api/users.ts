/**
 * User API functions
 */

import { apiClient } from './client';
import { User, UserUpdateRequest } from '../types';

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: number): Promise<User> {
  return apiClient.get<User>(`/users/${userId}`);
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: number,
  data: UserUpdateRequest
): Promise<User> {
  return apiClient.patch<User>(`/users/${userId}`, data);
}

/**
 * Update user preferences (tone, language)
 */
export async function updatePreferences(
  userId: number,
  preferences: {
    preferred_tone?: 'mystical' | 'balanced' | 'practical';
    language?: 'en' | 'zh';
  }
): Promise<User> {
  return apiClient.patch<User>(`/users/${userId}`, preferences);
}
