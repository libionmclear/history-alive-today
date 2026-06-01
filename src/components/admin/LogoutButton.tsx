'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch('/api/login', { method: 'DELETE' }).catch(() => {});
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="text-sm text-[#888888] hover:text-[#e2b26f] transition-colors"
    >
      Sign out
    </button>
  );
}
