'use client';

import { useEffect, useMemo, useState } from 'react';

type Role = 'admin' | 'writer';

export interface PublicUser {
  username: string;
  name: string;
  role: Role;
  createdAt: number;
}

export interface AuthorCounts {
  draft: number;
  pending: number;
  published: number;
  rejected: number;
  total: number;
}

interface UsersManagerProps {
  initialUsers: PublicUser[];
  initialCounts: Record<string, AuthorCounts>;
  owner: PublicUser;
  currentUsername: string;
  storageReady: boolean;
}

type PanelMode = 'edit' | 'password' | 'delete';

interface Panel {
  username: string;
  mode: PanelMode;
}

const NO_COUNTS: AuthorCounts = { draft: 0, pending: 0, published: 0, rejected: 0, total: 0 };

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#333] focus:outline-none focus:ring-2 focus:ring-[#e2b26f]/50';
const labelClass = 'block text-xs font-semibold uppercase tracking-widest text-[#aaa] mb-1';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const chars = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];
  return chars.toUpperCase();
}

function fmtJoined(ms: number): string {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Ambiguous characters (0/O, 1/l/I) are left out so passwords survive being read aloud. */
function generatePassword(): string {
  const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const values = new Uint32Array(14);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => alphabet[v % alphabet.length]).join('');
}

function sortUsers(list: PublicUser[]): PublicUser[] {
  return [...list].sort((a, b) => a.username.localeCompare(b.username));
}

function StatTile({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <p className="text-xs uppercase tracking-widest text-[#aaaaaa] font-semibold">{label}</p>
      <p className="text-2xl font-bold text-[#333333] mt-1">{value}</p>
      {hint && <p className="text-xs text-[#aaa] mt-1">{hint}</p>}
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
        role === 'admin' ? 'bg-[#e2b26f]/20 text-[#b07d2f]' : 'bg-gray-100 text-[#888]'
      }`}
    >
      {role}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#e8efef] text-[#6b8484]">
      {children}
    </span>
  );
}

function CountChips({ counts }: { counts: AuthorCounts }) {
  if (counts.total === 0) return <span className="text-xs text-[#ccc]">No articles</span>;
  const parts: string[] = [];
  if (counts.published) parts.push(`${counts.published} published`);
  if (counts.pending) parts.push(`${counts.pending} pending`);
  if (counts.draft) parts.push(`${counts.draft} draft${counts.draft === 1 ? '' : 's'}`);
  if (counts.rejected) parts.push(`${counts.rejected} rejected`);
  return <span className="text-xs text-[#999]">{parts.join(' · ')}</span>;
}

export default function UsersManager({
  initialUsers,
  initialCounts,
  owner,
  currentUsername,
  storageReady,
}: UsersManagerProps) {
  const [users, setUsers] = useState<PublicUser[]>(sortUsers(initialUsers));

  // Create form
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('writer');
  const [createError, setCreateError] = useState('');

  // Filters
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');

  // Per-row action panel
  const [panel, setPanel] = useState<Panel | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<Role>('writer');
  const [newPassword, setNewPassword] = useState('');
  const [panelError, setPanelError] = useState('');

  const [busy, setBusy] = useState('');
  const [flash, setFlash] = useState('');

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(''), 4000);
    return () => clearTimeout(t);
  }, [flash]);

  const countsFor = (u: string) => initialCounts[u] ?? NO_COUNTS;

  const admins = users.filter((u) => u.role === 'admin').length;
  const pendingTotal = useMemo(
    () => Object.values(initialCounts).reduce((sum, c) => sum + c.pending, 0),
    [initialCounts],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!q) return true;
      return u.username.includes(q) || u.name.toLowerCase().includes(q);
    });
  }, [users, query, roleFilter]);

  function openPanel(user: PublicUser, mode: PanelMode) {
    setPanelError('');
    if (panel?.username === user.username && panel.mode === mode) {
      setPanel(null);
      return;
    }
    setPanel({ username: user.username, mode });
    if (mode === 'edit') {
      setEditName(user.name);
      setEditRole(user.role);
    }
    if (mode === 'password') setNewPassword(generatePassword());
  }

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setBusy('create');
    setCreateError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, name, password, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCreateError(data.error || 'Could not create account');
        return;
      }
      setUsers((prev) => sortUsers([...prev, data.user]));
      setFlash(`Created @${data.user.username}. Share the password with them securely.`);
      setUsername('');
      setName('');
      setPassword('');
      setRole('writer');
    } finally {
      setBusy('');
    }
  }

  async function saveProfile(target: string) {
    setBusy(target);
    setPanelError('');
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(target)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, role: editRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPanelError(data.error || 'Could not save changes');
        return;
      }
      setUsers((prev) => sortUsers(prev.map((u) => (u.username === target ? data.user : u))));
      setPanel(null);
      setFlash(`Saved @${target}.`);
    } finally {
      setBusy('');
    }
  }

  async function savePassword(target: string) {
    setBusy(target);
    setPanelError('');
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(target)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPanelError(data.error || 'Could not set password');
        return;
      }
      setPanel(null);
      setFlash(`Password updated for @${target}.`);
    } finally {
      setBusy('');
    }
  }

  async function removeAccount(target: string) {
    setBusy(target);
    setPanelError('');
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(target)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPanelError(data.error || 'Could not delete account');
        return;
      }
      setUsers((prev) => prev.filter((u) => u.username !== target));
      setPanel(null);
      setFlash(`Deleted @${target}.`);
    } finally {
      setBusy('');
    }
  }

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(newPassword);
      setFlash('Password copied to clipboard.');
    } catch {
      setPanelError('Could not copy — select the password and copy it manually.');
    }
  }

  function UserRow({ user, isOwner }: { user: PublicUser; isOwner: boolean }) {
    const isSelf = user.username === currentUsername;
    const c = countsFor(user.username);
    const open = panel?.username === user.username ? panel.mode : null;

    return (
      <li className="py-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#e2b26f]/15 text-[#b07d2f] text-sm font-bold flex items-center justify-center shrink-0">
            {initials(user.name)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-[#333] truncate">{user.name}</p>
              <span className="text-sm text-[#aaa] truncate">@{user.username}</span>
              <RoleBadge role={user.role} />
              {isOwner && <Tag>Owner</Tag>}
              {isSelf && <Tag>You</Tag>}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <CountChips counts={c} />
              {user.createdAt > 0 && (
                <span className="text-xs text-[#ccc]">· joined {fmtJoined(user.createdAt)}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isOwner ? (
              <span className="text-xs text-[#ccc]">Managed by env vars</span>
            ) : (
              <>
                <button
                  onClick={() => openPanel(user, 'edit')}
                  className={`text-xs hover:text-[#e2b26f] ${open === 'edit' ? 'text-[#e2b26f]' : 'text-[#888]'}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => openPanel(user, 'password')}
                  className={`text-xs hover:text-[#e2b26f] ${open === 'password' ? 'text-[#e2b26f]' : 'text-[#888]'}`}
                >
                  Password
                </button>
                <button
                  onClick={() => openPanel(user, 'delete')}
                  disabled={isSelf}
                  title={isSelf ? 'You cannot delete your own account' : undefined}
                  className="text-xs text-red-500 hover:text-red-700 disabled:text-[#ddd] disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {open === 'edit' && (
          <div className="mt-4 sm:ml-14 bg-[#f7f9f9] rounded-lg p-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Display name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} />
                <p className="text-xs text-[#aaa] mt-1">Updates the byline on their existing articles too.</p>
              </div>
              <div>
                <label className={labelClass}>Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  disabled={isSelf}
                  className={`${inputClass} disabled:bg-gray-100 disabled:text-[#aaa]`}
                >
                  <option value="writer">Writer — draft and submit</option>
                  <option value="admin">Admin — also review and manage accounts</option>
                </select>
                {isSelf && (
                  <p className="text-xs text-[#aaa] mt-1">
                    You cannot change your own role — ask another admin.
                  </p>
                )}
              </div>
            </div>
            {panelError && <p className="text-sm text-red-600 mt-3">{panelError}</p>}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => saveProfile(user.username)}
                disabled={busy === user.username || !editName.trim()}
                className="bg-[#e2b26f] text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-[#d6a45c] transition-colors disabled:opacity-50"
              >
                {busy === user.username ? 'Saving…' : 'Save changes'}
              </button>
              <button onClick={() => setPanel(null)} className="text-sm text-[#888] hover:text-[#333]">
                Cancel
              </button>
            </div>
          </div>
        )}

        {open === 'password' && (
          <div className="mt-4 sm:ml-14 bg-[#f7f9f9] rounded-lg p-4">
            <label className={labelClass}>New password for @{user.username}</label>
            <div className="flex gap-2">
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`${inputClass} font-mono`}
              />
              <button
                onClick={() => setNewPassword(generatePassword())}
                className="text-sm text-[#888] hover:text-[#e2b26f] whitespace-nowrap px-2"
              >
                Regenerate
              </button>
              <button
                onClick={copyPassword}
                className="text-sm text-[#888] hover:text-[#e2b26f] whitespace-nowrap px-2"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-[#aaa] mt-2">
              Copy it before saving — it is hashed on save and can never be shown again.
            </p>
            {panelError && <p className="text-sm text-red-600 mt-3">{panelError}</p>}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => savePassword(user.username)}
                disabled={busy === user.username || newPassword.length < 6}
                className="bg-[#e2b26f] text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-[#d6a45c] transition-colors disabled:opacity-50"
              >
                {busy === user.username ? 'Saving…' : 'Set password'}
              </button>
              <button onClick={() => setPanel(null)} className="text-sm text-[#888] hover:text-[#333]">
                Cancel
              </button>
            </div>
          </div>
        )}

        {open === 'delete' && (
          <div className="mt-4 sm:ml-14 bg-red-50 border border-red-100 rounded-lg p-4">
            <p className="text-sm text-[#333]">
              Delete <strong>{user.name}</strong> (@{user.username})? They can no longer sign in.
            </p>
            <p className="text-xs text-[#888] mt-1">
              {c.total > 0
                ? `Their ${c.total} article${c.total === 1 ? '' : 's'} stay put — the ${c.published} published one${
                    c.published === 1 ? '' : 's'
                  } remain live on the site, and any drafts become unreachable.`
                : 'They have no articles.'}
            </p>
            {panelError && <p className="text-sm text-red-600 mt-3">{panelError}</p>}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => removeAccount(user.username)}
                disabled={busy === user.username}
                className="bg-red-600 text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {busy === user.username ? 'Deleting…' : 'Delete account'}
              </button>
              <button onClick={() => setPanel(null)} className="text-sm text-[#888] hover:text-[#333]">
                Cancel
              </button>
            </div>
          </div>
        )}
      </li>
    );
  }

  return (
    <div className="space-y-8">
      {!storageReady && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-[#7a5b1e]">
          Redis is not connected, so accounts cannot be stored. Only the env-based owner login works
          until <code>KV_REST_API_URL</code> and <code>KV_REST_API_TOKEN</code> are set.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Accounts" value={users.length + 1} hint="Including the owner" />
        <StatTile label="Admins" value={admins + 1} />
        <StatTile label="Writers" value={users.length - admins} />
        <StatTile label="Awaiting review" value={pendingTotal} hint="Submitted, not yet published" />
      </div>

      {/* Create */}
      <form onSubmit={createAccount} className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-[#333] mb-1">Add an account</h2>
        <p className="text-sm text-[#888] mb-5">
          Writers draft and submit articles. Admins can also review submissions and manage accounts.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="jane"
              autoComplete="off"
              className={inputClass}
            />
            <p className="text-xs text-[#aaa] mt-1">3–32 characters: letters, numbers, . _ -</p>
          </div>
          <div>
            <label className={labelClass}>Display name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              autoComplete="off"
              className={inputClass}
            />
            <p className="text-xs text-[#aaa] mt-1">Shown as the byline on their articles.</p>
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="min 6 characters"
                autoComplete="new-password"
                className={`${inputClass} font-mono`}
              />
              <button
                type="button"
                onClick={() => setPassword(generatePassword())}
                className="text-sm text-[#888] hover:text-[#e2b26f] whitespace-nowrap px-2"
              >
                Generate
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={inputClass}>
              <option value="writer">Writer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        {createError && <p className="text-sm text-red-600 mt-3">{createError}</p>}
        <button
          type="submit"
          disabled={busy === 'create' || !username || password.length < 6}
          className="mt-5 bg-[#e2b26f] text-white font-semibold rounded-lg px-5 py-2 hover:bg-[#d6a45c] transition-colors disabled:opacity-50"
        >
          {busy === 'create' ? 'Adding…' : 'Add account'}
        </button>
      </form>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
          <h2 className="text-lg font-bold text-[#333]">Accounts</h2>
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or username…"
              className={`${inputClass} w-56`}
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | Role)}
              className={`${inputClass} w-32`}
            >
              <option value="all">All roles</option>
              <option value="admin">Admins</option>
              <option value="writer">Writers</option>
            </select>
          </div>
        </div>

        <ul className="divide-y divide-gray-100">
          <UserRow user={owner} isOwner />
          {visible.map((u) => (
            <UserRow key={u.username} user={u} isOwner={false} />
          ))}
        </ul>

        {users.length > 0 && visible.length === 0 && (
          <p className="text-sm text-[#aaa] pt-4">No accounts match that filter.</p>
        )}
        {users.length === 0 && (
          <p className="text-sm text-[#aaa] pt-4">
            No accounts yet beyond the owner. Add a writer above to get started.
          </p>
        )}
      </div>

      {flash && (
        <div className="fixed bottom-6 right-6 bg-[#333] text-white text-sm rounded-lg shadow-lg px-4 py-3 max-w-sm z-50">
          {flash}
        </div>
      )}
    </div>
  );
}
