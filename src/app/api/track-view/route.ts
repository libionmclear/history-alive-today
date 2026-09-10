import { NextRequest, NextResponse } from 'next/server';
import { trackVisit } from '@/lib/views';

export async function POST(request: NextRequest) {
  let body: { path?: unknown; slug?: unknown; referrer?: unknown; visitorId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  // `path` is what PageTracker sends; `slug` is the older article-only shape.
  const path =
    typeof body.path === 'string'
      ? body.path.trim()
      : typeof body.slug === 'string' && body.slug.trim()
        ? `/article/${body.slug.trim()}`
        : '';

  if (!path || path.length > 300) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const referrer = typeof body.referrer === 'string' ? body.referrer.slice(0, 500) : null;
  const visitorId = typeof body.visitorId === 'string' ? body.visitorId : null;
  // Vercel injects the visitor's country; falls back to null locally.
  const country = request.headers.get('x-vercel-ip-country');
  const selfHost = request.headers.get('host');

  const result = await trackVisit(path, { referrer, country, selfHost, visitorId });

  // A null result means the path is deliberately untracked (back office).
  return NextResponse.json({ views: result?.views ?? 0, tracked: result !== null });
}
