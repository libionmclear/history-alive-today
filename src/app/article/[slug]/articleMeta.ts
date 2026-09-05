import { getArticleBySlug, categoryLabels, Category } from '@/lib/data';
import { articleContent, ContentSection } from '@/lib/articleContent';
import { getDynamicArticle } from '@/lib/content';

export interface ArticlePageData {
  slug: string;
  title: string;
  category: Category;
  categoryLabel: string;
  date: string;
  author: string;
  excerpt: string;
  heroImage: string;
  blocks?: ContentSection[];
  markdown?: string;
}

const SITE_URL = 'https://www.historyalivetoday.com';

function absoluteUrl(path: string): string {
  if (!path) return '';
  return path.startsWith('http://') || path.startsWith('https://') ? path : new URL(path, SITE_URL).toString();
}

/**
 * Facebook needs og:image:width / og:image:height to render a share card on the
 * first scrape. Without them it has to fetch the image asynchronously and shows
 * a fallback (usually the site logo) in the meantime. The hero images live in
 * /public, so measure them off disk. Remote images (Blob-hosted, from the CMS)
 * are skipped rather than fetched — the tags are an optimisation, not required.
 */
const imageSizeCache = new Map<string, { width: number; height: number } | undefined>();

async function getImageSize(imagePath: string) {
  if (!imagePath || !imagePath.startsWith('/')) return undefined;
  if (imageSizeCache.has(imagePath)) return imageSizeCache.get(imagePath);

  let size: { width: number; height: number } | undefined;
  try {
    const [{ default: sharp }, path] = await Promise.all([import('sharp'), import('node:path')]);
    const file = path.join(process.cwd(), 'public', imagePath);
    const { width, height } = await sharp(file).metadata();
    if (width && height) size = { width, height };
  } catch {
    size = undefined;
  }

  imageSizeCache.set(imagePath, size);
  return size;
}

function getFirstMarkdownImage(markdown: string): string {
  const match = markdown.match(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/);
  return match?.[1] ?? '';
}

function getFirstContentImage(blocks: ContentSection[]): string {
  return blocks.find((block) => block.type === 'image' && block.src)?.src ?? '';
}

function getDynamicCoverImage(article: Awaited<ReturnType<typeof getDynamicArticle>>): string {
  if (!article) return '';
  return article.images[0] || getFirstMarkdownImage(article.bodyMarkdown) || article.heroImage || article.cardImage;
}

export async function resolveArticlePage(slug: string): Promise<ArticlePageData | null> {
  const d = await getDynamicArticle(slug);
  if (d) {
    return {
      slug: d.slug,
      title: d.title,
      category: d.category,
      categoryLabel: categoryLabels[d.category],
      date: d.date,
      author: d.authorName,
      excerpt: d.excerpt,
      heroImage: getDynamicCoverImage(d),
      markdown: d.bodyMarkdown,
    };
  }

  const s = getArticleBySlug(slug);
  if (s) {
    const blocks = articleContent[s.slug] || [];
    return {
      slug: s.slug,
      title: s.title,
      category: s.category,
      categoryLabel: s.categoryLabel,
      date: s.date,
      author: s.author,
      excerpt: s.excerpt,
      heroImage: getFirstContentImage(blocks) || s.image,
      blocks,
    };
  }

  return null;
}

export async function buildArticleMeta(article: ArticlePageData) {
  const image = absoluteUrl(article.heroImage);
  const size = await getImageSize(article.heroImage);
  return {
    title: `${article.title} — History Alive Today`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      url: `${SITE_URL}/article/${article.slug}`,
      siteName: 'History Alive Today',
      images: image ? [{ url: image, alt: article.title, ...size }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: article.title,
      description: article.excerpt,
      images: image ? [image] : undefined,
    },
  };
}
