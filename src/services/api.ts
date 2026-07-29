import { supabase } from '@/lib/supabase';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type SupabaseErrorLike = {
  message?: string;
  status?: number;
};

export function toApiError(
  error: unknown,
  fallbackMessage: string,
  fallbackStatus = 500
): ApiError {
  const candidate = error as SupabaseErrorLike | null;
  return new ApiError(
    candidate?.message?.trim() || fallbackMessage,
    candidate?.status ?? fallbackStatus
  );
}

export function assertData<T>(
  data: T | null,
  error: SupabaseErrorLike | null,
  fallbackMessage: string
): T {
  if (error) {
    throw toApiError(error, fallbackMessage);
  }
  if (data === null) {
    throw new ApiError(fallbackMessage, 500);
  }
  return data;
}

export async function requireAuthenticatedUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw toApiError(error, 'Unable to verify the current session.', 401);
  }
  if (!data.user) {
    throw new ApiError('You must be signed in to continue.', 401);
  }

  const { data: profile, error: profileError } = await supabase
    .from('IW_Users')
    .select('user_id')
    .eq('auth_user_id', data.user.id)
    .single<{ user_id: string | number }>();
  if (profileError) {
    throw toApiError(profileError, 'The ImperialWood user profile could not be loaded.', 401);
  }
  return String(profile.user_id);
}
