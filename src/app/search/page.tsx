import ArticleCard from '@/components/ArticleCard';
import { searchArticles } from '@/lib/content';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = '' } = await searchParams;
  const query = q.trim();
  const results = await searchArticles(query);

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-[#333333] mb-2">Search Results</h1>
      {query ? (
        <p className="text-[#aaaaaa] mb-8">
          {results.length} {results.length === 1 ? 'result' : 'results'} for &ldquo;{q}&rdquo;
        </p>
      ) : (
        <p className="text-[#aaaaaa] mb-8">Enter a search term to find articles.</p>
      )}

      {results.length > 0 ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        query && (
          <p className="text-[#666666] text-lg">
            No articles found. Try a different search term.
          </p>
        )
      )}
    </main>
  );
}
