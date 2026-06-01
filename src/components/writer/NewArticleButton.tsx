'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewArticleButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    const res = await fetch('/api/articles', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.id) {
      router.push(`/writer/edit/${data.id}`);
    } else {
      setBusy(false);
      alert(data.error || 'Could not create a new article');
    }
  }

  return (
    <button
      onClick={create}
      disabled={busy}
      className="bg-[#e2b26f] text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-[#d6a45c] transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      {busy ? 'Creating…' : '+ New article'}
    </button>
  );
}
