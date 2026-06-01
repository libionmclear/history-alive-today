import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { listUsers } from '@/lib/users';
import DashboardNav from '@/components/admin/DashboardNav';
import WritersManager from '@/components/admin/WritersManager';

export const dynamic = 'force-dynamic';

export default async function WritersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/writer');

  const users = await listUsers();

  return (
    <main className="bg-[#f7f9f9] min-h-screen">
      <DashboardNav user={user} active="writers" />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="h-[4px] w-12 bg-[#e2b26f] rounded mb-3" />
        <h1 className="text-3xl font-bold text-[#333333] mb-1">Writers &amp; admins</h1>
        <p className="text-sm text-[#888888] mb-8">
          Create accounts manually and set their passwords. Writers can draft and submit articles;
          admins can also review and manage accounts.
        </p>
        <WritersManager initialUsers={users} />
      </div>
    </main>
  );
}
