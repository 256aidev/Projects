/**
 * Authentication API functions
 */

import { apiClient, ApiError } from './client';
import {
  User,
  LoginRequest,
  RegisterRequest,
  SocialLoginRequest,
  AuthResponse,
} from '../types';

/**
 * Register a new user with email and birth data
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(
    '/auth/register',
    data,
    false // No auth required
  );

  // Store the token
  await apiClient.setToken(response.access_token);

  return response;
}

/**
 * Login with email and password
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(
    '/auth/login',
    data,
    false // No auth required
  );

  // Store the token
  await apiClient.setToken(response.access_token);

  return response;
}

/**
 * Login with social provider (Google/Apple)
 */
export async function socialLogin(data: SocialLoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(
    '/auth/social',
    data,
    false // No auth required
  );

  // Store the token
  await apiClient.setToken(response.access_token);

  return response;
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<User> {
  return apiClient.get<User>('/auth/me');
}

/**
 * Register device token for push notifications
 */
export async function registerDeviceToken(token: string): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>('/auth/device-token', {
    device_token: token,
  });
}

/**
 * Logout - clear stored token
 */
export async function logout(): Promise<void> {
  await apiClient.clearToken();
}

/**
 * Check if user is logged in (has valid token)
 */
export function isLoggedIn(): boolean {
  return apiClient.getToken() !== null;
}

export { ApiError };
