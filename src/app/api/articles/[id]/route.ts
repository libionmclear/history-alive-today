import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getArticle,
  updateArticle,
  submitForReview,
  deleteArticle,
  DraftPatch,
} from '@/lib/articles';
import { Category, categoryLabels } from '@/lib/data';

const VALID_CATEGORIES = Object.keys(categoryLabels) as Category[];

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (user.role !== 'admin' && article.authorUsername !== user.username) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json({ article });
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (user.role !== 'admin' && article.authorUsername !== user.username) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));

  if (body.action === 'submit') {
    if (!article.title || !article.excerpt || !article.cardImage || !article.bodyMarkdown) {
      return NextResponse.json(
        { error: 'Add a title, excerpt, card image, and body before submitting.' },
        { status: 400 },
      );
    }
    const updated = await submitForReview(id);
    return NextResponse.json({ article: updated });
  }

  // Field update — only while editable.
  if (article.status === 'pending' || article.status === 'published') {
    return NextResponse.json(
      { error: `Cannot edit an article that is ${article.status}.` },
      { status: 409 },
    );
  }

  const patch: DraftPatch = {};
  if (typeof body.title === 'string') patch.title = body.title.slice(0, 200);
  if (typeof body.excerpt === 'string') patch.excerpt = body.excerpt.slice(0, 600);
  if (typeof body.bodyMarkdown === 'string') patch.bodyMarkdown = body.bodyMarkdown.slice(0, 100_000);
  if (typeof body.cardImage === 'string') patch.cardImage = body.cardImage;
  if (typeof body.heroImage === 'string') patch.heroImage = body.heroImage;
  if (typeof body.category === 'string' && VALID_CATEGORIES.includes(body.category as Category)) {
    patch.category = body.category as Category;
  }
  if (Array.isArray(body.images)) {
    patch.images = body.images.filter((u: unknown): u is string => typeof u === 'string').slice(0, 50);
  }

  const updated = await updateArticle(id, patch);
  return NextResponse.json({ article: updated });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (user.role !== 'admin' && article.authorUsername !== user.username) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await deleteArticle(id);
  return NextResponse.json({ ok: true });
}
