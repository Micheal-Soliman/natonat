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
import { ArrowLeft, Clock, Calendar, User, Share2, Facebook, Twitter, BookOpen, ShoppingBag, Ruler, ArrowRight } from "lucide-react";

type HeadingItem = {
  id: string;
  text: string;
};

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function getArticleHeadings(content: string): HeadingItem[] {
  return content
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("## "))
    .map((line) => {
      const text = line.replace("## ", "").trim();
      return {
        id: slugifyHeading(text),
        text,
      };
    });
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-[#0F1A26]">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

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
  const headings = getArticleHeadings(article.content);
  const isArabic = locale === "ar";
  const dateLabel = new Date(article.date).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const articleUrl = `https://www.natonat.com/${locale}/articles/${article.slug}`;
  const contentLabels = {
    breadcrumbHome: t("detail.breadcrumbHome"),
    breadcrumbArticles: t("detail.breadcrumbArticles"),
    inThisGuide: t("detail.inThisGuide"),
    shopCtaTitle: t("detail.shopCtaTitle"),
    shopCtaText: t("detail.shopCtaText"),
    shopCtaAction: t("detail.shopCtaAction"),
    sizeCtaAction: t("detail.sizeCtaAction"),
    articleSummary: t("detail.articleSummary"),
  };

  // Simple markdown parser for content
  const renderContent = (content: string) => {
    const lines = content.trim().split('\n');
    const elements: React.ReactElement[] = [];
    let listItems: React.ReactNode[] = [];
    let orderedItems: React.ReactNode[] = [];
    let key = 0;

    const flushLists = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${key++}`} className="my-6 space-y-2 ps-6 list-disc text-[#0F1A26]/75 leading-relaxed">
            {listItems}
          </ul>
        );
        listItems = [];
      }

      if (orderedItems.length > 0) {
        elements.push(
          <ol key={`ol-${key++}`} className="my-6 space-y-2 ps-6 list-decimal text-[#0F1A26]/75 leading-relaxed">
            {orderedItems}
          </ol>
        );
        orderedItems = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('## ')) {
        flushLists();
        const heading = line.replace('## ', '').trim();
        elements.push(
          <h2 id={slugifyHeading(heading)} key={key++} className="scroll-mt-28 text-2xl md:text-3xl font-bold text-[#0F1A26] mt-12 mb-5 leading-tight">
            {heading}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        flushLists();
        elements.push(
          <h3 key={key++} className="text-xl md:text-2xl font-bold text-[#0F1A26] mt-8 mb-4 leading-tight">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('- ')) {
        orderedItems = [];
        listItems.push(
          <li key={`li-${key++}`}>
            {renderInline(line.replace('- ', ''))}
          </li>
        );
      } else if (/^\d+\.\s/.test(line)) {
        listItems = [];
        orderedItems.push(
          <li key={`oli-${key++}`}>
            {renderInline(line.replace(/^\d+\.\s/, ''))}
          </li>
        );
      } else if (line.match(/^\*\*(.*)\*\*$/)) {
        flushLists();
        elements.push(
          <p key={key++} className="text-lg font-semibold text-[#0F1A26] my-4">
            {line.replace(/\*\*/g, '')}
          </p>
        );
      } else if (line === '') {
        flushLists();
        continue;
      } else {
        flushLists();
        elements.push(
          <p key={key++} className="text-base md:text-lg text-[#0F1A26]/72 leading-8 mb-5">
            {renderInline(line)}
          </p>
        );
      }
    }

    flushLists();

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
                  {dateLabel}
                </span>
                <span className="flex items-center gap-1 md:gap-2">
                  <Clock className="w-3 h-3 md:w-4 md:h-4" />
                  {article.readTime} {t('readTime')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-[#0F1A26]/55">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="hover:text-[#EEBC3F] transition-colors">
                  {contentLabels.breadcrumbHome}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/articles" className="hover:text-[#EEBC3F] transition-colors">
                  {contentLabels.breadcrumbArticles}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-[#0F1A26] font-medium line-clamp-1">{article.title}</li>
            </ol>
          </nav>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-8 lg:gap-10 items-start">
            {/* Article Content */}
            <article className={`bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-12 shadow-lg shadow-[#0F1A26]/5 transition-transform transition-opacity duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <header className="mb-8 pb-8 border-b border-[#0F1A26]/10">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#EEBC3F] mb-4">
                  <BookOpen className="w-4 h-4" />
                  {article.category}
                </span>
                <h2 className="text-2xl md:text-4xl font-bold text-[#0F1A26] leading-tight mb-5">
                  {contentLabels.articleSummary}
                </h2>
                <p className="text-lg md:text-xl text-[#0F1A26]/78 leading-8 font-light">
                  {article.excerpt}
                </p>
              </header>

              <div className="max-w-none">
                {renderContent(article.content)}
              </div>

              <section aria-label="Shop natOnat travel essentials" className="mt-10 md:mt-12 border-y border-[#EEBC3F]/35 bg-[#FFF8E7] px-5 py-6 md:px-8 md:py-7">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-[#0F1A26] mb-2">
                      {contentLabels.shopCtaTitle}
                    </h2>
                    <p className="text-[#0F1A26]/65 leading-7 max-w-2xl">
                      {contentLabels.shopCtaText}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 md:shrink-0">
                    <Link
                      href="/shop"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#0F1A26] text-white rounded-full text-sm font-semibold hover:bg-[#EEBC3F] hover:text-[#0F1A26] transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      {contentLabels.shopCtaAction}
                    </Link>
                    <Link
                      href="/how-it-works"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-[#0F1A26] rounded-full text-sm font-semibold border border-[#0F1A26]/10 hover:border-[#EEBC3F] hover:text-[#B88300] transition-colors"
                    >
                      <Ruler className="w-4 h-4" />
                      {contentLabels.sizeCtaAction}
                    </Link>
                  </div>
                </div>
              </section>

              {/* Share Section */}
              <footer className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-[#0F1A26]/10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <span className="text-sm text-[#0F1A26]/60 flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    {t('share')}
                  </span>
                  <div className="flex items-center gap-3">
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on Facebook"
                      className="w-10 h-10 rounded-full bg-[#1877F2]/10 flex items-center justify-center text-[#1877F2] hover:bg-[#1877F2] hover:text-white transition-colors"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(article.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on X"
                      className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-black hover:bg-black hover:text-white transition-colors"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </footer>
            </article>

            <aside className="lg:sticky lg:top-28 space-y-5">
              {headings.length > 0 && (
                <nav aria-label={contentLabels.inThisGuide} className="bg-white rounded-2xl p-5 border border-[#0F1A26]/8 shadow-lg shadow-[#0F1A26]/5">
                  <h2 className="text-sm font-bold text-[#0F1A26] mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#EEBC3F]" />
                    {contentLabels.inThisGuide}
                  </h2>
                  <ol className="space-y-3">
                    {headings.map((heading) => (
                      <li key={heading.id}>
                        <a href={`#${heading.id}`} className="block text-sm leading-6 text-[#0F1A26]/65 hover:text-[#EEBC3F] transition-colors">
                          {heading.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}

              <section aria-label="natOnat shopping links" className="bg-[#0F1A26] rounded-2xl p-5 text-white shadow-lg shadow-[#0F1A26]/10">
                <h2 className="text-lg font-bold mb-2">{contentLabels.shopCtaTitle}</h2>
                <p className="text-white/65 text-sm leading-6 mb-5">{contentLabels.shopCtaText}</p>
                <Link
                  href="/shop"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#EEBC3F] px-4 py-3 text-sm font-semibold text-[#0F1A26] hover:bg-white transition-colors"
                >
                  {contentLabels.shopCtaAction}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </section>
            </aside>
          </div>
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
