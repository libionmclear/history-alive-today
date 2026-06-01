import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getSiteStats } from '@/lib/views';
import { articles } from '@/lib/data';
import DashboardNav from '@/components/admin/DashboardNav';

export const dynamic = 'force-dynamic';

const GOLD = '#e2b26f';

function titleFor(slug: string): string {
  return articles.find((a) => a.slug === slug)?.title ?? slug;
}

function fmtDuration(ms: number): string {
  if (!ms || ms < 1000) return '—';
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
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

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: GOLD }} />
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

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/writer');

  const stats = await getSiteStats();

  if (!stats.available) {
    return (
      <>
        <DashboardNav user={user} active="analytics" />
        <main className="max-w-3xl mx-auto px-4 py-16">
          <h1 className="text-2xl font-bold text-[#333333]">Analytics unavailable</h1>
          <p className="text-[#888888] mt-2">
            Redis is not configured. Set <code>KV_REST_API_URL</code> and{' '}
            <code>KV_REST_API_TOKEN</code> to start collecting analytics.
          </p>
        </main>
      </>
    );
  }

  // Aggregate view totals
  const viewEntries = sortedEntries(stats.views);
  const totalViews = viewEntries.reduce((sum, [, v]) => sum + v, 0);
  const maxView = viewEntries[0]?.[1] ?? 0;

  // Dwell time: per-article average + site-wide average
  const perArticleDwell = Object.keys(stats.dwellTotal).map((slug) => {
    const total = Number(stats.dwellTotal[slug] ?? 0);
    const count = Number(stats.dwellCount[slug] ?? 0);
    return { slug, avg: count > 0 ? total / count : 0, count };
  });
  const dwellTotalAll = Object.values(stats.dwellTotal).reduce((s, v) => s + Number(v), 0);
  const dwellCountAll = Object.values(stats.dwellCount).reduce((s, v) => s + Number(v), 0);
  const avgDwellAll = dwellCountAll > 0 ? dwellTotalAll / dwellCountAll : 0;
  const dwellByAvg = [...perArticleDwell].sort((a, b) => b.avg - a.avg);

  // Referrers & countries
  const referrers = sortedEntries(stats.referrers);
  const maxRef = referrers[0]?.[1] ?? 0;
  const countries = sortedEntries(stats.countries);
  const maxCountry = countries[0]?.[1] ?? 0;

  // Views over last 30 days
  const days: { date: string; count: number }[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: Number(stats.daily[key] ?? 0) });
  }
  const maxDay = Math.max(1, ...days.map((d) => d.count));
  const last30Total = days.reduce((s, d) => s + d.count, 0);

  return (
    <main className="bg-[#f7f9f9] min-h-screen">
      <DashboardNav user={user} active="analytics" />
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="h-[4px] w-12 bg-[#e2b26f] rounded mb-3" />
          <h1 className="text-3xl font-bold text-[#333333]">Site Analytics</h1>
          <p className="text-sm text-[#888888] mt-1">
            History Alive Today · live data from Redis
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total views" value={totalViews.toLocaleString()} />
          <StatCard label="Articles tracked" value={String(viewEntries.length)} />
          <StatCard label="Avg. time on page" value={fmtDuration(avgDwellAll)} sub={`${dwellCountAll.toLocaleString()} sessions`} />
          <StatCard label="Views (30 days)" value={last30Total.toLocaleString()} />
        </div>

        {/* Views over time */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-10">
          <h2 className="text-lg font-bold text-[#333333] mb-1">Views over time</h2>
          <p className="text-sm text-[#888888] mb-5">Last 30 days (UTC)</p>
          <div className="flex items-end gap-1 h-40">
            {days.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end group relative">
                <div
                  className="w-full rounded-t transition-all"
                  style={{
                    height: `${Math.max(2, (d.count / maxDay) * 100)}%`,
                    backgroundColor: d.count > 0 ? GOLD : '#e5e7eb',
                  }}
                />
                <span className="absolute -top-6 text-xs text-[#555] bg-white px-1 rounded shadow-sm opacity-0 group-hover:opacity-100 whitespace-nowrap">
                  {d.date.slice(5)}: {d.count}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Most viewed */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#333333] mb-5">Most viewed stories</h2>
            {viewEntries.length === 0 ? (
              <p className="text-sm text-[#aaa]">No views yet.</p>
            ) : (
              <ul className="space-y-4">
                {viewEntries.slice(0, 12).map(([slug, count], i) => (
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
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Engagement / dwell */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#333333] mb-1">Most engaging stories</h2>
            <p className="text-sm text-[#888888] mb-5">Average time on page</p>
            {dwellByAvg.length === 0 ? (
              <p className="text-sm text-[#aaa]">No engagement data yet.</p>
            ) : (
              <ul className="space-y-3">
                {dwellByAvg.slice(0, 12).map(({ slug, avg, count }) => (
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
          </section>

          {/* Referrers */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#333333] mb-5">Where people come from</h2>
            {referrers.length === 0 ? (
              <p className="text-sm text-[#aaa]">No referrer data yet.</p>
            ) : (
              <ul className="space-y-4">
                {referrers.slice(0, 12).map(([source, count]) => (
                  <li key={source}>
                    <div className="flex items-baseline justify-between gap-3 mb-1">
                      <span className="text-sm text-[#333] line-clamp-1">{source}</span>
                      <span className="text-sm font-semibold text-[#333] shrink-0">
                        {count.toLocaleString()}
                      </span>
                    </div>
                    <Bar value={count} max={maxRef} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Countries */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#333333] mb-5">Top countries</h2>
            {countries.length === 0 ? (
              <p className="text-sm text-[#aaa]">
                No country data yet. (Populated by Vercel geo headers in production.)
              </p>
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
                        {count.toLocaleString()}
                      </span>
                    </div>
                    <Bar value={count} max={maxCountry} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <p className="text-xs text-[#bbb] mt-10 text-center">
          Custom analytics began collecting when this dashboard was deployed. For historical
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
