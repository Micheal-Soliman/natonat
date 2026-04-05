"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from 'next-intl';
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { getArticlesByLocale, getAllCategories, getFeaturedArticles } from "@/app/lib/articles-data";
import { Loading } from "@/app/components/loading";
import { Clock, ArrowRight, Tag, Calendar, User } from "lucide-react";

export default function ArticlesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ArticlesContent />
    </Suspense>
  );
}

function ArticlesContent() {
  const t = useTranslations('articles');
  const locale = useLocale();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const categories = getAllCategories(locale);
  const featuredArticles = getFeaturedArticles(locale);
  const articles = getArticlesByLocale(locale);
  
  const filteredArticles = selectedCategory
    ? articles.filter(article => article.category === selectedCategory)
    : articles;

  const sortedArticles = filteredArticles.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F1EBE3]">
        {/* Hero */}
        <div className="bg-[#0F1A26] pt-28 pb-16 md:pt-44 md:pb-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase mb-4 md:mb-6 block">
              {t('sectionLabel')}
            </span>
            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 md:mb-8 tracking-tight">
              {t('title')}
            </h1>
            <p className="text-lg md:text-xl md:text-2xl text-white/50 max-w-3xl mx-auto font-light leading-relaxed">
              {t('subtitle')}
            </p>
          </div>
        </div>

        <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Category Filter */}
          <div className={`flex flex-wrap gap-3 mb-12 justify-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                !selectedCategory
                  ? 'bg-[#0F1A26] text-white'
                  : 'bg-white text-[#0F1A26] hover:bg-[#0F1A26] hover:text-white border border-[#0F1A26]/10'
              }`}
            >
              {t('allArticles')}
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-[#0F1A26] text-white'
                    : 'bg-white text-[#0F1A26] hover:bg-[#0F1A26] hover:text-white border border-[#0F1A26]/10'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Featured Articles (when no category selected) */}
          {!selectedCategory && featuredArticles.length > 0 && (
            <div className={`mb-16 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h2 className="text-2xl font-bold text-[#0F1A26] mb-8">{t('featured')}</h2>
              <div className="grid md:grid-cols-2 gap-8">
                {featuredArticles.map((article, index) => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.slug}`}
                    className={`group bg-white rounded-3xl overflow-hidden border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5 hover:shadow-xl hover:shadow-[#0F1A26]/10 transition-all duration-500 ${
                      index === 0 ? 'md:row-span-2' : ''
                    }`}
                  >
                    <div className={`relative overflow-hidden ${index === 0 ? 'h-64 md:h-80' : 'h-48'}`}>
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0F1A26]/60 via-transparent to-transparent" />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-[#EEBC3F] text-[#0F1A26] text-xs font-semibold rounded-full">
                          {article.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-[#0F1A26] mb-3 group-hover:text-[#EEBC3F] transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-[#0F1A26]/60 mb-4 line-clamp-2">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-[#0F1A26]/40">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(article.date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {article.readTime}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* All Articles Grid */}
          <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-2xl font-bold text-[#0F1A26] mb-8">
              {selectedCategory || t('latest')}
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedArticles.map((article, index) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.slug}`}
                  className="group bg-white rounded-3xl overflow-hidden border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5 hover:shadow-xl hover:shadow-[#0F1A26]/10 transition-all duration-500"
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F1A26]/40 via-transparent to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-[#0F1A26] text-xs font-semibold rounded-full">
                        {article.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-[#0F1A26] mb-2 group-hover:text-[#EEBC3F] transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-[#0F1A26]/60 text-sm mb-4 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-[#0F1A26]/40">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(article.date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {article.readTime}
                        </span>
                      </div>
                      <span className="text-[#EEBC3F] text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        {t('readMore')} <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
