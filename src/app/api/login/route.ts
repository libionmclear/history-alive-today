import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  isOwnerLogin,
  ownerUsername,
  createSession,
  destroySession,
  sessionCookieOptions,
} from '@/lib/auth';
import { verifyUser } from '@/lib/users';

export async function POST(request: NextRequest) {
  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
  }

  let session;
  if (isOwnerLogin(username, password)) {
    session = { username: ownerUsername(), name: 'Owner', role: 'admin' as const };
  } else {
    const user = await verifyUser(username, password);
    if (user) session = { username: user.username, name: user.name, role: user.role };
  }

  if (!session) {
    return NextResponse.json({ error: 'Incorrect username or password' }, { status: 401 });
  }

  const token = await createSession(session);
  const res = NextResponse.json({ ok: true, role: session.role });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  await destroySession(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
