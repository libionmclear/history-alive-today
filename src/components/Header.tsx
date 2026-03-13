'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Things we do', href: '/category/things-we-do' },
  { label: 'Things we say', href: '/category/things-we-say' },
  { label: 'Things we think', href: '/category/things-we-think' },
  { label: 'Things we use', href: '/category/things-we-use' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
      setSearchOpen(false);
      setSearchQuery('');
      setMenuOpen(false);
    }
  };

  const toggleSearch = () => {
    setSearchOpen((prev) => {
      if (!prev) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      return !prev;
    });
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-[#333333] text-white text-xs py-1 px-4 text-center hidden md:block">
        <span>Why We are What We are</span>
      </div>

      {/* Main nav */}
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="History Alive Today logo"
            width={44}
            height={44}
            className="h-10 w-auto opacity-90"
            priority
            unoptimized
          />
          <div className="flex flex-col leading-tight">
            <span className="text-2xl font-bold text-[#333333] tracking-tight">
              History <span className="text-[#e2b26f]">Alive</span> Today
            </span>
            <span className="text-[10px] text-[#aaaaaa] uppercase tracking-widest hidden sm:block">
              Why We are What We are
            </span>
          </div>
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-semibold text-[#333333] hover:text-[#e2b26f] transition-colors uppercase tracking-wide"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Search + Social icons (desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {/* Search */}
          <div className="relative flex items-center">
            <button
              onClick={toggleSearch}
              className="text-[#333333] hover:text-[#e2b26f] transition-colors"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
            </button>
            {searchOpen && (
              <form onSubmit={handleSearchSubmit} className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles…"
                  className="w-48 pl-3 pr-2 py-1 text-sm border border-gray-300 rounded-full focus:outline-none focus:border-[#e2b26f] transition-all mr-7"
                  onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                />
              </form>
            )}
          </div>
          <div className="w-px h-4 bg-gray-300" />
          <a
            href="https://www.facebook.com/HistoryAliveToday"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#333333] hover:text-[#e2b26f] transition-colors"
            aria-label="Facebook"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          <a
            href="https://www.instagram.com/historyalivetoday/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#333333] hover:text-[#e2b26f] transition-colors"
            aria-label="Instagram"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
            </svg>
          </a>
          <a
            href="https://twitter.com/HistoryAliveTo1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#333333] hover:text-[#e2b26f] transition-colors"
            aria-label="Twitter"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
            </svg>
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-[#333333] focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4">
          <ul className="flex flex-col gap-3 pt-3">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block text-sm font-semibold text-[#333333] hover:text-[#e2b26f] transition-colors uppercase tracking-wide"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          {/* Mobile search */}
          <form onSubmit={handleSearchSubmit} className="mt-4 flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles…"
              className="flex-1 pl-3 pr-2 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:border-[#e2b26f]"
            />
            <button type="submit" className="text-[#333333] hover:text-[#e2b26f]" aria-label="Search">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
            </button>
          </form>
          <div className="flex gap-4 mt-4">
            <a href="https://www.facebook.com/HistoryAliveToday" target="_blank" rel="noopener noreferrer" className="text-[#333333] hover:text-[#e2b26f]" aria-label="Facebook">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a href="https://www.instagram.com/historyalivetoday/" target="_blank" rel="noopener noreferrer" className="text-[#333333] hover:text-[#e2b26f]" aria-label="Instagram">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            </a>
            <a href="https://twitter.com/HistoryAliveTo1" target="_blank" rel="noopener noreferrer" className="text-[#333333] hover:text-[#e2b26f]" aria-label="Twitter">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
