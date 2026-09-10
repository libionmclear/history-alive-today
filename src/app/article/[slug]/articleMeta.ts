import { getArticleBySlug, categoryLabels, Category } from '@/lib/data';
import { articleContent, ContentSection } from '@/lib/articleContent';
import { getDynamicArticle } from '@/lib/content';
import { getImageSize } from '@/lib/imageSizes';

export interface ArticlePageData {
  slug: string;
  title: string;
  category: Category;
  categoryLabel: string;
  date: string;
  author: string;
  excerpt: string;
  heroImage: string;
  /** Image for og:image. Often differs from heroImage — see pickSocialImage. */
  socialImage?: string;
  blocks?: ContentSection[];
  markdown?: string;
}

const SITE_URL = 'https://www.historyalivetoday.com';

function absoluteUrl(path: string): string {
  if (!path) return '';
  return path.startsWith('http://') || path.startsWith('https://') ? path : new URL(path, SITE_URL).toString();
}

function getFirstMarkdownImage(markdown: string): string {
  const match = markdown.match(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/);
  return match?.[1] ?? '';
}

function getFirstContentImage(blocks: ContentSection[]): string {
  return blocks.find((block) => block.type === 'image' && block.src)?.src ?? '';
}

/**
 * Facebook only renders the large link card when the image is at least
 * 600x315; below that it falls back to a small square thumbnail, and below
 * 200x200 it rejects the image outright and shows nothing.
 *
 * Articles carried over from WordPress often open with a small resized
 * thumbnail, so taking the first image blindly produced a poor card — or none
 * at all — even though a large image sat further down the same article. Pick
 * the first candidate that clears the bar, preferring images in the order a
 * reader meets them, and fall back to the old behaviour when nothing does.
 *
 * This only affects og:image. The visible hero banner still uses heroImage.
 */
const OG_MIN_WIDTH = 600;
const OG_MIN_HEIGHT = 315;

interface SocialImageSource {
  heroImage: string;
  /** The listing/card image from data.ts, which is often not a body image. */
  cardImage?: string;
  blocks?: ContentSection[];
}

function collectImageCandidates(article: SocialImageSource): string[] {
  const out: string[] = [];
  for (const block of article.blocks ?? []) {
    if (block.type === 'image' && block.src) out.push(block.src);
    for (const img of block.images ?? []) if (img.src) out.push(img.src);
  }
  // Fallbacks, not first choices: usually the same as the opening image, and
  // where they differ a body image is the better shot. The card image has to be
  // here though — on several older articles it is the only one big enough.
  out.push(article.heroImage);
  if (article.cardImage) out.push(article.cardImage);
  return out.filter(Boolean);
}

function pickSocialImage(article: SocialImageSource): string {
  const candidates = collectImageCandidates(article);
  const clears = (src: string) => {
    const size = getImageSize(src);
    return size && size.width >= OG_MIN_WIDTH && size.height >= OG_MIN_HEIGHT ? size : null;
  };
  // The card is a wide letterbox, so a landscape image fills it and a tall
  // portrait gets cropped to a strip. Prefer landscape where one qualifies.
  const landscape = candidates.find((src) => {
    const size = clears(src);
    return size && size.width >= size.height;
  });
  return landscape ?? candidates.find(clears) ?? article.heroImage;
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
      socialImage: pickSocialImage({
        heroImage: getFirstContentImage(blocks) || s.image,
        cardImage: s.image,
        blocks,
      }),
      blocks,
    };
  }

  return null;
}

export function buildArticleMeta(article: ArticlePageData) {
  const image = absoluteUrl(article.socialImage || article.heroImage);
  // Facebook cannot render a share card on its first scrape without the image
  // dimensions — it falls back to another image on the page (our logo). These
  // are measured at build time; see scripts/generate-image-sizes.mjs.
  const size = getImageSize(article.socialImage || article.heroImage);
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
