import { apiRequest, setAuthToken } from '@/services/api';

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

type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type RegisterInput = {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
};

export async function login(
  role: AuthRole,
  username: string,
  password: string
): Promise<AuthUser> {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ role, username, password }),
  });
  await setAuthToken(response.token);
  return response.user;
}

export async function register(input: RegisterInput): Promise<AuthUser> {
  const response = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  await setAuthToken(response.token);
  return response.user;
}

export async function logout(): Promise<void> {
  await setAuthToken(null);
}
