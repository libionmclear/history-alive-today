import { getRedis } from './redis';

// ---------------------------------------------------------------------------
// Redis keys
// ---------------------------------------------------------------------------

// Article-level (the original set — history goes back to the first deploy).
const K_VIEWS = 'article-views'; // hash: slug -> total views
const K_DAILY = 'views:daily'; // hash: YYYY-MM-DD -> article views that day
const K_REFERRERS = 'referrers'; // hash: source -> count
const K_COUNTRIES = 'countries'; // hash: country code -> count
const K_DWELL_TOTAL = 'dwell-total'; // hash: slug -> total ms across sessions
const K_DWELL_COUNT = 'dwell-count'; // hash: slug -> number of dwell samples

// Site-wide: every page, not just articles. These start empty on first deploy.
const K_PAGES = 'page-views'; // hash: path -> total views
const K_PAGES_DAILY = 'pages:daily'; // hash: YYYY-MM-DD -> page views that day
const K_PAGE_FIRST = 'page-first-seen'; // hash: path -> ms of first view
const K_PAGE_LAST = 'page-last-seen'; // hash: path -> ms of most recent view
const K_ART_FIRST = 'article-first-seen'; // hash: slug -> ms of first view
const K_ART_LAST = 'article-last-seen'; // hash: slug -> ms of most recent view

// Visitors & sessions.
const K_VISITORS = 'visitors:all'; // HyperLogLog of every visitor id ever seen
const K_VISITORS_DAY = (day: string) => `visitors:day:${day}`; // HLL per day
const K_SESSION = (vid: string) => `session:${vid}`; // page depth, sliding TTL
const K_ART_SESSION = (vid: string) => `session:art:${vid}`; // article depth, same TTL
const K_SESSIONS_DAILY = 'sessions:daily'; // hash: YYYY-MM-DD -> sessions started
const K_DEPTH = 'session-depth'; // hash: pages-per-visit bucket -> visits
const K_ART_DEPTH = 'session-article-depth'; // hash: articles-per-visit bucket -> visits
const K_VISIT_TIME = 'visit-time-total'; // string: total measured ms across all pages
const K_PAGE_DWELL_COUNT = 'page-dwell-count'; // string: pages with a measured time

/** A session ends after this many idle seconds. */
const SESSION_TTL = 30 * 60;
/** Daily visitor sets are only needed for the 30-day chart; keep ~4 months. */
const VISITOR_DAY_TTL = 120 * 24 * 60 * 60;

/** Buckets for "how many pages does one visit cover", in display order. */
export const DEPTH_BUCKETS = ['1', '2', '3', '4-5', '6-10', '11+'] as const;

function depthBucket(pages: number): string {
  if (pages <= 1) return '1';
  if (pages <= 3) return String(pages);
  if (pages <= 5) return '4-5';
  if (pages <= 10) return '6-10';
  return '11+';
}

/** Minimal shape of the pipeline commands the bucket helper needs. */
type BucketPipeline = { hincrby: (key: string, field: string, by: number) => unknown };

/**
 * Moves a visit from the bucket it was in to the one it has now grown into,
 * so each visit is counted exactly once at its final depth.
 */
function rebucket(p: BucketPipeline, key: string, depth: number): void {
  const before = depthBucket(depth - 1);
  const after = depthBucket(depth);
  if (before === after) return;
  p.hincrby(key, before, -1);
  p.hincrby(key, after, 1);
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/** The last `n` UTC dates as YYYY-MM-DD, oldest first, ending today. */
export function lastNDays(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/** The back office and auth screens are our own traffic, never reader traffic. */
const EXCLUDED_PREFIXES = ['/admin', '/writer', '/login', '/api'];
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
const VISITOR_ID_RE = /^[a-z0-9-]{8,64}$/i;

/**
 * Canonical form of a visited path, or null when it must not be tracked.
 * Anything that is not a route we actually serve collapses to `/other`, so a
 * crawler poking at random URLs cannot grow the hash without bound.
 */
export function normalizePath(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/')) return null;

  let path = trimmed.split('?')[0].split('#')[0].toLowerCase();
  if (path.length > 1) path = path.replace(/\/+$/, '');
  if (!path) path = '/';
  if (EXCLUDED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return null;

  if (path === '/' || path === '/search') return path;

  const match = /^\/(article|category)\/([^/]+)$/.exec(path);
  if (match) return SLUG_RE.test(match[2]) ? `/${match[1]}/${match[2]}` : '/other';

  return '/other';
}

/** The article slug a canonical path points at, if it is an article page. */
export function slugFromPath(path: string): string | null {
  const match = /^\/article\/([^/]+)$/.exec(path);
  return match ? match[1] : null;
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

function cleanVisitorId(value: unknown): string | null {
  const id = typeof value === 'string' ? value.trim() : '';
  return VISITOR_ID_RE.test(id) ? id : null;
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function incrementView(slug: string): Promise<number> {
  const r = getRedis();
  if (!r) return 0;
  return await r.hincrby(K_VIEWS, slug, 1);
}

export interface VisitMeta {
  referrer?: string | null;
  country?: string | null;
  selfHost?: string | null;
  visitorId?: string | null;
}

export interface VisitResult {
  path: string;
  slug: string | null;
  views: number; // total views this path has ever had
  sessionPages: number; // pages this visitor has seen in the current visit
  sessionArticles: number; // articles this visitor has read in the current visit
}

/**
 * Records one page view plus its visitor, session, referrer and country
 * dimensions. Returns null when the path is untracked (back office) or Redis
 * is not configured.
 */
export async function trackVisit(rawPath: string, meta: VisitMeta): Promise<VisitResult | null> {
  const r = getRedis();
  const path = normalizePath(rawPath);
  if (!r || !path) return null;

  const now = Date.now();
  const today = todayUTC();
  const slug = slugFromPath(path);
  const vid = cleanVisitorId(meta.visitorId);

  // Bump the session counters first: their values are this visit's page and
  // article depth, and a 1 means a brand new visit (the key expired or never
  // existed). Both are needed before the main pipeline can bucket them.
  let sessionPages = 0;
  let sessionArticles = 0;
  if (vid) {
    const counters = r.pipeline();
    counters.incr(K_SESSION(vid));
    if (slug) counters.incr(K_ART_SESSION(vid));
    const counted = (await counters.exec()) as unknown[];
    sessionPages = Number(counted[0] ?? 0);
    sessionArticles = slug ? Number(counted[1] ?? 0) : 0;
  }

  const p = r.pipeline();
  p.hincrby(K_PAGES, path, 1); // result [0] — total views of this path
  p.hincrby(K_PAGES_DAILY, today, 1);
  p.hsetnx(K_PAGE_FIRST, path, now);
  p.hset(K_PAGE_LAST, { [path]: now });

  if (slug) {
    p.hincrby(K_VIEWS, slug, 1);
    p.hincrby(K_DAILY, today, 1);
    p.hsetnx(K_ART_FIRST, slug, now);
    p.hset(K_ART_LAST, { [slug]: now });
  }

  const source = referrerSource(meta.referrer ?? null, meta.selfHost ?? null);
  if (source) p.hincrby(K_REFERRERS, source, 1);

  const country = (meta.country ?? '').trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(country)) p.hincrby(K_COUNTRIES, country, 1);

  if (vid) {
    p.expire(K_SESSION(vid), SESSION_TTL);
    // Refreshed on every view, not just article views, so the two session keys
    // always expire together and one visit can't be split into two.
    p.expire(K_ART_SESSION(vid), SESSION_TTL);
    p.pfadd(K_VISITORS, vid);
    p.pfadd(K_VISITORS_DAY(today), vid);
    p.expire(K_VISITORS_DAY(today), VISITOR_DAY_TTL);

    // Keep the depth histograms counting *visits*, not views: a visit moves out
    // of its old bucket as it grows rather than being counted twice.
    if (sessionPages <= 1) {
      p.hincrby(K_SESSIONS_DAILY, today, 1);
      p.hincrby(K_DEPTH, depthBucket(1), 1);
    } else {
      rebucket(p, K_DEPTH, sessionPages);
    }

    if (slug) {
      if (sessionArticles <= 1) p.hincrby(K_ART_DEPTH, depthBucket(1), 1);
      else rebucket(p, K_ART_DEPTH, sessionArticles);
    }
  }

  const results = (await p.exec()) as unknown[];
  return { path, slug, views: Number(results[0] ?? 0), sessionPages, sessionArticles };
}

/**
 * Records how long (ms) a reader stayed on a page. Every page feeds the
 * site-wide total that "time per visit" divides up; only article pages get
 * their own per-slug average, which is what the engagement list ranks on.
 */
export async function trackDwell(rawPath: string, ms: number): Promise<void> {
  const r = getRedis();
  const path = normalizePath(rawPath);
  if (!r || !path) return;

  // Clamp to a sane range: ignore <1s (bounce noise) and cap at 1h.
  const clamped = Math.min(Math.max(Math.round(ms), 0), 60 * 60 * 1000);
  if (clamped < 1000) return;

  const p = r.pipeline();
  p.incrby(K_VISIT_TIME, clamped);
  p.incr(K_PAGE_DWELL_COUNT);

  const slug = slugFromPath(path);
  if (slug) {
    p.hincrby(K_DWELL_TOTAL, slug, clamped);
    p.hincrby(K_DWELL_COUNT, slug, 1);
  }

  await p.exec();
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getViewCounts(): Promise<Record<string, number>> {
  const r = getRedis();
  if (!r) return {};
  const data = await r.hgetall<Record<string, number>>(K_VIEWS);
  return data ?? {};
}

export interface SiteStats {
  available: boolean;
  /** slug -> total article views (all time). */
  views: Record<string, number>;
  /** YYYY-MM-DD -> article views that day. */
  daily: Record<string, number>;
  /** path -> total views, every page type. */
  pages: Record<string, number>;
  /** YYYY-MM-DD -> page views that day (all pages). */
  pagesDaily: Record<string, number>;
  pageFirstSeen: Record<string, number>;
  pageLastSeen: Record<string, number>;
  articleFirstSeen: Record<string, number>;
  articleLastSeen: Record<string, number>;
  referrers: Record<string, number>;
  countries: Record<string, number>;
  dwellTotal: Record<string, number>;
  dwellCount: Record<string, number>;
  /** YYYY-MM-DD -> visits started that day. */
  sessionsDaily: Record<string, number>;
  /** Pages-per-visit bucket -> number of visits that reached it. */
  depth: Record<string, number>;
  /** Articles-per-visit bucket -> number of visits that reached it. */
  articleDepth: Record<string, number>;
  /** Total measured time on page across every page, in ms. */
  visitTimeTotal: number;
  /** How many page views contributed a measured time. */
  pageDwellCount: number;
  /** Unique visitors, all time (HyperLogLog estimate). */
  visitors: number;
  /** YYYY-MM-DD -> unique visitors that day, for the requested window. */
  visitorsDaily: Record<string, number>;
  /** The window `visitorsDaily` covers, oldest first. */
  window: string[];
}

const EMPTY_STATS: SiteStats = {
  available: false,
  views: {},
  daily: {},
  pages: {},
  pagesDaily: {},
  pageFirstSeen: {},
  pageLastSeen: {},
  articleFirstSeen: {},
  articleLastSeen: {},
  referrers: {},
  countries: {},
  dwellTotal: {},
  dwellCount: {},
  sessionsDaily: {},
  depth: {},
  articleDepth: {},
  visitTimeTotal: 0,
  pageDwellCount: 0,
  visitors: 0,
  visitorsDaily: {},
  window: [],
};

function asRecord(value: Record<string, number> | null): Record<string, number> {
  return value ?? {};
}

/** Reads every analytics dimension in two batches for the admin dashboard. */
export async function getSiteStats(days = 30): Promise<SiteStats> {
  const r = getRedis();
  if (!r) return { ...EMPTY_STATS };

  const window = lastNDays(days);

  const [
    views,
    daily,
    pages,
    pagesDaily,
    pageFirstSeen,
    pageLastSeen,
    articleFirstSeen,
    articleLastSeen,
    referrers,
    countries,
    dwellTotal,
    dwellCount,
    sessionsDaily,
    depth,
    articleDepth,
    visitTimeTotal,
    pageDwellCount,
    visitors,
  ] = await Promise.all([
    r.hgetall<Record<string, number>>(K_VIEWS),
    r.hgetall<Record<string, number>>(K_DAILY),
    r.hgetall<Record<string, number>>(K_PAGES),
    r.hgetall<Record<string, number>>(K_PAGES_DAILY),
    r.hgetall<Record<string, number>>(K_PAGE_FIRST),
    r.hgetall<Record<string, number>>(K_PAGE_LAST),
    r.hgetall<Record<string, number>>(K_ART_FIRST),
    r.hgetall<Record<string, number>>(K_ART_LAST),
    r.hgetall<Record<string, number>>(K_REFERRERS),
    r.hgetall<Record<string, number>>(K_COUNTRIES),
    r.hgetall<Record<string, number>>(K_DWELL_TOTAL),
    r.hgetall<Record<string, number>>(K_DWELL_COUNT),
    r.hgetall<Record<string, number>>(K_SESSIONS_DAILY),
    r.hgetall<Record<string, number>>(K_DEPTH),
    r.hgetall<Record<string, number>>(K_ART_DEPTH),
    r.get<number | string>(K_VISIT_TIME),
    r.get<number | string>(K_PAGE_DWELL_COUNT),
    r.pfcount(K_VISITORS),
  ]);

  // One HyperLogLog count per day in the window, batched into a single call.
  const dayPipeline = r.pipeline();
  for (const day of window) dayPipeline.pfcount(K_VISITORS_DAY(day));
  const dayCounts = (await dayPipeline.exec()) as unknown[];

  const visitorsDaily: Record<string, number> = {};
  window.forEach((day, i) => {
    visitorsDaily[day] = Number(dayCounts[i] ?? 0);
  });

  return {
    available: true,
    views: asRecord(views),
    daily: asRecord(daily),
    pages: asRecord(pages),
    pagesDaily: asRecord(pagesDaily),
    pageFirstSeen: asRecord(pageFirstSeen),
    pageLastSeen: asRecord(pageLastSeen),
    articleFirstSeen: asRecord(articleFirstSeen),
    articleLastSeen: asRecord(articleLastSeen),
    referrers: asRecord(referrers),
    countries: asRecord(countries),
    dwellTotal: asRecord(dwellTotal),
    dwellCount: asRecord(dwellCount),
    sessionsDaily: asRecord(sessionsDaily),
    depth: asRecord(depth),
    articleDepth: asRecord(articleDepth),
    visitTimeTotal: Number(visitTimeTotal ?? 0),
    pageDwellCount: Number(pageDwellCount ?? 0),
    visitors: Number(visitors ?? 0),
    visitorsDaily,
    window,
  };
}
