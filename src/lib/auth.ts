import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getRedis } from './redis';

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

// ---- Redis-backed sessions ----

function sessionKey(token: string): string {
  return `cms:session:${token}`;
}

/** Creates a session, stores it in Redis, and returns the opaque token. */
export async function createSession(user: SessionUser): Promise<string> {
  const r = getRedis();
  const token = crypto.randomBytes(32).toString('hex');
  if (r) {
    await r.set(sessionKey(token), JSON.stringify(user), { ex: SESSION_TTL_SECONDS });
  }
  return token;
}

export async function readSession(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  const r = getRedis();
  if (!r) return null;
  const raw = await r.get<string | SessionUser>(sessionKey(token));
  if (!raw) return null;
  return typeof raw === 'string' ? (JSON.parse(raw) as SessionUser) : raw;
}

export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  const r = getRedis();
  if (r) await r.del(sessionKey(token));
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
