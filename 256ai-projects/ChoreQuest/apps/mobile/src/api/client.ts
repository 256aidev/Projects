import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://chorequest.256ai.xyz';
const TOKEN_KEY = '@chorequest_auth_token';
const REFRESH_KEY = '@chorequest_refresh_token';

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class ApiClient {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private onUnauthorized: (() => void) | null = null;

  async init(): Promise<string | null> {
    try {
      this.token = await AsyncStorage.getItem(TOKEN_KEY);
      this.refreshToken = await AsyncStorage.getItem(REFRESH_KEY);
      return this.token;
    } catch {
      return null;
    }
  }

  setOnUnauthorized(callback: () => void) {
    this.onUnauthorized = callback;
  }

  async setToken(token: string, refreshToken?: string) {
    this.token = token;
    await AsyncStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) {
      this.refreshToken = refreshToken;
      await AsyncStorage.setItem(REFRESH_KEY, refreshToken);
    }
  }

  async clearToken() {
    this.token = null;
    this.refreshToken = null;
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY]);
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      includeAuth?: boolean;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, includeAuth = true } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = { method, headers };
    if (body) {
      config.body = JSON.stringify(body);
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, config);

    if (response.status === 401) {
      // Try refresh
      if (this.refreshToken && includeAuth) {
        const refreshed = await this.tryRefresh();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.token}`;
          const retryResponse = await fetch(url, { ...config, headers });
          if (retryResponse.ok) {
            const text = await retryResponse.text();
            return text ? JSON.parse(text) : ({} as T);
          }
        }
      }
      await this.clearToken();
      this.onUnauthorized?.();
      throw new ApiError('Unauthorized', 401);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new ApiError(
        errorData?.message || `Request failed: ${response.status}`,
        response.status,
        errorData
      );
    }

    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  private async tryRefresh(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      if (data.accessToken) {
        await this.setToken(data.accessToken, data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Convenience methods
  async get<T>(endpoint: string, includeAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', includeAuth });
  }

  async post<T>(endpoint: string, body?: any, includeAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, includeAuth });
  }

  async patch<T>(endpoint: string, body?: any, includeAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body, includeAuth });
  }

  async delete<T>(endpoint: string, includeAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', includeAuth });
  }
}

export const apiClient = new ApiClient();
export { ApiError };
