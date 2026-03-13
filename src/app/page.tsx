import Hero from '@/components/Hero';
import ArticleCard from '@/components/ArticleCard';
import { articles, getPopularArticles, getLatestArticles } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const featured = articles[Math.floor(Math.random() * articles.length)];
  const popular = getPopularArticles(8);
  const latest = getLatestArticles(8);

  return (
    <main>
      <Hero featuredArticle={featured} />

      {/* Gold separator */}
      <div className="h-[6px] bg-[rgba(247,157,22,0.25)]" />

      {/* Popular Articles */}
      <section className="bg-[#e8efef] py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-bold text-[#333333] uppercase tracking-wide">Popular Articles</h2>
            <div className="flex-1 h-[2px] bg-[rgba(247,157,22,0.35)]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popular.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </section>

      {/* Gold separator */}
      <div className="h-[6px] bg-[rgba(247,157,22,0.25)]" />

      {/* Latest Articles */}
      <section className="bg-white py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-bold text-[#333333] uppercase tracking-wide">Latest Articles</h2>
            <div className="flex-1 h-[2px] bg-[rgba(247,157,22,0.35)]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latest.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </section>

      {/* Category CTA strips */}
      <section className="bg-[#e8efef] py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-bold text-[#333333] uppercase tracking-wide">Browse by Category</h2>
            <div className="flex-1 h-[2px] bg-[rgba(247,157,22,0.35)]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Things we do', href: '/category/things-we-do', emoji: '🎭', desc: 'Customs, rituals, and behaviors traced through history.' },
              { label: 'Things we say', href: '/category/things-we-say', emoji: '💬', desc: 'The origins of phrases, words, and expressions we use daily.' },
              { label: 'Things we think', href: '/category/things-we-think', emoji: '🧠', desc: 'Beliefs, superstitions, and ideas across the ages.' },
              { label: 'Things we use', href: '/category/things-we-use', emoji: '🔧', desc: 'Tools, inventions, and objects from ancient times to now.' },
            ].map((cat) => (
              <a
                key={cat.href}
                href={cat.href}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow group border-b-4 border-[#e2b26f]"
              >
                <div className="text-4xl mb-3">{cat.emoji}</div>
                <h3 className="text-[#333333] font-bold text-lg mb-2 group-hover:text-[#e2b26f] transition-colors">
                  {cat.label}
                </h3>
                <p className="text-[#777777] text-sm">{cat.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
