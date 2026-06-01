import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { listByAuthor } from '@/lib/articles';
import { categoryLabels } from '@/lib/data';
import DashboardNav from '@/components/admin/DashboardNav';
import NewArticleButton from '@/components/writer/NewArticleButton';

export const dynamic = 'force-dynamic';

const statusStyle: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-100 text-amber-700',
  published: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default async function WriterDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const articles = await listByAuthor(user.username);

  return (
    <main className="bg-[#f7f9f9] min-h-screen">
      <DashboardNav user={user} active="writer" />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-[4px] w-12 bg-[#e2b26f] rounded mb-3" />
            <h1 className="text-3xl font-bold text-[#333333]">My articles</h1>
            <p className="text-sm text-[#888888] mt-1">Write, save drafts, and submit for review.</p>
          </div>
          <NewArticleButton />
        </div>

        {articles.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <p className="text-[#888]">You haven&apos;t written anything yet.</p>
            <div className="mt-4 inline-block">
              <NewArticleButton />
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {articles.map((a) => (
              <li key={a.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-4">
                  {a.cardImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.cardImage} alt="" className="w-16 h-14 object-cover rounded-lg shrink-0" />
                  ) : (
                    <div className="w-16 h-14 rounded-lg bg-gray-100 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${statusStyle[a.status]}`}>
                        {a.status}
                      </span>
                      <span className="text-xs text-[#aaa]">{categoryLabels[a.category]}</span>
                    </div>
                    <p className="font-semibold text-[#333] truncate mt-1">{a.title || '(untitled draft)'}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    {a.status === 'published' && (
                      <Link href={`/article/${a.slug}`} className="text-xs text-[#888] hover:text-[#e2b26f]">View</Link>
                    )}
                    {(a.status === 'draft' || a.status === 'rejected') && (
                      <Link href={`/writer/edit/${a.id}`} className="text-sm font-semibold text-[#e2b26f] hover:underline">
                        Edit
                      </Link>
                    )}
                  </div>
                </div>
                {a.status === 'rejected' && a.reviewNote && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2 mt-3">
                    Sent back: {a.reviewNote}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
