import Image from 'next/image';

const HREF = 'https://kronoscript.com/?utm_source=historyalivetoday&utm_medium=card&utm_campaign=popular';

export default function KronoscriptCard() {
  return (
    <a
      href={HREF}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white rounded-xl overflow-hidden shadow-[0_20px_35px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_35px_rgba(0,0,0,0.2)] transition-shadow"
    >
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-b from-[#1F565B] to-[#143A3E]">
        <Image
          src="/images/kronoscript-card.png"
          alt="Kronoscript"
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-contain lg:object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="px-5 py-5">
        <p className="text-[#1F565B] text-[11px] font-bold uppercase tracking-widest mb-2">
          Your history
        </p>
        <h3 className="text-[#333333] text-base font-bold leading-snug mb-3 group-hover:text-[#1F565B] transition-colors line-clamp-2">
          Write your own history, one post at a time
        </h3>
        <p className="text-[#777777] text-xs leading-relaxed mb-4 line-clamp-3">
          Share each moment with your people, like you already do — and watch them add up to your story.
        </p>
        <div className="flex items-center gap-3">
          <span className="inline-block bg-[#1F565B] text-white text-[11px] font-bold px-3.5 py-2 rounded group-hover:bg-[#17444a] transition-colors">
            Start free ›
          </span>
          <span className="text-[#aaaaaa] text-xs">kronoscript.com</span>
        </div>
      </div>
    </a>
  );
}
