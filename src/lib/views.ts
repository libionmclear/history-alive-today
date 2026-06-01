import { getRedis } from './redis';

// Redis keys
const K_VIEWS = 'article-views'; // hash: slug -> total views
const K_DAILY = 'views:daily'; // hash: YYYY-MM-DD -> total site views that day
const K_REFERRERS = 'referrers'; // hash: source -> count
const K_COUNTRIES = 'countries'; // hash: country code -> count
const K_DWELL_TOTAL = 'dwell-total'; // hash: slug -> total ms across sessions
const K_DWELL_COUNT = 'dwell-count'; // hash: slug -> number of dwell samples

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Normalizes a raw Referer URL into a display source, or null to skip. */
function referrerSource(referrer: string | null, selfHost: string | null): string | null {
  if (!referrer) return 'Direct / none';
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    if (!host) return 'Direct / none';
    if (selfHost && host === selfHost.replace(/^www\./, '')) return null; // internal navigation
    return host;
  } catch {
    return null;
  }
}

export async function incrementView(slug: string): Promise<number> {
  const r = getRedis();
  if (!r) return 0;
  return await r.hincrby(K_VIEWS, slug, 1);
}

export interface VisitMeta {
  referrer?: string | null;
  country?: string | null;
  selfHost?: string | null;
}

/** Records a page view plus its referrer/country dimensions. Returns the new view count. */
export async function trackVisit(slug: string, meta: VisitMeta): Promise<number> {
  const r = getRedis();
  if (!r) return 0;

  const views = await r.hincrby(K_VIEWS, slug, 1);

  const tasks: Promise<unknown>[] = [r.hincrby(K_DAILY, todayUTC(), 1)];

  const source = referrerSource(meta.referrer ?? null, meta.selfHost ?? null);
  if (source) tasks.push(r.hincrby(K_REFERRERS, source, 1));

  const country = (meta.country ?? '').trim().toUpperCase();
  if (country) tasks.push(r.hincrby(K_COUNTRIES, country, 1));

  await Promise.all(tasks);
  return views;
}

/** Records how long (ms) a reader stayed on an article. */
export async function trackDwell(slug: string, ms: number): Promise<void> {
  const r = getRedis();
  if (!r) return;
  // Clamp to a sane range: ignore <1s (bounce noise) and cap at 1h.
  const clamped = Math.min(Math.max(Math.round(ms), 0), 60 * 60 * 1000);
  if (clamped < 1000) return;
  await Promise.all([
    r.hincrby(K_DWELL_TOTAL, slug, clamped),
    r.hincrby(K_DWELL_COUNT, slug, 1),
  ]);
}

export async function getViewCounts(): Promise<Record<string, number>> {
  const r = getRedis();
  if (!r) return {};
  const data = await r.hgetall<Record<string, number>>(K_VIEWS);
  return data ?? {};
}

export interface SiteStats {
  available: boolean;
  views: Record<string, number>;
  daily: Record<string, number>;
  referrers: Record<string, number>;
  countries: Record<string, number>;
  dwellTotal: Record<string, number>;
  dwellCount: Record<string, number>;
}

/** Reads every analytics dimension in one batch for the admin dashboard. */
export async function getSiteStats(): Promise<SiteStats> {
  const r = getRedis();
  if (!r) {
    return {
      available: false,
      views: {},
      daily: {},
      referrers: {},
      countries: {},
      dwellTotal: {},
      dwellCount: {},
    };
  }

  const [views, daily, referrers, countries, dwellTotal, dwellCount] = await Promise.all([
    r.hgetall<Record<string, number>>(K_VIEWS),
    r.hgetall<Record<string, number>>(K_DAILY),
    r.hgetall<Record<string, number>>(K_REFERRERS),
    r.hgetall<Record<string, number>>(K_COUNTRIES),
    r.hgetall<Record<string, number>>(K_DWELL_TOTAL),
    r.hgetall<Record<string, number>>(K_DWELL_COUNT),
  ]);

  return {
    available: true,
    views: views ?? {},
    daily: daily ?? {},
    referrers: referrers ?? {},
    countries: countries ?? {},
    dwellTotal: dwellTotal ?? {},
    dwellCount: dwellCount ?? {},
  };
}
