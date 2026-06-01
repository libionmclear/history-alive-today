import { getRedis } from './redis';
import { hashPassword, verifyPassword, Role, ownerUsername } from './auth';

const USERS_KEY = 'cms:users'; // hash: username -> JSON

export interface StoredUser {
  username: string;
  name: string;
  role: Role;
  passwordHash: string;
  createdAt: number;
}

export interface PublicUser {
  username: string;
  name: string;
  role: Role;
  createdAt: number;
}

function toPublic(u: StoredUser): PublicUser {
  return { username: u.username, name: u.name, role: u.role, createdAt: u.createdAt };
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export async function getUser(username: string): Promise<StoredUser | null> {
  const r = getRedis();
  if (!r) return null;
  const raw = await r.hget<string | StoredUser>(USERS_KEY, normalizeUsername(username));
  if (!raw) return null;
  return typeof raw === 'string' ? (JSON.parse(raw) as StoredUser) : raw;
}

export async function listUsers(): Promise<PublicUser[]> {
  const r = getRedis();
  if (!r) return [];
  const all = await r.hgetall<Record<string, string | StoredUser>>(USERS_KEY);
  if (!all) return [];
  return Object.values(all)
    .map((v) => (typeof v === 'string' ? (JSON.parse(v) as StoredUser) : v))
    .map(toPublic)
    .sort((a, b) => a.username.localeCompare(b.username));
}

export interface CreateUserResult {
  ok: boolean;
  error?: string;
  user?: PublicUser;
}

export async function createUser(
  username: string,
  name: string,
  password: string,
  role: Role,
): Promise<CreateUserResult> {
  const r = getRedis();
  if (!r) return { ok: false, error: 'Storage not configured' };

  const uname = normalizeUsername(username);
  if (!/^[a-z0-9._-]{3,32}$/.test(uname)) {
    return { ok: false, error: 'Username must be 3–32 chars: letters, numbers, . _ -' };
  }
  if (uname === ownerUsername()) {
    return { ok: false, error: 'That username is reserved for the owner account' };
  }
  if (password.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters' };
  }
  if (await r.hexists(USERS_KEY, uname)) {
    return { ok: false, error: 'A user with that username already exists' };
  }

  const user: StoredUser = {
    username: uname,
    name: name.trim() || uname,
    role,
    passwordHash: hashPassword(password),
    createdAt: Date.now(),
  };
  await r.hset(USERS_KEY, { [uname]: JSON.stringify(user) });
  return { ok: true, user: toPublic(user) };
}

export async function deleteUser(username: string): Promise<boolean> {
  const r = getRedis();
  if (!r) return false;
  const removed = await r.hdel(USERS_KEY, normalizeUsername(username));
  return removed > 0;
}

export async function setUserPassword(username: string, password: string): Promise<boolean> {
  const r = getRedis();
  if (!r) return false;
  const user = await getUser(username);
  if (!user) return false;
  user.passwordHash = hashPassword(password);
  await r.hset(USERS_KEY, { [user.username]: JSON.stringify(user) });
  return true;
}

/** Verifies credentials for a Redis-stored user. Returns the user or null. */
export async function verifyUser(username: string, password: string): Promise<StoredUser | null> {
  const user = await getUser(username);
  if (!user) return null;
  return verifyPassword(password, user.passwordHash) ? user : null;
}
