import Link from 'next/link';
import { SessionUser } from '@/lib/auth';
import LogoutButton from './LogoutButton';

interface DashboardNavProps {
  user: SessionUser;
  active: string;
}

export default function DashboardNav({ user, active }: DashboardNavProps) {
  const links: { href: string; label: string; key: string; adminOnly?: boolean }[] = [
    { href: '/admin', label: 'Analytics', key: 'analytics', adminOnly: true },
    { href: '/admin/review', label: 'Review queue', key: 'review', adminOnly: true },
    { href: '/admin/writers', label: 'Writers', key: 'writers', adminOnly: true },
    { href: '/writer', label: 'My articles', key: 'writer' },
  ];

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <nav className="flex items-center gap-1 overflow-x-auto">
          {links
            .filter((l) => !l.adminOnly || user.role === 'admin')
            .map((l) => (
              <Link
                key={l.key}
                href={l.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  active === l.key
                    ? 'bg-[#e2b26f]/15 text-[#b07d2f]'
                    : 'text-[#666] hover:text-[#e2b26f]'
                }`}
              >
                {l.label}
              </Link>
            ))}
        </nav>
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-sm text-[#aaa] hidden sm:inline">
            {user.name} · {user.role}
          </span>
          <Link href="/" className="text-sm text-[#888888] hover:text-[#e2b26f] transition-colors">
            View site
          </Link>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
