import { redirect } from 'next/navigation';
import { getCurrentUser, ownerUsername } from '@/lib/auth';
import { listUsers } from '@/lib/users';
import { getAuthorCounts } from '@/lib/articles';
import { getRedis } from '@/lib/redis';
import DashboardNav from '@/components/admin/DashboardNav';
import UsersManager from '@/components/admin/UsersManager';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/writer');

  const owner = ownerUsername();
  const users = await listUsers();
  const counts = await getAuthorCounts([owner, ...users.map((u) => u.username)]);

  return (
    <main className="bg-[#f7f9f9] min-h-screen">
      <DashboardNav user={user} active="users" />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="h-[4px] w-12 bg-[#e2b26f] rounded mb-3" />
        <h1 className="text-3xl font-bold text-[#333333] mb-1">Users</h1>
        <p className="text-sm text-[#888888] mb-8">
          Create accounts, change roles and display names, reset passwords, and remove people who
          have left. Passwords are stored scrypt-hashed and are never readable afterwards.
        </p>
        <UsersManager
          initialUsers={users}
          initialCounts={counts}
          owner={{ username: owner, name: 'Site owner', role: 'admin', createdAt: 0 }}
          currentUsername={user.username.toLowerCase()}
          storageReady={getRedis() !== null}
        />
      </div>
    </main>
  );
}
