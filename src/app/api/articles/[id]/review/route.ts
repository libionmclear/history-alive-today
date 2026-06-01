import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { reviewArticle } from '@/lib/articles';
import { revalidatePath } from 'next/cache';

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = body.action;
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const result = await reviewArticle(id, action, typeof body.note === 'string' ? body.note : undefined);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Refresh public listings so a newly published article appears immediately.
  if (action === 'approve') {
    revalidatePath('/');
    if (result.article) {
      revalidatePath(`/category/${result.article.category}`);
      revalidatePath(`/article/${result.article.slug}`);
    }
  }

  return NextResponse.json({ article: result.article });
}
