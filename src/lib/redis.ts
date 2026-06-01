import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

/**
 * Shared Upstash Redis client, or null if env vars are not configured.
 * Accepts both Vercel KV (`KV_REST_API_*`) and the Upstash marketplace
 * integration (`UPSTASH_REDIS_REST_*`) naming, whichever is present.
 */
export function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}
