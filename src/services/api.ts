import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'http://119.59.102.161:3053/api';

const AUTH_TOKEN_KEY = '@imperialwood/auth-token';
const REQUEST_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function setAuthToken(token: string | null): Promise<void> {
  if (token) {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
          ? body.error
          : `API request failed with status ${response.status}.`;
      throw new ApiError(message, response.status);
    }

    return body as T;
  } finally {
    clearTimeout(timeout);
  }
}
