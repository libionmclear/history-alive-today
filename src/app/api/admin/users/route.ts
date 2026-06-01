import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, Role } from '@/lib/auth';
import { createUser, listUsers } from '@/lib/users';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }
  return NextResponse.json({ users: await listUsers() });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const username = typeof body.username === 'string' ? body.username : '';
  const name = typeof body.name === 'string' ? body.name : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const role: Role = body.role === 'admin' ? 'admin' : 'writer';

  const result = await createUser(username, name, password, role);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ user: result.user });
}
