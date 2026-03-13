import { NextRequest, NextResponse } from 'next/server';
import { incrementView } from '@/lib/views';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';

  if (!slug || slug.length > 200) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  const views = await incrementView(slug);
  return NextResponse.json({ views });
}
