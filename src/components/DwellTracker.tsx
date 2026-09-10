'use client';

import { useEffect } from 'react';

/**
 * Measures how long a reader actually spends on an article. The view itself is
 * counted by PageTracker in the root layout; this only reports dwell time.
 */
export default function DwellTracker({ slug }: { slug: string }) {
  useEffect(() => {
    // Accumulate only while the tab is visible, then flush once when the
    // reader leaves (tab hidden / navigates / closes).
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
      const payload = JSON.stringify({ slug, ms });
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
  }, [slug]);

  return null;
}
