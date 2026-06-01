import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getArticle } from '@/lib/articles';
import DashboardNav from '@/components/admin/DashboardNav';
import ArticleEditor from '@/components/writer/ArticleEditor';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditArticlePage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();
  if (user.role !== 'admin' && article.authorUsername !== user.username) {
    redirect('/writer');
  }

  return (
    <main className="bg-[#f7f9f9] min-h-screen">
      <DashboardNav user={user} active="writer" />
      <ArticleEditor
        initial={{
          id: article.id,
          title: article.title,
          category: article.category,
          excerpt: article.excerpt,
          bodyMarkdown: article.bodyMarkdown,
          images: article.images,
          cardImage: article.cardImage,
          heroImage: article.heroImage,
          status: article.status,
          reviewNote: article.reviewNote,
        }}
      />
    </main>
  );
}
