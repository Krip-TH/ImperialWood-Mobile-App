import { supabase } from '@/lib/supabase';
import { apiData, ApiError, setAuthToken, toApiError } from '@/services/api';

export type AuthRole = 'client' | 'admin';

export type AuthUser = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  role: AuthRole;
  createdAt: string;
};

export type RegisterInput = {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
};

type UserRow = {
  user_id: string | number;
  full_name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  role: AuthRole | null;
  created_at: string | null;
};

function normalizeUser(row: UserRow): AuthUser {
  return {
    id: String(row.user_id),
    fullName: row.full_name ?? '',
    username: row.username ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    role: row.role === 'admin' ? 'admin' : 'client',
    createdAt: row.created_at ?? '',
  };
}

export async function login(
  role: AuthRole,
  username: string,
  password: string
): Promise<AuthUser> {
  const response = await apiData<{ token: string; user: UserRow }>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ role, username, password }),
    }
  );

  await setAuthToken(response.token);
  return normalizeUser(response.user);
}

export async function register(input: RegisterInput): Promise<AuthUser> {
  const email = input.email.trim().toLowerCase();
  const profileInput = {
    full_name: input.fullName.trim(),
    username: input.username.trim(),
    phone: input.phone.trim(),
    role: 'client' as const,
  };
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: { data: profileInput },
  });

  if (authError) {
    throw new ApiError(
      authError.message || 'Unable to create the account.',
      authError.status,
      authError
    );
  }

  if (!authData.user) {
    throw new ApiError('Supabase did not return a new user.', 500);
  }

  let profile: UserRow | null = null;
  if (authData.session) {
    const { data, error } = await supabase
      .from('IW_Users')
      .upsert(
        {
          auth_user_id: authData.user.id,
          ...profileInput,
          email,
        },
        { onConflict: 'auth_user_id' }
      )
      .select('user_id, full_name, username, email, phone, role, created_at')
      .single<UserRow>();

    if (error) {
      throw toApiError(error, 'The account profile could not be created.');
    }
    profile = data;
  }

  await supabase.auth.signOut();
  await setAuthToken(null);

  return profile
    ? normalizeUser(profile)
    : {
        id: authData.user.id,
        fullName: profileInput.full_name,
        username: profileInput.username,
        email,
        phone: profileInput.phone,
        role: 'client',
        createdAt: authData.user.created_at,
      };
}

export async function logout(): Promise<void> {
  await setAuthToken(null);
}
