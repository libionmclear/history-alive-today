'use client';

import { useState } from 'react';

interface PublicUser {
  username: string;
  name: string;
  role: 'admin' | 'writer';
  createdAt: number;
}

export default function WritersManager({ initialUsers }: { initialUsers: PublicUser[] }) {
  const [users, setUsers] = useState<PublicUser[]>(initialUsers);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'writer' | 'admin'>('writer');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, name, password, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setUsers((prev) => [...prev, data.user].sort((a, b) => a.username.localeCompare(b.username)));
        setUsername('');
        setName('');
        setPassword('');
        setRole('writer');
      } else {
        setError(data.error || 'Could not create user');
      }
    } finally {
      setBusy(false);
    }
  }

  async function removeUser(u: string) {
    if (!confirm(`Delete writer "${u}"? Their articles remain but they can no longer sign in.`)) return;
    const res = await fetch(`/api/admin/users/${encodeURIComponent(u)}`, { method: 'DELETE' });
    if (res.ok) setUsers((prev) => prev.filter((x) => x.username !== u));
  }

  async function resetPassword(u: string) {
    const pw = prompt(`New password for "${u}" (min 6 chars):`);
    if (!pw) return;
    const res = await fetch(`/api/admin/users/${encodeURIComponent(u)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    const data = await res.json().catch(() => ({}));
    alert(res.ok ? 'Password updated.' : data.error || 'Failed to update password');
  }

  return (
    <div className="space-y-8">
      {/* Add form */}
      <form onSubmit={addUser} className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-[#333] mb-4">Add a writer</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#aaa] mb-1">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="jane"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[#333] focus:outline-none focus:ring-2 focus:ring-[#e2b26f]/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#aaa] mb-1">Display name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[#333] focus:outline-none focus:ring-2 focus:ring-[#e2b26f]/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#aaa] mb-1">Password</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min 6 characters"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[#333] focus:outline-none focus:ring-2 focus:ring-[#e2b26f]/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#aaa] mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'writer' | 'admin')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[#333] focus:outline-none focus:ring-2 focus:ring-[#e2b26f]/50"
            >
              <option value="writer">Writer</option>
              <option value="admin">Admin (can review)</option>
            </select>
          </div>
        </div>
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        <button
          type="submit"
          disabled={busy || !username || !password}
          className="mt-4 bg-[#e2b26f] text-white font-semibold rounded-lg px-5 py-2 hover:bg-[#d6a45c] transition-colors disabled:opacity-50"
        >
          {busy ? 'Adding…' : 'Add writer'}
        </button>
      </form>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-[#333] mb-4">Accounts ({users.length})</h2>
        {users.length === 0 ? (
          <p className="text-sm text-[#aaa]">No writer accounts yet. The owner account (env-based) is always active.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {users.map((u) => (
              <li key={u.username} className="flex items-center justify-between py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#333] truncate">
                    {u.name}{' '}
                    <span className="text-[#aaa] font-normal">@{u.username}</span>
                  </p>
                  <span
                    className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                      u.role === 'admin' ? 'bg-[#e2b26f]/20 text-[#b07d2f]' : 'bg-gray-100 text-[#888]'
                    }`}
                  >
                    {u.role}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => resetPassword(u.username)} className="text-xs text-[#888] hover:text-[#e2b26f]">
                    Reset password
                  </button>
                  <button onClick={() => removeUser(u.username)} className="text-xs text-red-500 hover:text-red-700">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
