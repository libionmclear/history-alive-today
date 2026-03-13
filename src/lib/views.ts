import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

export async function incrementView(slug: string): Promise<number> {
  const r = getRedis();
  if (!r) return 0;
  return await r.hincrby('article-views', slug, 1);
}

export async function getViewCounts(): Promise<Record<string, number>> {
  const r = getRedis();
  if (!r) return {};
  const data = await r.hgetall<Record<string, number>>('article-views');
  return data ?? {};
}
