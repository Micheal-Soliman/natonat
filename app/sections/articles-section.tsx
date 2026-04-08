"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from 'next-intl';
import { getLatestArticles } from "@/app/lib/articles-data";
import { ArrowRight, Clock, Calendar } from "lucide-react";

export function ArticlesSection() {
  const t = useTranslations('articles');
  const locale = useLocale();
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const articles = getLatestArticles(3, locale);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-20 md:py-32 bg-[#F1EBE3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`flex items-end justify-between mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div>
            <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase mb-4 block">
              {t('label')}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-[#0F1A26] tracking-tight">
              {t('title')} <span className="text-[#EEBC3F]">{t('titleHighlight')}</span>
            </h2>
          </div>
          <Link
            href="/articles"
            className="hidden md:flex items-center gap-2 text-[#0F1A26] font-semibold hover:text-[#EEBC3F] transition-colors group"
          >
            {t('viewAll')}
            <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Articles Grid */}
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {articles.map((article, index) => (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className={`group bg-white rounded-3xl overflow-hidden border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5 hover:shadow-xl hover:shadow-[#0F1A26]/10 transition-all duration-500 h-full flex flex-col ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${(index + 1) * 100}ms` }}
            >
              <div className="relative overflow-hidden flex-shrink-0 h-40 sm:h-48">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F1A26]/60 via-[#0F1A26]/20 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-[#EEBC3F] text-[#0F1A26] text-xs font-semibold rounded-full">
                    {article.category}
                  </span>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center gap-4 text-xs text-[#0F1A26]/40 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(article.date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.readTime}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#0F1A26] mb-2 group-hover:text-[#EEBC3F] transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-[#0F1A26]/60 text-sm line-clamp-2 mb-4 flex-grow">
                  {article.excerpt}
                </p>
                <span className="text-[#EEBC3F] text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all mt-auto">
                  {t('readMore')} <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="mt-10 text-center md:hidden">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F1A26] text-white rounded-full font-semibold hover:bg-[#EEBC3F] hover:text-[#0F1A26] transition-colors"
          >
            {t('viewAll')}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
