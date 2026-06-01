import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { deleteUser, setUserPassword } from '@/lib/users';

interface Ctx {
  params: Promise<{ username: string }>;
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }
  const { username } = await params;
  const ok = await deleteUser(username);
  if (!ok) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }
  const { username } = await params;
  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === 'string' ? body.password : '';
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }
  const ok = await setUserPassword(username, password);
  if (!ok) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
