import {
  articles as seed,
  Article,
  Category,
} from './data';
import { getPublishedArticles, getPublishedBySlug, StoredArticle } from './articles';

function byDateDesc(a: Article, b: Article): number {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

/** All public articles: writer-published (from Redis) merged with the built-in seed set. */
export async function getMergedArticles(): Promise<Article[]> {
  const published = await getPublishedArticles();
  return [...published, ...seed];
}

export async function getLatest(count = 8): Promise<Article[]> {
  const all = await getMergedArticles();
  return all.sort(byDateDesc).slice(0, count);
}

export async function getPopular(
  count = 8,
  viewCounts: Record<string, number> = {},
): Promise<Article[]> {
  const all = await getMergedArticles();
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

  const recent: Article[] = [];
  const rest: Article[] = [];
  for (const a of all) {
    if (new Date(a.date) >= threeMonthsAgo) recent.push(a);
    else rest.push(a);
  }
  recent.sort(byDateDesc);
  rest.sort((a, b) => (viewCounts[b.slug] ?? 0) - (viewCounts[a.slug] ?? 0));
  return [...recent, ...rest].slice(0, count);
}

export async function getByCategory(category: Category): Promise<Article[]> {
  const all = await getMergedArticles();
  return all.filter((a) => a.category === category).sort(byDateDesc);
}

export async function searchArticles(query: string): Promise<Article[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const all = await getMergedArticles();
  return all
    .filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.categoryLabel.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q),
    )
    .sort(byDateDesc);
}

export async function getRandomFeatured(): Promise<Article> {
  const all = await getMergedArticles();
  // Deterministic per-day rotation avoids impure render while still rotating.
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return all[dayIndex % all.length];
}

/** A published, writer-authored article for the article page (markdown body). */
export async function getDynamicArticle(slug: string): Promise<StoredArticle | null> {
  return getPublishedBySlug(slug);
}
