import crypto from 'crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type Role = 'admin' | 'writer';

export interface SessionUser {
  username: string;
  name: string;
  role: Role;
}

// ---- Password hashing (scrypt) ----

/** Returns a "salt:hash" string suitable for storage. */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/** Constant-time verification of a password against a stored "salt:hash". */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

// ---- Owner (env-based super admin) ----

export function ownerUsername(): string {
  return (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
}

/** True if these credentials match the env-configured owner account. */
export function isOwnerLogin(username: string, password: string): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  if (username.toLowerCase() !== ownerUsername()) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(pw);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---- Stateless signed sessions (no external store needed) ----
//
// The session is encoded directly in the cookie and signed with HMAC-SHA256,
// so it can be verified without Redis. This keeps login working even if the
// data store is unavailable or its env vars are mis-named.

function sessionSecret(): string {
  // Prefer an explicit secret; otherwise derive one from the owner password.
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'history-alive-dev-secret';
}

function sign(body: string): string {
  return crypto.createHmac('sha256', sessionSecret()).update(body).digest('base64url');
}

/** Builds a signed session token: base64url(payload).hmac */
export async function createSession(user: SessionUser): Promise<string> {
  const payload = { ...user, exp: Date.now() + SESSION_TTL_SECONDS * 1000 };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

export async function readSession(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;

  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    if (!payload.username || !payload.role) return null;
    return { username: payload.username, name: payload.name, role: payload.role };
  } catch {
    return null;
  }
}

/** Stateless sessions need no server-side teardown; clearing the cookie suffices. */
export async function destroySession(token?: string): Promise<void> {
  void token; // nothing to revoke server-side
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  };
}

/** Reads the current logged-in user from the session cookie (server-side). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return readSession(token);
}
