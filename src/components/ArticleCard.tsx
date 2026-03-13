import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/lib/data';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'compact';
}

export default function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  if (variant === 'compact') {
    return (
      <Link href={`/article/${article.slug}`} className="group flex gap-3 items-start">
        <div className="relative w-20 h-16 flex-shrink-0 rounded-lg overflow-hidden">
          <Image
            src={article.image}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#e2b26f] text-[10px] font-bold uppercase tracking-widest mb-1">
            {article.categoryLabel}
          </p>
          <h3 className="text-[#333333] text-sm font-semibold leading-snug group-hover:text-[#e2b26f] transition-colors line-clamp-2">
            {article.title}
          </h3>
          <p className="text-[#aaaaaa] text-[10px] mt-1">{article.date}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/article/${article.slug}`} className="group block bg-white rounded-xl overflow-hidden shadow-[0_20px_35px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_35px_rgba(0,0,0,0.2)] transition-shadow">
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={article.image}
          alt={article.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
      <div className="px-5 py-5">
        <p className="text-[#e2b26f] text-[11px] font-bold uppercase tracking-widest mb-2">
          {article.categoryLabel}
        </p>
        <h3 className="text-[#333333] text-base font-bold leading-snug mb-3 group-hover:text-[#e2b26f] transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="text-[#777777] text-xs leading-relaxed mb-4 line-clamp-3">
          {article.excerpt}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[#aaaaaa] text-xs">{article.date}</span>
          <span className="text-[#aaaaaa] text-xs">{article.author}</span>
        </div>
      </div>
    </Link>
  );
}
