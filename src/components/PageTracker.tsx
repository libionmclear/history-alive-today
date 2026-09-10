'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const VISITOR_KEY = 'hat_vid';

/** The back office is our own traffic — don't spend a request on it. */
const SKIP = ['/admin', '/writer', '/login'];

/** Only the first tracked page of a document reports where the reader came from. */
let referrerReported = false;

/**
 * A stable, anonymous id for this browser. Random — no personal data, no
 * fingerprinting — and only ever used to count unique visitors and to group
 * a visit's pages into one session.
 */
function visitorId(): string | null {
  try {
    let id = window.localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      window.localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    // Private mode or storage blocked: the view still counts, the visitor doesn't.
    return null;
  }
}

/**
 * Records a view of every public page. Lives in the root layout, so it also
 * fires on client-side navigation, where the layout itself never remounts.
 */
export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (SKIP.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return;

    const referrer = referrerReported ? null : document.referrer || null;
    referrerReported = true;

    fetch('/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, referrer, visitorId: visitorId() }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
