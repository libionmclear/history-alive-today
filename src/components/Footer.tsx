import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#333333] text-white mt-16">
      {/* Gold separator */}
      <div className="h-[6px] bg-[#e2b26f]" />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <h2 className="text-2xl font-bold mb-2">
              History <span className="text-[#e2b26f]">Alive</span> Today
            </h2>
            <p className="text-[#aaaaaa] text-sm mb-4">
              Why We are What We are — explore the history behind everyday life in small, engaging bites.
            </p>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/HistoryAliveToday" target="_blank" rel="noopener noreferrer" className="text-[#aaaaaa] hover:text-[#e2b26f] transition-colors" aria-label="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/historyalivetoday/" target="_blank" rel="noopener noreferrer" className="text-[#aaaaaa] hover:text-[#e2b26f] transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                </svg>
              </a>
              <a href="https://twitter.com/HistoryAliveTo1" target="_blank" rel="noopener noreferrer" className="text-[#aaaaaa] hover:text-[#e2b26f] transition-colors" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#e2b26f] mb-4">Categories</h3>
            <ul className="space-y-2">
              {[
                { label: 'Things we do', href: '/category/things-we-do' },
                { label: 'Things we say', href: '/category/things-we-say' },
                { label: 'Things we think', href: '/category/things-we-think' },
                { label: 'Things we use', href: '/category/things-we-use' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[#aaaaaa] hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#e2b26f] mb-4">About</h3>
            <p className="text-[#aaaaaa] text-sm leading-relaxed">
              History Alive Today makes history accessible and entertaining by connecting the past to
              our everyday present. Every article explores why we are what we are.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[#aaaaaa] text-xs">
            © {new Date().getFullYear()} History Alive Today. All rights reserved.
          </p>
          <Link href="/" className="text-[#aaaaaa] hover:text-white text-xs transition-colors">
            historyalivetoday.com
          </Link>
        </div>
      </div>
    </footer>
  );
}
