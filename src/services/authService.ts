import { supabase } from '@/lib/supabase';
import { ApiError, assertData, toApiError } from '@/services/api';

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
  const { data: loginRows, error: profileError } = await supabase.rpc('iw_resolve_login', {
    p_role: role,
    p_username: username,
  });

  if (profileError) {
    throw toApiError(profileError, 'Unable to find this account.');
  }
  const loginProfile = Array.isArray(loginRows) ? loginRows[0] : loginRows;
  const email =
    loginProfile && typeof loginProfile === 'object' && 'email' in loginProfile
      ? String(loginProfile.email ?? '')
      : '';
  if (!email) {
    throw new ApiError('Invalid username or password.', 401);
  }

  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (authError) {
    throw toApiError(authError, 'Invalid username or password.', 401);
  }

  const { data: profile, error: authenticatedProfileError } = await supabase
    .from('IW_Users')
    .select('user_id, full_name, username, email, phone, role, created_at')
    .eq('username', username)
    .eq('role', role)
    .single<UserRow>();
  if (authenticatedProfileError) {
    await supabase.auth.signOut();
    throw toApiError(authenticatedProfileError, 'The user profile could not be loaded.');
  }

  return normalizeUser(profile);
}

export async function register(input: RegisterInput): Promise<AuthUser> {
  const email = input.email.trim().toLowerCase();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName.trim(),
        username: input.username.trim(),
        phone: input.phone.trim(),
        role: 'client',
      },
    },
  });
  if (authError) {
    throw toApiError(authError, 'Unable to create the account.', authError.status);
  }

  const authUser = assertData(authData.user, null, 'Supabase did not return a new user.');
  const { data: profile, error: profileError } = await supabase
    .from('IW_Users')
    .upsert({
      auth_user_id: authUser.id,
      full_name: input.fullName.trim(),
      username: input.username.trim(),
      email,
      phone: input.phone.trim(),
      role: 'client',
    }, { onConflict: 'auth_user_id' })
    .select('user_id, full_name, username, email, phone, role, created_at')
    .single<UserRow>();

  if (profileError && authData.session) {
    throw toApiError(profileError, 'The account profile could not be created.');
  }

  await supabase.auth.signOut();
  return profile
    ? normalizeUser(profile)
    : {
        id: authUser.id,
        fullName: input.fullName.trim(),
        username: input.username.trim(),
        email,
        phone: input.phone.trim(),
        role: 'client',
        createdAt: authUser.created_at,
      };
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw toApiError(error, 'Unable to sign out.');
  }
}
