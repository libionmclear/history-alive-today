'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReviewActions({ id }: { id: string }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function review(action: 'approve' | 'reject') {
    if (action === 'reject' && !note.trim()) {
      setError('Add a short note so the writer knows what to fix.');
      return;
    }
    setBusy(true);
    setError('');
    const res = await fetch(`/api/articles/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, note }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      router.push('/admin/review');
      router.refresh();
    } else {
      setError(data.error || 'Action failed');
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 my-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => review('approve')}
          disabled={busy}
          className="bg-green-600 text-white font-semibold rounded-lg px-5 py-2 hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {busy ? 'Working…' : 'Approve & publish'}
        </button>
        <button
          onClick={() => review('reject')}
          disabled={busy}
          className="bg-white border border-red-300 text-red-600 font-semibold rounded-lg px-5 py-2 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          Reject
        </button>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note to writer (required to reject)"
          className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#333] focus:outline-none focus:ring-2 focus:ring-[#e2b26f]/50"
        />
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
