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
 * Records a view of every public page and how long the reader stayed on it.
 * Lives in the root layout, so it also fires on client-side navigation, where
 * the layout itself never remounts — the effect's cleanup ends one page's
 * timing exactly as the next page's begins.
 */
export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (SKIP.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return;

    const path = pathname;
    const referrer = referrerReported ? null : document.referrer || null;
    referrerReported = true;

    fetch('/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, referrer, visitorId: visitorId() }),
    }).catch(() => {});

    // Time on page: accumulate only while the tab is visible, then flush once
    // when the reader leaves (tab hidden / navigates away / closes).
    const start = Date.now();
    let activeMs = 0;
    let lastResume = Date.now();
    let sent = false;

    const accumulate = () => {
      activeMs += Date.now() - lastResume;
      lastResume = Date.now();
    };

    const flush = () => {
      if (sent) return;
      sent = true;
      if (document.visibilityState === 'visible') accumulate();
      const ms = activeMs || Date.now() - start;
      const payload = JSON.stringify({ path, ms });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/track-dwell', new Blob([payload], { type: 'application/json' }));
      } else {
        fetch('/api/track-dwell', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        accumulate();
        flush();
      } else {
        lastResume = Date.now();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [pathname]);

  return null;
}
