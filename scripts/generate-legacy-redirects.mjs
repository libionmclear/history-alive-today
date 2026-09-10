// Generates legacy-redirects.json — permanent redirects from the old WordPress
// URLs to the current /article/<slug> paths.
//
// Why this exists: the site used to be WordPress on the same domain, with posts
// at historyalivetoday.com/<slug>/. The rebuild moved them to /article/<slug>,
// so every link posted to Facebook before the rebuild now 404s. Rather than
// editing 60+ posts, we redirect the old paths.
//
// Two old shapes are covered, because WordPress may have used either permalink
// structure over the years:
//   /the-dark-origin-of-thumbs-up/          (post name)
//   /2021/02/the-dark-origin-of-thumbs-up/  (date + post name)
//
// Seven posts were also renamed during the migration; their old slugs are in
// RENAMED below, taken from scripts/fetch-articles.mjs.
//
// Runs automatically via the `prebuild` script. Safe to run by hand:
//   node scripts/generate-legacy-redirects.mjs

import fs from 'fs';

const DATA = 'src/lib/data.ts';
const OUT = 'legacy-redirects.json';

// Top-level routes that must never be treated as an article slug.
const RESERVED = new Set(['admin', 'api', 'login', 'search', 'writer', 'article', 'category']);

// Old WordPress slug -> current slug, for posts renamed during the migration.
const RENAMED = {
  'the-origin-of-thumbs-up': 'the-dark-origin-of-thumbs-up',
  'december-25th-the-birth-of-christmas': 'december-25th-birth-of-christmas',
  'origin-of-military-marching': 'the-beginning-of-military-marching',
  'history-of-the-flatbread-called-pizza': 'flatbreads-and-the-evolution-of-pizza',
  'why-does-it-costs-an-arm-and-a-leg': 'why-does-it-cost-an-arm-and-a-leg',
  'the-discovery-of-the-exclamation-eureka': 'the-discovery-of-eureka',
  'knowledge-of-ancient-medicines-lost-for-1000-years': 'ancient-medicines-lost-for-1000-years',
};

const source = fs.readFileSync(DATA, 'utf8');
const slugs = [...source.matchAll(/^\s+slug: '([^']+)',$/gm)].map((m) => m[1]);
if (!slugs.length) throw new Error(`no slugs found in ${DATA}`);

// old path segment -> current slug. A renamed post keeps BOTH: its old slug and
// its current one, since either may have been linked.
const pairs = new Map();
for (const slug of slugs) pairs.set(slug, slug);
for (const [oldSlug, current] of Object.entries(RENAMED)) {
  if (!slugs.includes(current))
    console.warn(`  warn  rename target missing from data.ts: ${current}`);
  pairs.set(oldSlug, current);
}

const redirects = [];
const skipped = [];
for (const [from, to] of [...pairs].sort()) {
  if (RESERVED.has(from)) {
    skipped.push(from);
    continue;
  }
  // Plain post-name permalink. Both slash forms are listed because
  // skipTrailingSlashRedirect is on: WordPress links end in a slash, and
  // letting Next strip it first would cost an extra redirect hop.
  redirects.push({ source: `/${from}`, destination: `/article/${to}`, permanent: true });
  redirects.push({ source: `/${from}/`, destination: `/article/${to}`, permanent: true });
  // Date-based permalink; the year/month are matched but discarded.
  redirects.push({
    source: `/:year(\\d{4})/:month(\\d{2})/${from}`,
    destination: `/article/${to}`,
    permanent: true,
  });
  redirects.push({
    source: `/:year(\\d{4})/:month(\\d{2})/${from}/`,
    destination: `/article/${to}`,
    permanent: true,
  });
}

const body = JSON.stringify(redirects, null, 2) + '\n';
const previous = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : null;
if (previous === body) {
  console.log(`legacy redirects: ${redirects.length} rules, unchanged`);
} else {
  fs.writeFileSync(OUT, body);
  console.log(`legacy redirects: wrote ${redirects.length} rules to ${OUT}`);
}
console.log(
  `legacy redirects: ${pairs.size} paths (${slugs.length} current slugs + ${Object.keys(RENAMED).length} renamed)`
);
if (skipped.length) console.log(`legacy redirects: skipped reserved ${skipped.join(', ')}`);
