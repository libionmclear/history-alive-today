import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { listPending, listPublished } from '@/lib/articles';
import { categoryLabels } from '@/lib/data';
import DashboardNav from '@/components/admin/DashboardNav';

export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/writer');

  const [pending, published] = await Promise.all([listPending(), listPublished()]);

  return (
    <main className="bg-[#f7f9f9] min-h-screen">
      <DashboardNav user={user} active="review" />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="h-[4px] w-12 bg-[#e2b26f] rounded mb-3" />
        <h1 className="text-3xl font-bold text-[#333333] mb-1">Review queue</h1>
        <p className="text-sm text-[#888888] mb-8">
          Articles submitted by writers. Approve to publish them live, or reject with a note.
        </p>

        <h2 className="text-sm font-bold uppercase tracking-widest text-[#aaa] mb-3">
          Awaiting review ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-[#aaa] bg-white rounded-xl shadow-sm p-6">Nothing waiting. 🎉</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/admin/review/${a.id}`}
                  className="flex items-center gap-4 bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  {a.cardImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.cardImage} alt="" className="w-20 h-16 object-cover rounded-lg shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#333] truncate">{a.title || '(untitled)'}</p>
                    <p className="text-xs text-[#888] mt-1">
                      {categoryLabels[a.category]} · by {a.authorName}
                    </p>
                  </div>
                  <span className="text-[#e2b26f] text-sm font-semibold shrink-0">Review →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <h2 className="text-sm font-bold uppercase tracking-widest text-[#aaa] mt-10 mb-3">
          Published ({published.length})
        </h2>
        {published.length === 0 ? (
          <p className="text-sm text-[#aaa]">No writer articles published yet.</p>
        ) : (
          <ul className="space-y-2">
            {published.map((a) => (
              <li key={a.id} className="flex items-center justify-between bg-white rounded-lg shadow-sm px-4 py-3">
                <Link href={`/article/${a.slug}`} className="text-sm text-[#333] hover:text-[#e2b26f] truncate">
                  {a.title}
                </Link>
                <span className="text-xs text-[#aaa] shrink-0 ml-3">{a.date} · {a.authorName}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
