import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createDraft } from '@/lib/articles';

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const article = await createDraft(user.username, user.name);
    return NextResponse.json({ id: article.id });
  } catch {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
  }
}
