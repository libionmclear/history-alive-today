import { notFound } from 'next/navigation';
import ArticleCard from '@/components/ArticleCard';
import { getArticlesByCategory, categoryLabels, Category } from '@/lib/data';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

const categoryDescriptions: Record<Category, string> = {
  'things-we-do': 'Explore the historical origins of customs, rituals, and everyday behaviors we practice without thinking.',
  'things-we-say': 'Discover where our common phrases, expressions, and words come from — the stories behind what we say.',
  'things-we-think': 'Uncover the history behind beliefs, superstitions, and ideas that still shape how we think today.',
  'things-we-use': 'Trace the fascinating origins of tools, inventions, and objects we use every day.',
};

export async function generateStaticParams() {
  return [
    { slug: 'things-we-do' },
    { slug: 'things-we-say' },
    { slug: 'things-we-think' },
    { slug: 'things-we-use' },
  ];
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  if (!(slug in categoryLabels)) {
    notFound();
  }

  const category = slug as Category;
  const label = categoryLabels[category];
  const description = categoryDescriptions[category];
  const articles = getArticlesByCategory(category);

  return (
    <main>
      {/* Category header */}
      <section className="bg-[#e8efef] py-14">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-[#e2b26f] text-xs font-bold uppercase tracking-widest mb-2">Category</p>
          <h1 className="text-4xl font-bold text-[#333333] mb-4">{label}</h1>
          <p className="text-[#555555] text-lg max-w-2xl">{description}</p>
          <div className="h-[4px] w-16 bg-[#e2b26f] rounded mt-6" />
        </div>
      </section>

      {/* Gold separator */}
      <div className="h-[6px] bg-[rgba(247,157,22,0.25)]" />

      {/* Articles grid */}
      <section className="bg-white py-14">
        <div className="max-w-6xl mx-auto px-4">
          {articles.length > 0 ? (
            <>
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-xl font-bold text-[#333333] uppercase tracking-wide">
                  {articles.length} Article{articles.length !== 1 ? 's' : ''}
                </h2>
                <div className="flex-1 h-[2px] bg-[rgba(247,157,22,0.35)]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-[#aaaaaa] text-lg">No articles found in this category yet.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
