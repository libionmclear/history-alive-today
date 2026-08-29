import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser, ownerUsername, Role } from '@/lib/auth';
import {
  deleteUser,
  getPublicUser,
  normalizeUsername,
  setUserPassword,
  updateUser,
  UpdateUserPatch,
} from '@/lib/users';
import { renameAuthor } from '@/lib/articles';

interface Ctx {
  params: Promise<{ username: string }>;
}

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const current = await getCurrentUser();
  if (!current || current.role !== 'admin') return bad('Admins only', 403);

  const { username } = await params;
  const target = normalizeUsername(username);

  if (target === ownerUsername()) return bad('The owner account cannot be deleted');
  if (target === normalizeUsername(current.username)) {
    return bad("You can't delete the account you're signed in with");
  }

  const ok = await deleteUser(target);
  if (!ok) return bad('User not found', 404);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const current = await getCurrentUser();
  if (!current || current.role !== 'admin') return bad('Admins only', 403);

  const { username } = await params;
  const target = normalizeUsername(username);
  const isSelf = target === normalizeUsername(current.username);

  if (target === ownerUsername()) {
    return bad('The owner account is configured through environment variables');
  }

  const body = await request.json().catch(() => ({}));

  // Password reset
  if (body.password !== undefined) {
    const password = typeof body.password === 'string' ? body.password : '';
    if (password.length < 6) return bad('Password must be at least 6 characters');
    if (!(await setUserPassword(target, password))) return bad('User not found', 404);
  }

  // Profile fields
  const patch: UpdateUserPatch = {};
  if (typeof body.name === 'string') patch.name = body.name;
  if (body.role === 'admin' || body.role === 'writer') patch.role = body.role as Role;

  if (patch.role && isSelf && patch.role !== 'admin') {
    return bad("You can't remove your own admin access — ask another admin to do it");
  }

  if (patch.name !== undefined || patch.role !== undefined) {
    const result = await updateUser(target, patch);
    if (!result.ok) return bad(result.error || 'Could not update user', result.error === 'User not found' ? 404 : 400);

    // Bylines are denormalized onto articles, so a rename has to fan out.
    if (patch.name !== undefined && result.user) {
      const changed = await renameAuthor(target, result.user.name);
      if (changed > 0) revalidatePath('/', 'layout');
    }
    return NextResponse.json({ ok: true, user: result.user });
  }

  return NextResponse.json({ ok: true, user: await getPublicUser(target) });
}
