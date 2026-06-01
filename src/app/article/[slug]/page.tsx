import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getArticleBySlug, categoryLabels, Category } from '@/lib/data';
import { articleContent, ContentSection } from '@/lib/articleContent';
import { getDynamicArticle, getByCategory } from '@/lib/content';
import ArticleCard from '@/components/ArticleCard';
import ViewTracker from '@/components/ViewTracker';

export const dynamic = 'force-dynamic';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

interface DisplayArticle {
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

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params;
  const dynamicArticle = await getDynamicArticle(slug);
  if (dynamicArticle) {
    return { title: `${dynamicArticle.title} — History Alive Today`, description: dynamicArticle.excerpt };
  }
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: `${article.title} — History Alive Today`,
    description: article.excerpt,
  };
}

async function resolve(slug: string): Promise<DisplayArticle | null> {
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
      heroImage: d.heroImage || d.cardImage,
      markdown: d.bodyMarkdown,
    };
  }
  const s = getArticleBySlug(slug);
  if (s) {
    return {
      slug: s.slug,
      title: s.title,
      category: s.category,
      categoryLabel: s.categoryLabel,
      date: s.date,
      author: s.author,
      excerpt: s.excerpt,
      heroImage: s.image,
      blocks: articleContent[s.slug] || [],
    };
  }
  return null;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await resolve(slug);

  if (!article) notFound();

  const related = (await getByCategory(article.category))
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3);

  return (
    <main>
      <ViewTracker slug={slug} />
      {/* Hero image */}
      <div className="relative w-full h-72 md:h-[440px] bg-[#e8efef]">
        <Image
          src={article.heroImage}
          alt={article.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-4xl mx-auto px-4 pb-8">
          <Link
            href={`/category/${article.category}`}
            className="inline-block bg-[#e2b26f] text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-widest mb-3"
          >
            {article.categoryLabel}
          </Link>
          <h1 className="text-white text-3xl md:text-4xl font-bold leading-tight">
            {article.title}
          </h1>
          <p className="text-white/70 text-sm mt-2">
            {article.date} · By {article.author}
          </p>
        </div>
      </div>

      {/* Article body */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[#aaaaaa] mb-8">
            <Link href="/" className="hover:text-[#e2b26f] transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/category/${article.category}`} className="hover:text-[#e2b26f] transition-colors">
              {article.categoryLabel}
            </Link>
            <span>/</span>
            <span className="text-[#555555] line-clamp-1">{article.title}</span>
          </nav>

          {/* Gold accent bar */}
          <div className="h-[4px] w-16 bg-[#e2b26f] rounded mb-8" />

          {/* Excerpt / intro */}
          <p className="text-[#555555] text-xl leading-relaxed mb-8 font-medium">
            {article.excerpt}
          </p>

          {/* Article content */}
          <div className="prose prose-lg max-w-none text-[#444444] leading-relaxed space-y-5">
            {article.markdown !== undefined ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children }) => <h2 className="text-2xl font-bold text-[#333333] mt-10 mb-4">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-xl font-bold text-[#333333] mt-8 mb-3">{children}</h3>,
                  p: ({ children }) => <p>{children}</p>,
                  img: ({ src, alt }) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={typeof src === 'string' ? src : ''} alt={alt || ''} className="my-8 w-full rounded-lg" />
                  ),
                  a: ({ href, children }) => (
                    <a href={href} className="text-[#e2b26f] underline" target="_blank" rel="noreferrer">{children}</a>
                  ),
                }}
              >
                {article.markdown}
              </ReactMarkdown>
            ) : (
              (article.blocks || []).map((section, i) => {
                switch (section.type) {
                  case 'heading':
                    return <h2 key={i} className="text-2xl font-bold text-[#333333] mt-10 mb-4">{section.text}</h2>;
                  case 'subheading':
                    return <h3 key={i} className="text-xl font-bold text-[#333333] mt-8 mb-3">{section.text}</h3>;
                  case 'image':
                    return (
                      <figure key={i} className="my-8">
                        <div className="relative w-full aspect-video overflow-hidden rounded-lg">
                          <Image
                            src={section.src!}
                            alt={section.alt || ''}
                            fill
                            className="object-contain"
                          />
                        </div>
                        {section.caption && (
                          <figcaption className="text-center text-sm text-[#888888] mt-2 italic">
                            {section.caption}
                          </figcaption>
                        )}
                      </figure>
                    );
                  case 'text':
                  default:
                    return <p key={i}>{section.text}</p>;
                }
              })
            )}
          </div>

          {/* Back button */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <Link
              href={`/category/${article.category}`}
              className="inline-flex items-center gap-2 text-[#e2b26f] font-semibold hover:underline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to {article.categoryLabel}
            </Link>
          </div>
        </div>
      </section>

      {/* Related articles */}
      {related.length > 0 && (
        <>
          <div className="h-[6px] bg-[rgba(247,157,22,0.25)]" />
          <section className="bg-[#e8efef] py-14">
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-xl font-bold text-[#333333] uppercase tracking-wide">More in {article.categoryLabel}</h2>
                <div className="flex-1 h-[2px] bg-[rgba(247,157,22,0.35)]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {related.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
