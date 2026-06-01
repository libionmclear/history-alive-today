import { NextRequest, NextResponse } from 'next/server';
import { trackVisit } from '@/lib/views';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';

  if (!slug || slug.length > 200) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  const referrer = typeof body.referrer === 'string' ? body.referrer.slice(0, 500) : null;
  // Vercel injects the visitor's country; falls back to null locally.
  const country = request.headers.get('x-vercel-ip-country');
  const selfHost = request.headers.get('host');

  const views = await trackVisit(slug, { referrer, country, selfHost });
  return NextResponse.json({ views });
}
