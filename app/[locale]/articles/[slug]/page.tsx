"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from 'next-intl';
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { getArticleBySlug, getLatestArticles } from "@/app/lib/articles-data";
import { Loading } from "@/app/components/loading";
import { ArrowLeft, Clock, Calendar, User, Share2, Facebook, Twitter } from "lucide-react";

export default function ArticlePage() {
  return (
    <Suspense fallback={<Loading />}>
      <ArticleContent />
    </Suspense>
  );
}

function ArticleContent() {
  const params = useParams();
  const slug = params.slug as string;
  const locale = useLocale();
  const t = useTranslations('articles');
  const article = getArticleBySlug(slug, locale);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  if (!article) {
    notFound();
  }

  const relatedArticles = getLatestArticles(3, locale).filter(a => a.id !== article.id);

  // Simple markdown parser for content
  const renderContent = (content: string) => {
    const lines = content.trim().split('\n');
    const elements: React.ReactElement[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={key++} className="text-2xl font-bold text-[#0F1A26] mt-12 mb-6">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={key++} className="text-xl font-bold text-[#0F1A26] mt-8 mb-4">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <li key={key++} className="text-[#0F1A26]/70 ml-6 mb-2 list-disc">
            {line.replace('- ', '')}
          </li>
        );
      } else if (line.match(/^\*\*(.*)\*\*$/)) {
        elements.push(
          <p key={key++} className="text-lg font-semibold text-[#0F1A26] my-4">
            {line.replace(/\*\*/g, '')}
          </p>
        );
      } else if (line === '') {
        continue;
      } else {
        elements.push(
          <p key={key++} className="text-[#0F1A26]/70 leading-relaxed mb-4">
            {line}
          </p>
        );
      }
    }

    return elements;
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F1EBE3]">
        {/* Hero Image */}
        <div className="relative h-[50vh] md:h-[60vh]">
          <Image
            src={article.image}
            alt={article.title}
            fill
            sizes="100vw"
            className="w-full h-full object-cover"
            priority
            quality={65}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F1A26] via-[#0F1A26]/50 to-transparent" />

          {/* Back Button */}
          <div className="absolute top-24 left-4 sm:left-6 lg:left-8">
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">{t('backToArticles')}</span>
            </Link>
          </div>

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <span className="inline-block px-3 py-1 bg-[#EEBC3F] text-[#0F1A26] text-xs font-semibold rounded-full mb-2 md:mb-4">
                {article.category}
              </span>
              <h1 className="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2 md:mb-4 tracking-tight">
                {article.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 md:gap-6 text-white/70 text-xs md:text-base">
                <span className="flex items-center gap-1 md:gap-2">
                  <User className="w-3 h-3 md:w-4 md:h-4" />
                  {article.author}
                </span>
                <span className="flex items-center gap-1 md:gap-2">
                  <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                  {new Date(article.date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-1 md:gap-2">
                  <Clock className="w-3 h-3 md:w-4 md:h-4" />
                  {article.readTime} {t('readTime')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div ref={ref} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          {/* Article Content */}
          <article className={`bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-12 shadow-lg shadow-[#0F1A26]/5 transition-transform transition-opacity duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="prose prose-lg max-w-none">
              <p className="text-xl text-[#0F1A26]/80 font-light leading-relaxed mb-8 border-l-4 border-[#EEBC3F] pl-6">
                {article.excerpt}
              </p>

              <div className="space-y-2">
                {renderContent(article.content)}
              </div>
            </div>

            {/* Share Section */}
            <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-[#0F1A26]/10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <span className="text-sm text-[#0F1A26]/60 flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  {t('share')}
                </span>
                <div className="flex items-center gap-3">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-[#1877F2]/10 flex items-center justify-center text-[#1877F2] hover:bg-[#1877F2] hover:text-white transition-colors"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(article.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-black hover:bg-black hover:text-white transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </article>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            <h2 className="text-2xl font-bold text-[#0F1A26] mb-8">{t('related')}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {relatedArticles.map((relatedArticle, index) => (
                <Link
                  key={relatedArticle.id}
                  href={`/articles/${relatedArticle.slug}`}
                  className={`group bg-white rounded-3xl overflow-hidden border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5 hover:shadow-xl hover:shadow-[#0F1A26]/10 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                  style={{ transitionDelay: `${(index + 3) * 100}ms` }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={relatedArticle.image}
                      alt={relatedArticle.title}
                      fill
                      sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                      quality={55}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F1A26]/40 via-transparent to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-[#0F1A26] text-xs font-semibold rounded-full">
                        {relatedArticle.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-[#0F1A26] mb-2 group-hover:text-[#EEBC3F] transition-colors line-clamp-2">
                      {relatedArticle.title}
                    </h3>
                    <p className="text-[#0F1A26]/60 text-sm line-clamp-2">
                      {relatedArticle.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
