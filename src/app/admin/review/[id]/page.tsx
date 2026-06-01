import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getCurrentUser } from '@/lib/auth';
import { getArticle } from '@/lib/articles';
import { categoryLabels } from '@/lib/data';
import DashboardNav from '@/components/admin/DashboardNav';
import ReviewActions from '@/components/admin/ReviewActions';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReviewDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/writer');

  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    published: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    draft: 'bg-gray-100 text-gray-600',
  };

  return (
    <main className="bg-[#f7f9f9] min-h-screen">
      <DashboardNav user={user} active="review" />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/admin/review" className="text-sm text-[#888] hover:text-[#e2b26f]">← Back to queue</Link>

        <div className="flex items-center gap-3 mt-4 mb-2">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${statusColors[article.status]}`}>
            {article.status}
          </span>
          <span className="text-xs text-[#888]">
            {categoryLabels[article.category]} · by {article.authorName}
          </span>
        </div>

        {article.status === 'pending' && <ReviewActions id={article.id} />}

        {article.reviewNote && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3 my-4">
            Previous note to writer: {article.reviewNote}
          </p>
        )}

        {/* Preview */}
        <article className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
          {article.heroImage || article.cardImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={article.heroImage || article.cardImage} alt="" className="w-full h-64 object-cover" />
          ) : null}
          <div className="p-6">
            <h1 className="text-2xl font-bold text-[#333] mb-3">{article.title || '(untitled)'}</h1>
            <p className="text-[#555] text-lg font-medium mb-6">{article.excerpt}</p>
            <div className="prose max-w-none text-[#444]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  img: ({ src, alt }) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={typeof src === 'string' ? src : ''} alt={alt || ''} className="my-6 w-full rounded-lg" />
                  ),
                }}
              >
                {article.bodyMarkdown || '_No body content._'}
              </ReactMarkdown>
            </div>
          </div>
        </article>

        {/* Card preview */}
        <div className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#aaa] mb-3">Card thumbnail</h2>
          <div className="flex items-center gap-4 bg-white rounded-xl shadow-sm p-4 max-w-xs">
            {article.cardImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={article.cardImage} alt="" className="w-24 h-20 object-cover rounded-lg" />
            )}
            <div className="min-w-0">
              <p className="text-[#e2b26f] text-[10px] font-bold uppercase tracking-widest">{categoryLabels[article.category]}</p>
              <p className="text-sm font-semibold text-[#333] line-clamp-2">{article.title}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
