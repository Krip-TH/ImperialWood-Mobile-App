const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be configured.');
}

const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function getAuthUser(token) {
  const { data, error } = await authClient.auth.getUser(token);

  if (error || !data.user) {
    const authError = new Error(error?.message || 'Invalid authentication token.');
    authError.status = 401;
    throw authError;
  }

  return data.user;
}

async function signInWithPassword(email, password) {
  const { data, error } = await authClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user || !data.session) {
    const authError = new Error('Invalid username or password.');
    authError.status = 401;
    throw authError;
  }

  return data;
}

module.exports = { getAuthUser, signInWithPassword };
