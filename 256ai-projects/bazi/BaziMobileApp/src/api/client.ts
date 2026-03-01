/**
 * API Client with JWT Authentication
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Production API URL
// const API_BASE_URL = 'https://256ai.xyz';

// Development URLs (comment out production and uncomment one of these):
// const API_BASE_URL = 'http://localhost:8000';
// const API_BASE_URL = 'http://10.0.0.21:8000';  // Win11 dev box
// const API_BASE_URL = 'http://10.0.1.76:8000';  // Direct to Bazi server
const API_BASE_URL = 'http://10.0.0.143:8000';  // Local Mac for testing

const TOKEN_KEY = '@bazi_auth_token';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async init() {
    // Load token from storage on startup
    try {
      this.token = await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to load token:', error);
    }
  }

  async setToken(token: string | null) {
    this.token = token;
    try {
      if (token) {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      } else {
        await AsyncStorage.removeItem(TOKEN_KEY);
      }
    } catch (error) {
      console.error('Failed to save token:', error);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  async clearToken() {
    await this.setToken(null);
  }

  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
      body?: any;
      includeAuth?: boolean;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, includeAuth = true } = options;

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: this.getHeaders(includeAuth),
        body: body ? JSON.stringify(body) : undefined,
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        // Only clear token if we had one (not for login attempts)
        if (this.token) {
          await this.clearToken();
        }
        throw new ApiError(
          errorData.detail || 'Authentication failed',
          401
        );
      }

      // Handle other errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.detail || `Request failed with status ${response.status}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      // Network error
      throw new ApiError('Network error. Please check your connection.', 0);
    }
  }

  // Convenience methods
  async get<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', includeAuth });
  }

  async post<T>(endpoint: string, body: any, includeAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, includeAuth });
  }

  async patch<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Singleton instance
export const apiClient = new ApiClient();
export default apiClient;
