'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push(data.role === 'admin' ? '/admin' : '/writer');
        router.refresh();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center bg-[#e8efef] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-xl shadow-sm p-8">
        <div className="h-[4px] w-12 bg-[#e2b26f] rounded mb-6" />
        <h1 className="text-2xl font-bold text-[#333333] mb-1">Sign in</h1>
        <p className="text-sm text-[#888888] mb-6">Admins and writers sign in here.</p>

        <label className="block text-xs font-semibold uppercase tracking-widest text-[#aaa] mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoCapitalize="none"
          autoFocus
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#e2b26f]/50 mb-4"
        />

        <label className="block text-xs font-semibold uppercase tracking-widest text-[#aaa] mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#e2b26f]/50 mb-4"
        />

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading || !username || !password}
          className="w-full bg-[#e2b26f] text-white font-semibold rounded-lg py-2.5 hover:bg-[#d6a45c] transition-colors disabled:opacity-50"
        >
          {loading ? 'Checking…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
