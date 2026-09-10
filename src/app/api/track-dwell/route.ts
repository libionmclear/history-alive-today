import { NextRequest, NextResponse } from 'next/server';
import { trackDwell } from '@/lib/views';

export async function POST(request: NextRequest) {
  // Sent via navigator.sendBeacon, so the body may arrive as text.
  let body: { path?: unknown; slug?: unknown; ms?: unknown };
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
  const ms = typeof body.ms === 'number' ? body.ms : Number(body.ms);

  if (!path || path.length > 300 || !Number.isFinite(ms)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  await trackDwell(path, ms);
  return NextResponse.json({ ok: true });
}
