import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/lib/data';

interface HeroProps {
  featuredArticle?: Article;
}

export default function Hero({ featuredArticle }: HeroProps) {
  return (
    <section className="bg-[#e8efef] py-14 md:py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-10">
          {/* Left: text */}
          <div className="flex-1 md:w-[60%]">
            <p className="text-[#e2b26f] text-xs font-bold uppercase tracking-widest mb-3">
              Welcome to History Alive Today
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-[#333333] leading-tight mb-5">
              Why We are{' '}
              <span className="text-[#e2b26f]">What We are</span>
            </h1>
            <p className="text-[#555555] text-lg mb-6 max-w-lg">
              A fun way to learn the history that matters — in small bites. Discover how everyday
              objects, sayings, behaviors, and traditions stem from human experience across millennia.
            </p>

            {/* Divider */}
            <div className="h-[4px] w-16 bg-[#e2b26f] rounded mb-6" />

            <div className="flex flex-wrap gap-3 mb-8">
              {[
                { label: 'Things we do', href: '/category/things-we-do' },
                { label: 'Things we say', href: '/category/things-we-say' },
                { label: 'Things we think', href: '/category/things-we-think' },
                { label: 'Things we use', href: '/category/things-we-use' },
              ].map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="px-4 py-2 bg-[#e2b26f] text-white text-sm font-semibold rounded hover:bg-[#d4a05e] transition-colors uppercase tracking-wide"
                >
                  {cat.label}
                </Link>
              ))}
            </div>

            {/* Social row */}
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#aaaaaa] uppercase tracking-widest">Follow us</span>
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
          </div>

          {/* Right: featured article card */}
          {featuredArticle && (
            <div className="md:w-[40%] w-full">
              <Link href={`/article/${featuredArticle.slug}`}>
                <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow group">
                  <div className="relative h-56 w-full overflow-hidden">
                    <Image
                      src={featuredArticle.image}
                      alt={featuredArticle.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <span className="absolute top-3 left-3 bg-[#e2b26f] text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wide">
                      Featured
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-[#e2b26f] text-xs font-bold uppercase tracking-widest mb-1">
                      {featuredArticle.categoryLabel}
                    </p>
                    <h2 className="text-[#333333] text-xl font-bold leading-snug mb-2 group-hover:text-[#e2b26f] transition-colors">
                      {featuredArticle.title}
                    </h2>
                    <p className="text-[#aaaaaa] text-xs">
                      {featuredArticle.date} · {featuredArticle.author}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
