import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
  'http://119.59.102.161:3117/api';
const AUTH_TOKEN_KEY = '@imperialwood/auth-token';
const REQUEST_TIMEOUT_MS = 15_000;

type ApiOptions = RequestInit & {
  token?: string;
};

export class ApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(
    message: string,
    status?: number,
    details?: unknown
  ) {
    super(message);

    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function setAuthToken(token: string | null): Promise<void> {
  if (token) {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function toApiError(
  error: unknown,
  fallbackMessage = 'Something went wrong.'
): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new ApiError(
      error.message || fallbackMessage,
      undefined,
      error
    );
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  ) {
    return new ApiError(
      String(
        (error as { message?: unknown }).message ??
          fallbackMessage
      ),
      undefined,
      error
    );
  }

  return new ApiError(fallbackMessage, undefined, error);
}

async function apiCall<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { token, headers, ...fetchOptions } = options;
  const authToken = token ?? await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(authToken
          ? {
              Authorization: `Bearer ${authToken}`,
            }
          : {}),
        ...headers,
      },
    });

    let result: unknown;

    try {
      result = await response.json();
    } catch {
      throw new ApiError(
        'The server returned an invalid response.',
        response.status
      );
    }

    if (!response.ok) {
      const errorMessage =
        typeof result === 'object' &&
        result !== null &&
        'error' in result
          ? String(
              (result as { error?: unknown }).error ??
                `Request failed with status ${response.status}`
            )
          : `Request failed with status ${response.status}`;

      throw new ApiError(
        errorMessage,
        response.status,
        result
      );
    }

    if (
      typeof result === 'object' &&
      result !== null &&
      'success' in result &&
      (result as { success?: boolean }).success === false
    ) {
      const errorMessage =
        'error' in result
          ? String(
              (result as { error?: unknown }).error ??
                'The request failed.'
            )
          : 'The request failed.';

      throw new ApiError(
        errorMessage,
        response.status,
        result
      );
    }

    return result as T;
  } catch (error) {
    throw toApiError(
      error,
      'The backend server could not be reached.'
    );
  } finally {
    clearTimeout(timeout);
  }
}

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error?: string;
};

export async function apiData<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const response = await apiCall<ApiEnvelope<T>>(endpoint, options);
  return response.data;
}
