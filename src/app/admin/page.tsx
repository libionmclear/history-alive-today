import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getSiteStats, DEPTH_BUCKETS } from '@/lib/views';
import { getMergedArticles } from '@/lib/content';
import { categoryLabels, type Category } from '@/lib/data';
import DashboardNav from '@/components/admin/DashboardNav';

export const dynamic = 'force-dynamic';

const GOLD = '#e2b26f';
const SLATE = '#5b7c8d';
const WINDOW_DAYS = 30;

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const DAY_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});
const SHORT_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

function dayToDate(key: string): Date {
  return new Date(`${key}T00:00:00Z`);
}

/** '2026-09-10' -> 'Sep 10, 2026' */
function fmtDay(key: string | null | undefined): string {
  if (!key) return '—';
  const d = dayToDate(key);
  return Number.isNaN(d.getTime()) ? '—' : DAY_FMT.format(d);
}

/** '2026-09-10' -> 'Sep 10' */
function fmtShortDay(key: string): string {
  const d = dayToDate(key);
  return Number.isNaN(d.getTime()) ? key : SHORT_FMT.format(d);
}

/** A stored epoch-ms timestamp -> 'Sep 10, 2026' */
function fmtStamp(ms: number | undefined | null): string {
  const n = Number(ms ?? 0);
  return n > 0 ? DAY_FMT.format(new Date(n)) : '—';
}

/** 'today' / 'yesterday' / '6 days ago' for a stored timestamp. */
function fmtAgo(ms: number | undefined | null, todayKey: string): string {
  const n = Number(ms ?? 0);
  if (!n) return 'never';
  const day = isoDay(n);
  if (day === todayKey) return 'today';
  const diff = Math.round((dayToDate(todayKey).getTime() - dayToDate(day).getTime()) / 86_400_000);
  if (diff === 1) return 'yesterday';
  if (diff > 1 && diff < 30) return `${diff} days ago`;
  return fmtStamp(n);
}

function fmtDuration(ms: number): string {
  if (!ms || ms < 1000) return '—';
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function pct(value: number, total: number): string {
  if (!total || !value) return '0%';
  const p = (value / total) * 100;
  return `${p >= 10 ? Math.round(p) : p.toFixed(1)}%`;
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

function ratio(value: number, per: number): string {
  if (!per) return '—';
  return (value / per).toFixed(1);
}

function flag(code: string): string {
  if (code.length !== 2) return '🌐';
  const A = 0x1f1e6;
  const cc = code.toUpperCase();
  return String.fromCodePoint(A + (cc.charCodeAt(0) - 65), A + (cc.charCodeAt(1) - 65));
}

function sortedEntries(rec: Record<string, number>): [string, number][] {
  return Object.entries(rec)
    .map(([k, v]) => [k, Number(v)] as [string, number])
    .sort((a, b) => b[1] - a[1]);
}

function sumValues(rec: Record<string, number>): number {
  return Object.values(rec).reduce((s, v) => s + Number(v), 0);
}

/** The oldest YYYY-MM-DD key in a daily hash — i.e. when that metric started. */
function earliestDay(rec: Record<string, number>): string | null {
  const keys = Object.keys(rec).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k));
  return keys.length ? keys.sort()[0] : null;
}

function isoDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Presentational bits
// ---------------------------------------------------------------------------

function Bar({ value, max, color = GOLD }: { value: number; max: number; color?: string }) {
  const width = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <p className="text-xs uppercase tracking-widest text-[#aaaaaa] font-semibold">{label}</p>
      <p className="text-3xl font-bold text-[#333333] mt-2">{value}</p>
      {sub && <p className="text-sm text-[#888888] mt-1">{sub}</p>}
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-bold text-[#333333] mb-1">{title}</h2>
      {hint && <p className="text-sm text-[#888888] mb-5">{hint}</p>}
      {!hint && <div className="mb-5" />}
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[#aaa]">{children}</p>;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/writer');

  const stats = await getSiteStats(WINDOW_DAYS);

  if (!stats.available) {
    return (
      <>
        <DashboardNav user={user} active="analytics" />
        <main className="max-w-3xl mx-auto px-4 py-16">
          <h1 className="text-2xl font-bold text-[#333333]">Analytics unavailable</h1>
          <p className="text-[#888888] mt-2">
            Redis is not connected. Create an Upstash Redis store in Vercel
            (Storage tab) and connect it to this project, then redeploy. The app
            reads either <code>KV_REST_API_URL</code>/<code>KV_REST_API_TOKEN</code>{' '}
            or <code>UPSTASH_REDIS_REST_URL</code>/<code>UPSTASH_REDIS_REST_TOKEN</code>.
          </p>
        </main>
      </>
    );
  }

  const allArticles = await getMergedArticles();
  const titleBySlug = new Map(allArticles.map((a) => [a.slug, a.title]));
  const titleFor = (slug: string) => titleBySlug.get(slug) ?? slug;

  /** Friendly name for a tracked path. */
  const pageLabel = (path: string): string => {
    if (path === '/') return 'Home';
    if (path === '/search') return 'Search';
    if (path === '/other') return 'Other / unrecognised URLs';
    const article = /^\/article\/(.+)$/.exec(path);
    if (article) return titleFor(article[1]);
    const category = /^\/category\/(.+)$/.exec(path);
    if (category) return `${categoryLabels[category[1] as Category] ?? category[1]} (category)`;
    return path;
  };

  // --- Articles ------------------------------------------------------------
  const viewEntries = sortedEntries(stats.views);
  const totalArticleViews = sumValues(stats.views);
  const maxView = viewEntries[0]?.[1] ?? 0;
  const neverViewed = allArticles.filter((a) => !(a.slug in stats.views));

  // --- Every page ----------------------------------------------------------
  const pageEntries = sortedEntries(stats.pages);
  const totalPageViews = sumValues(stats.pages);
  const maxPage = pageEntries[0]?.[1] ?? 0;

  // --- Visitors & sessions -------------------------------------------------
  // The depth histogram counts each session once, in the bucket it reached.
  const depthEntries = DEPTH_BUCKETS.map(
    (bucket) => [bucket, Math.max(0, Number(stats.depth[bucket] ?? 0))] as [string, number],
  );
  const totalSessions = depthEntries.reduce((s, [, v]) => s + v, 0);
  const maxDepth = Math.max(0, ...depthEntries.map(([, v]) => v));
  const singlePageSessions = depthEntries.find(([b]) => b === '1')?.[1] ?? 0;

  // --- Dwell ---------------------------------------------------------------
  const perArticleDwell = Object.keys(stats.dwellTotal).map((slug) => {
    const total = Number(stats.dwellTotal[slug] ?? 0);
    const count = Number(stats.dwellCount[slug] ?? 0);
    return { slug, avg: count > 0 ? total / count : 0, count };
  });
  const dwellCountAll = sumValues(stats.dwellCount);
  const avgDwellAll = dwellCountAll > 0 ? sumValues(stats.dwellTotal) / dwellCountAll : 0;
  const dwellByAvg = [...perArticleDwell].sort((a, b) => b.avg - a.avg);

  // --- Referrers & countries ----------------------------------------------
  const referrers = sortedEntries(stats.referrers);
  const maxRef = referrers[0]?.[1] ?? 0;
  const countries = sortedEntries(stats.countries);
  const maxCountry = countries[0]?.[1] ?? 0;
  const totalCountryHits = sumValues(stats.countries);
  const totalRefHits = sumValues(stats.referrers);

  // --- When each metric started -------------------------------------------
  const articlesSince = earliestDay(stats.daily);
  const sitewideSince = earliestDay(stats.pagesDaily);
  const trackingSince =
    articlesSince && sitewideSince
      ? articlesSince < sitewideSince
        ? articlesSince
        : sitewideSince
      : (articlesSince ?? sitewideSince);
  // "Today" comes from the stats window rather than the clock, so rendering
  // stays pure and the dates on the page all agree with the chart.
  const todayKey = stats.window[stats.window.length - 1];
  const trackedDays = trackingSince
    ? Math.max(
        1,
        Math.round((dayToDate(todayKey).getTime() - dayToDate(trackingSince).getTime()) / 86_400_000) + 1,
      )
    : 0;

  // --- Daily series --------------------------------------------------------
  // Site-wide page views only exist from the day that tracking shipped; before
  // that the best available total for a day is its article views.
  const days = stats.window.map((key) => {
    const pageViews = Number(stats.pagesDaily[key] ?? 0);
    const articleViews = Number(stats.daily[key] ?? 0);
    return {
      key,
      pageViews,
      articleViews,
      total: pageViews || articleViews,
      partial: pageViews === 0 && articleViews > 0,
      visitors: Number(stats.visitorsDaily[key] ?? 0),
      sessions: Number(stats.sessionsDaily[key] ?? 0),
    };
  });
  const maxDay = Math.max(1, ...days.map((d) => d.total));
  const windowViews = days.reduce((s, d) => s + d.total, 0);
  const windowVisitors = days.reduce((s, d) => s + d.visitors, 0);
  const windowSessions = days.reduce((s, d) => s + d.sessions, 0);
  const rangeLabel = `${fmtShortDay(days[0].key)} – ${fmtShortDay(days[days.length - 1].key)}`;

  return (
    <main className="bg-[#f7f9f9] min-h-screen">
      <DashboardNav user={user} active="analytics" />
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="h-[4px] w-12 bg-[#e2b26f] rounded mb-3" />
          <h1 className="text-3xl font-bold text-[#333333]">Site Analytics</h1>
          <p className="text-sm text-[#888888] mt-1">
            History Alive Today · live data from Redis ·{' '}
            {trackingSince
              ? `tracking since ${fmtDay(trackingSince)} (${plural(trackedDays, 'day')})`
              : 'no data collected yet'}
          </p>
        </div>

        {/* Traffic */}
        <h2 className="text-xs uppercase tracking-widest text-[#aaaaaa] font-semibold mb-3">
          Traffic
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total page views"
            value={totalPageViews.toLocaleString()}
            sub={sitewideSince ? `every page, since ${fmtDay(sitewideSince)}` : 'starts at next deploy'}
          />
          <StatCard
            label="Article views"
            value={totalArticleViews.toLocaleString()}
            sub={articlesSince ? `since ${fmtDay(articlesSince)}` : 'no views yet'}
          />
          <StatCard
            label={`Views (${WINDOW_DAYS} days)`}
            value={windowViews.toLocaleString()}
            sub={rangeLabel}
          />
          <StatCard
            label="Articles tracked"
            value={`${viewEntries.length} of ${allArticles.length}`}
            sub={
              neverViewed.length > 0
                ? `${neverViewed.length} never opened yet`
                : 'every article has been read'
            }
          />
        </div>

        {/* Audience */}
        <h2 className="text-xs uppercase tracking-widest text-[#aaaaaa] font-semibold mb-3">
          Audience
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard
            label="Unique visitors"
            value={stats.visitors.toLocaleString()}
            sub={`${windowVisitors.toLocaleString()} in the last ${WINDOW_DAYS} days`}
          />
          <StatCard
            label="Pages per visitor"
            value={ratio(totalPageViews, stats.visitors)}
            sub={`${ratio(totalSessions, stats.visitors)} visits each`}
          />
          <StatCard
            label="Pages per visit"
            value={ratio(totalPageViews, totalSessions)}
            sub={`${totalSessions.toLocaleString()} visits · ${windowSessions.toLocaleString()} in ${WINDOW_DAYS}d`}
          />
          <StatCard
            label="Avg. time on page"
            value={fmtDuration(avgDwellAll)}
            sub={`${dwellCountAll.toLocaleString()} reads measured`}
          />
        </div>

        {/* Views over time */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-10">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
            <h2 className="text-lg font-bold text-[#333333]">Views over time</h2>
            <div className="flex items-center gap-4 text-xs text-[#888888]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-sm inline-block" style={{ backgroundColor: GOLD }} />
                page views
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-sm inline-block" style={{ backgroundColor: SLATE }} />
                unique visitors
              </span>
            </div>
          </div>
          <p className="text-sm text-[#888888] mb-5">
            {rangeLabel} (UTC) · {windowViews.toLocaleString()} views ·{' '}
            {windowSessions.toLocaleString()} visits
          </p>
          <div className="flex items-end gap-1 h-40">
            {days.map((d) => (
              <div
                key={d.key}
                className="flex-1 flex flex-col items-center justify-end group relative h-full"
              >
                <div className="w-full h-full flex items-end justify-center gap-[2px]">
                  <div
                    className="w-1/2 rounded-t transition-all"
                    style={{
                      height: `${Math.max(2, (d.total / maxDay) * 100)}%`,
                      backgroundColor: d.total > 0 ? (d.partial ? '#f0d9b6' : GOLD) : '#e5e7eb',
                    }}
                  />
                  <div
                    className="w-1/2 rounded-t transition-all"
                    style={{
                      height: `${Math.max(2, (d.visitors / maxDay) * 100)}%`,
                      backgroundColor: d.visitors > 0 ? SLATE : '#e5e7eb',
                    }}
                  />
                </div>
                <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 text-xs text-[#555] bg-white px-2 py-1 rounded shadow-md whitespace-nowrap text-left">
                  <div className="font-semibold text-[#333]">{fmtDay(d.key)}</div>
                  <div>{d.total.toLocaleString()} views{d.partial ? ' (articles only)' : ''}</div>
                  <div>{d.articleViews.toLocaleString()} article views</div>
                  <div>{d.visitors.toLocaleString()} visitors · {d.sessions.toLocaleString()} visits</div>
                </div>
              </div>
            ))}
          </div>
          {days.some((d) => d.partial) && (
            <p className="text-xs text-[#bbb] mt-4">
              Lighter bars predate site-wide tracking, so they count article views only.
            </p>
          )}
        </section>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Most viewed */}
          <Section title="Most viewed stories" hint={`All time${articlesSince ? ` · since ${fmtDay(articlesSince)}` : ''}`}>
            {viewEntries.length === 0 ? (
              <Empty>No views yet.</Empty>
            ) : (
              <ul className="space-y-4">
                {viewEntries.slice(0, 15).map(([slug, count], i) => (
                  <li key={slug}>
                    <div className="flex items-baseline justify-between gap-3 mb-1">
                      <Link
                        href={`/article/${slug}`}
                        className="text-sm text-[#333] hover:text-[#e2b26f] transition-colors line-clamp-1"
                      >
                        <span className="text-[#bbb] mr-2">{i + 1}.</span>
                        {titleFor(slug)}
                      </Link>
                      <span className="text-sm font-semibold text-[#333] shrink-0">
                        {count.toLocaleString()}
                      </span>
                    </div>
                    <Bar value={count} max={maxView} />
                    <div className="flex items-baseline justify-between gap-3 mt-1 text-xs text-[#aaa]">
                      <span>
                        first view {fmtStamp(stats.articleFirstSeen[slug])} · last{' '}
                        {fmtAgo(stats.articleLastSeen[slug], todayKey)}
                      </span>
                      <span>{pct(count, totalArticleViews)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Every page */}
          <Section
            title="Most visited pages"
            hint="Every page, including home, categories and search"
          >
            {pageEntries.length === 0 ? (
              <Empty>
                Site-wide page tracking starts with the next deploy — until then only article
                pages are counted.
              </Empty>
            ) : (
              <ul className="space-y-4">
                {pageEntries.slice(0, 15).map(([path, count]) => (
                  <li key={path}>
                    <div className="flex items-baseline justify-between gap-3 mb-1">
                      <span className="text-sm text-[#333] line-clamp-1">{pageLabel(path)}</span>
                      <span className="text-sm font-semibold text-[#333] shrink-0">
                        {count.toLocaleString()}
                      </span>
                    </div>
                    <Bar value={count} max={maxPage} color={SLATE} />
                    <div className="flex items-baseline justify-between gap-3 mt-1 text-xs text-[#aaa]">
                      <span className="line-clamp-1">
                        {path} · since {fmtStamp(stats.pageFirstSeen[path])}
                      </span>
                      <span className="shrink-0">{pct(count, totalPageViews)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Session depth */}
          <Section
            title="Pages per visit"
            hint="How many pages one visitor opens before leaving (a visit ends after 30 idle minutes)"
          >
            {totalSessions === 0 ? (
              <Empty>No visits recorded yet — this starts with the next deploy.</Empty>
            ) : (
              <>
                <ul className="space-y-4">
                  {depthEntries.map(([bucket, count]) => (
                    <li key={bucket}>
                      <div className="flex items-baseline justify-between gap-3 mb-1">
                        <span className="text-sm text-[#333]">
                          {bucket} {bucket === '1' ? 'page' : 'pages'}
                        </span>
                        <span className="text-sm font-semibold text-[#333] shrink-0">
                          {count.toLocaleString()}{' '}
                          <span className="text-[#bbb] font-normal">
                            ({pct(count, totalSessions)})
                          </span>
                        </span>
                      </div>
                      <Bar value={count} max={maxDepth} />
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-[#888888] mt-5">
                  {pct(singlePageSessions, totalSessions)} of visits stop at one page, and the
                  average visit covers {ratio(totalPageViews, totalSessions)} pages.
                </p>
              </>
            )}
          </Section>

          {/* Engagement / dwell */}
          <Section title="Most engaging stories" hint="Average time on page, with reads measured">
            {dwellByAvg.length === 0 ? (
              <Empty>No engagement data yet.</Empty>
            ) : (
              <ul className="space-y-3">
                {dwellByAvg.slice(0, 15).map(({ slug, avg, count }) => (
                  <li key={slug} className="flex items-baseline justify-between gap-3">
                    <Link
                      href={`/article/${slug}`}
                      className="text-sm text-[#333] hover:text-[#e2b26f] transition-colors line-clamp-1"
                    >
                      {titleFor(slug)}
                    </Link>
                    <span className="text-sm font-semibold text-[#333] shrink-0">
                      {fmtDuration(avg)}{' '}
                      <span className="text-[#bbb] font-normal">({count})</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Referrers */}
          <Section title="Where people come from" hint="Counted once per entry, not once per page">
            {referrers.length === 0 ? (
              <Empty>No referrer data yet.</Empty>
            ) : (
              <ul className="space-y-4">
                {referrers.slice(0, 12).map(([source, count]) => (
                  <li key={source}>
                    <div className="flex items-baseline justify-between gap-3 mb-1">
                      <span className="text-sm text-[#333] line-clamp-1">{source}</span>
                      <span className="text-sm font-semibold text-[#333] shrink-0">
                        {count.toLocaleString()}{' '}
                        <span className="text-[#bbb] font-normal">
                          ({pct(count, totalRefHits)})
                        </span>
                      </span>
                    </div>
                    <Bar value={count} max={maxRef} />
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Countries */}
          <Section title="Top countries" hint="From Vercel geo headers — production only">
            {countries.length === 0 ? (
              <Empty>No country data yet.</Empty>
            ) : (
              <ul className="space-y-4">
                {countries.slice(0, 12).map(([code, count]) => (
                  <li key={code}>
                    <div className="flex items-baseline justify-between gap-3 mb-1">
                      <span className="text-sm text-[#333]">
                        <span className="mr-2">{flag(code)}</span>
                        {code}
                      </span>
                      <span className="text-sm font-semibold text-[#333] shrink-0">
                        {count.toLocaleString()}{' '}
                        <span className="text-[#bbb] font-normal">
                          ({pct(count, totalCountryHits)})
                        </span>
                      </span>
                    </div>
                    <Bar value={count} max={maxCountry} />
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Never opened */}
          <Section
            title="Never opened"
            hint={`${neverViewed.length} of ${allArticles.length} articles have no recorded view`}
          >
            {neverViewed.length === 0 ? (
              <Empty>Every article has been read at least once.</Empty>
            ) : (
              <ul className="space-y-3">
                {neverViewed.slice(0, 15).map((a) => (
                  <li key={a.slug} className="flex items-baseline justify-between gap-3">
                    <Link
                      href={`/article/${a.slug}`}
                      className="text-sm text-[#333] hover:text-[#e2b26f] transition-colors line-clamp-1"
                    >
                      {a.title}
                    </Link>
                    <span className="text-xs text-[#aaa] shrink-0">{a.date}</span>
                  </li>
                ))}
                {neverViewed.length > 15 && (
                  <li className="text-xs text-[#bbb]">
                    …and {neverViewed.length - 15} more.
                  </li>
                )}
              </ul>
            )}
          </Section>
        </div>

        <p className="text-xs text-[#bbb] mt-10 text-center max-w-2xl mx-auto leading-relaxed">
          Views are counted in the browser, so crawlers and readers who leave before the page
          loads never appear here — expect Vercel Analytics to read higher. Visitors are counted
          with an anonymous random id in local storage; a browser that blocks storage still counts
          as a view but not as a visitor. Admin and writer pages are excluded. For historical
          traffic, devices, and Web Vitals, see your{' '}
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-[#e2b26f]"
          >
            Vercel dashboard
          </a>
          .
        </p>
      </div>
    </main>
  );
}
