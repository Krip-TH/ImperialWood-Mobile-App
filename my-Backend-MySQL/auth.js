const { randomBytes } = require('crypto');

const AUTH_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const authSessions = new Map();

function authenticationError() {
  const error = new Error('Invalid authentication token.');
  error.status = 401;
  return error;
}

function createAuthToken(userId, role) {
  if (userId === undefined || userId === null || !['client', 'admin'].includes(role)) {
    throw new Error('A valid user ID and role are required to create an auth token.');
  }

  const now = Date.now();
  for (const [token, session] of authSessions) {
    if (session.expiresAt <= now) authSessions.delete(token);
  }

  const token = randomBytes(32).toString('base64url');
  authSessions.set(token, {
    userId: String(userId),
    role,
    expiresAt: now + AUTH_SESSION_TTL_MS,
  });
  return token;
}

async function getAuthUser(token) {
  const session = authSessions.get(token);

  if (!session || session.expiresAt <= Date.now()) {
    if (session) authSessions.delete(token);
    throw authenticationError();
  }

  return {
    userId: session.userId,
    role: session.role,
  };
}

module.exports = { createAuthToken, getAuthUser };
