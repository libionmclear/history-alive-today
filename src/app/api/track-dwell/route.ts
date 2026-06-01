import { NextRequest, NextResponse } from 'next/server';
import { trackDwell } from '@/lib/views';

export async function POST(request: NextRequest) {
  // Sent via navigator.sendBeacon, so the body may arrive as text.
  let body: { slug?: unknown; ms?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  const ms = typeof body.ms === 'number' ? body.ms : Number(body.ms);

  if (!slug || slug.length > 200 || !Number.isFinite(ms)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  await trackDwell(slug, ms);
  return NextResponse.json({ ok: true });
}
