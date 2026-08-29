import { getRedis } from './redis';
import { Article, Category, categoryLabels } from './data';

export type ArticleStatus = 'draft' | 'pending' | 'published' | 'rejected';

export interface StoredArticle {
  id: string;
  slug: string;
  title: string;
  category: Category;
  excerpt: string;
  bodyMarkdown: string;
  cardImage: string; // URL for the listing card thumbnail
  heroImage: string; // URL for the in-article hero image
  images: string[]; // every image the writer uploaded for this article
  authorUsername: string;
  authorName: string;
  status: ArticleStatus;
  reviewNote?: string;
  date: string; // human display date, set on publish
  createdAt: number;
  updatedAt: number;
  submittedAt?: number;
  publishedAt?: number;
}

// Redis keys
const A = (id: string) => `cms:article:${id}`;
const COUNTER = 'cms:article:counter';
const BY_AUTHOR = (u: string) => `cms:articles:author:${u}`;
const PENDING = 'cms:articles:pending';
const PUBLISHED = 'cms:articles:published';
const SLUG = (slug: string) => `cms:slug:${slug}`;

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'article';
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

async function read(id: string): Promise<StoredArticle | null> {
  const r = getRedis();
  if (!r) return null;
  const raw = await r.get<string | StoredArticle>(A(id));
  if (!raw) return null;
  return typeof raw === 'string' ? (JSON.parse(raw) as StoredArticle) : raw;
}

async function write(article: StoredArticle): Promise<void> {
  const r = getRedis();
  if (!r) return;
  await r.set(A(article.id), JSON.stringify(article));
}

export async function getArticle(id: string): Promise<StoredArticle | null> {
  return read(id);
}

export async function createDraft(authorUsername: string, authorName: string): Promise<StoredArticle> {
  const r = getRedis();
  if (!r) throw new Error('Storage not configured');
  const n = await r.incr(COUNTER);
  const now = Date.now();
  const article: StoredArticle = {
    id: `a${n}`,
    slug: '',
    title: '',
    category: 'things-we-do',
    excerpt: '',
    bodyMarkdown: '',
    cardImage: '',
    heroImage: '',
    images: [],
    authorUsername,
    authorName,
    status: 'draft',
    date: '',
    createdAt: now,
    updatedAt: now,
  };
  await write(article);
  await r.sadd(BY_AUTHOR(authorUsername), article.id);
  return article;
}

export type DraftPatch = Partial<
  Pick<StoredArticle, 'title' | 'category' | 'excerpt' | 'bodyMarkdown' | 'cardImage' | 'heroImage' | 'images'>
>;

/** Updates editable fields on a draft/rejected article. Returns the updated record. */
export async function updateArticle(id: string, patch: DraftPatch): Promise<StoredArticle | null> {
  const article = await read(id);
  if (!article) return null;
  const next: StoredArticle = {
    ...article,
    ...patch,
    updatedAt: Date.now(),
  };
  await write(next);
  return next;
}

export async function submitForReview(id: string): Promise<StoredArticle | null> {
  const r = getRedis();
  const article = await read(id);
  if (!r || !article) return null;
  const next: StoredArticle = {
    ...article,
    status: 'pending',
    submittedAt: Date.now(),
    updatedAt: Date.now(),
    reviewNote: undefined,
  };
  await write(next);
  await r.sadd(PENDING, id);
  return next;
}

async function uniqueSlug(base: string, id: string): Promise<string> {
  const r = getRedis();
  let slug = base;
  // Avoid clashing with already-published dynamic articles.
  if (r) {
    let suffix = 0;
    while (true) {
      const ownerId = await r.get<string>(SLUG(slug));
      if (!ownerId || ownerId === id) break;
      suffix += 1;
      slug = `${base}-${suffix}`;
    }
  }
  return slug;
}

export interface ReviewResult {
  ok: boolean;
  article?: StoredArticle;
  error?: string;
}

/** Approve (publish) or reject a pending article. */
export async function reviewArticle(
  id: string,
  action: 'approve' | 'reject',
  note?: string,
): Promise<ReviewResult> {
  const r = getRedis();
  const article = await read(id);
  if (!r || !article) return { ok: false, error: 'Article not found' };

  if (action === 'reject') {
    const next: StoredArticle = {
      ...article,
      status: 'rejected',
      reviewNote: note?.trim() || undefined,
      updatedAt: Date.now(),
    };
    await write(next);
    await r.srem(PENDING, id);
    return { ok: true, article: next };
  }

  // Approve → publish
  if (!article.title || !article.excerpt || !article.cardImage || !article.bodyMarkdown) {
    return { ok: false, error: 'Article is missing a title, excerpt, card image, or body' };
  }
  const now = Date.now();
  const slug = await uniqueSlug(article.slug || slugify(article.title), id);
  const next: StoredArticle = {
    ...article,
    slug,
    heroImage: article.heroImage || article.cardImage,
    status: 'published',
    reviewNote: undefined,
    date: article.date || formatDate(now),
    publishedAt: now,
    updatedAt: now,
  };
  await write(next);
  await r.srem(PENDING, id);
  await r.sadd(PUBLISHED, id);
  await r.set(SLUG(slug), id);
  return { ok: true, article: next };
}

/** Unpublish a published article (used if you want to pull it back). */
export async function unpublishArticle(id: string): Promise<boolean> {
  const r = getRedis();
  const article = await read(id);
  if (!r || !article) return false;
  await r.srem(PUBLISHED, id);
  if (article.slug) await r.del(SLUG(article.slug));
  await write({ ...article, status: 'draft', updatedAt: Date.now() });
  return true;
}

export async function deleteArticle(id: string): Promise<boolean> {
  const r = getRedis();
  const article = await read(id);
  if (!r || !article) return false;
  await r.del(A(id));
  await r.srem(BY_AUTHOR(article.authorUsername), id);
  await r.srem(PENDING, id);
  await r.srem(PUBLISHED, id);
  if (article.slug) await r.del(SLUG(article.slug));
  return true;
}

async function readMany(ids: string[]): Promise<StoredArticle[]> {
  const results = await Promise.all(ids.map(read));
  return results.filter((a): a is StoredArticle => a !== null);
}

export async function listByAuthor(username: string): Promise<StoredArticle[]> {
  const r = getRedis();
  if (!r) return [];
  const ids = await r.smembers(BY_AUTHOR(username));
  const list = await readMany(ids);
  return list.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function listPending(): Promise<StoredArticle[]> {
  const r = getRedis();
  if (!r) return [];
  const ids = await r.smembers(PENDING);
  const list = await readMany(ids);
  return list.sort((a, b) => (a.submittedAt ?? 0) - (b.submittedAt ?? 0));
}

export async function listPublished(): Promise<StoredArticle[]> {
  const r = getRedis();
  if (!r) return [];
  const ids = await r.smembers(PUBLISHED);
  const list = await readMany(ids);
  return list.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
}

export async function getPublishedBySlug(slug: string): Promise<StoredArticle | null> {
  const r = getRedis();
  if (!r) return null;
  const id = await r.get<string>(SLUG(slug));
  if (!id) return null;
  const article = await read(id);
  return article && article.status === 'published' ? article : null;
}

/** Maps a published StoredArticle into the public Article card shape. */
export function toArticle(a: StoredArticle): Article {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    category: a.category,
    categoryLabel: categoryLabels[a.category],
    date: a.date,
    author: a.authorName,
    excerpt: a.excerpt,
    image: a.cardImage,
  };
}

export async function getPublishedArticles(): Promise<Article[]> {
  const list = await listPublished();
  return list.map(toArticle);
}

export interface AuthorCounts {
  draft: number;
  pending: number;
  published: number;
  rejected: number;
  total: number;
}

function emptyCounts(): AuthorCounts {
  return { draft: 0, pending: 0, published: 0, rejected: 0, total: 0 };
}

/** Per-author article tallies by status, for the account management screen. */
export async function getAuthorCounts(usernames: string[]): Promise<Record<string, AuthorCounts>> {
  const entries = await Promise.all(
    usernames.map(async (username) => {
      const counts = emptyCounts();
      for (const a of await listByAuthor(username)) {
        counts[a.status] += 1;
        counts.total += 1;
      }
      return [username, counts] as const;
    }),
  );
  return Object.fromEntries(entries);
}

/** Keeps existing bylines in sync when an account's display name changes. */
export async function renameAuthor(username: string, name: string): Promise<number> {
  const stale = (await listByAuthor(username)).filter((a) => a.authorName !== name);
  await Promise.all(stale.map((a) => write({ ...a, authorName: name })));
  return stale.length;
}
