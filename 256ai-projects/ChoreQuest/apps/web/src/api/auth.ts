import client from './client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  role: 'parent' | 'child';
  household_id: string;
}

function storeTokens(tokens: AuthTokens) {
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
}

function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export async function signup(
  email: string,
  password: string,
  displayName: string,
): Promise<AuthTokens> {
  const { data } = await client.post<AuthTokens>('/auth/signup', {
    email,
    password,
    displayName,
  });
  storeTokens(data);
  return data;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthTokens> {
  const { data } = await client.post<AuthTokens>('/auth/login', {
    email,
    password,
  });
  storeTokens(data);
  return data;
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  const { data } = await client.post<AuthTokens>('/auth/refresh', {
    refreshToken,
  });
  storeTokens(data);
  return data;
}

export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (refreshToken) {
    try {
      await client.post('/auth/logout', { refreshToken });
    } catch {
      // Ignore logout errors — clear tokens regardless
    }
  }
  clearTokens();
}

export async function getMe(): Promise<User> {
  const { data } = await client.get<User>('/auth/me');
  return data;
}
