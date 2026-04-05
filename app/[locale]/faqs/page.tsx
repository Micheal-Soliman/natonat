"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, HelpCircle, MessageCircle, ArrowUpRight, Search, Sparkles, Shield, Package, Truck, RotateCcw } from "lucide-react";
import { Loading } from "@/app/components/loading";

const getCategories = (t: (key: string) => string) => [
  { id: "all", label: t('categories.all'), icon: Sparkles },
  { id: "covers", label: t('categories.covers'), icon: Shield },
  { id: "wallets", label: t('categories.wallets'), icon: Package },
  { id: "orders", label: t('categories.orders'), icon: Truck },
  { id: "returns", label: t('categories.returns'), icon: RotateCcw },
];

const getFaqs = (t: (key: string) => string) => [
  // Luggage Covers
  { category: "covers", questionKey: "sizeCover" },
  { category: "covers", questionKey: "hardShell" },
  { category: "covers", questionKey: "dualZippers" },
  { category: "covers", questionKey: "washCover" },
  { category: "covers", questionKey: "security" },
  { category: "covers", questionKey: "handles" },
  // Passport Wallets
  { category: "wallets", questionKey: "rfid" },
  { category: "wallets", questionKey: "cards" },
  { category: "wallets", questionKey: "leather" },
  { category: "wallets", questionKey: "pocket" },
  // Orders & Shipping
  { category: "orders", questionKey: "shipping" },
  { category: "orders", questionKey: "shippingTime" },
  { category: "orders", questionKey: "track" },
  { category: "orders", questionKey: "freeShip" },
  // Returns & Warranty
  { category: "returns", questionKey: "returnPolicy" },
  { category: "returns", questionKey: "exchange" },
];

export default function FAQsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <FAQsContent />
    </Suspense>
  );
}

function FAQsContent() {
  const t = useTranslations('faqs');
  const [activeCategory, setActiveCategory] = useState("all");
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const categories = getCategories(t);
  const faqs = getFaqs(t);

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

  const filteredFaqs = activeCategory === "all"
    ? faqs
    : faqs.filter((faq) => faq.category === activeCategory);

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F1EBE3]">
        {/* Hero - Premium */}
        <div className="bg-[#0F1A26] pt-28 pb-16 md:pt-44 md:pb-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase mb-4 md:mb-6 block">
              {t('hero.label')}
            </span>
            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 md:mb-8 tracking-tight">
              {t('hero.title')}
            </h1>
            <p className="text-lg md:text-xl md:text-2xl text-white/50 max-w-3xl mx-auto font-light leading-relaxed">
              {t('hero.subtitle')}
            </p>
          </div>
        </div>

        <div ref={ref} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          {/* Category Filter - Card Style */}
          <div className={`grid grid-cols-2 md:grid-cols-5 gap-3 mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {categories.map((cat, index) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`p-5 rounded-2xl text-center transition-all duration-300 group ${
                    activeCategory === cat.id
                      ? "bg-[#0F1A26] text-white shadow-xl shadow-[#0F1A26]/20"
                      : "bg-white text-[#0F1A26] hover:bg-[#EEBC3F]/10 border border-[#0F1A26]/5"
                  }`}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 transition-colors ${activeCategory === cat.id ? 'text-[#EEBC3F]' : 'text-[#0F1A26]/40 group-hover:text-[#EEBC3F]'}`} strokeWidth={1.5} />
                  <span className="text-sm font-medium">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* FAQ Accordion - Premium Style */}
          <div className="space-y-3 md:space-y-4">
            {filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl md:rounded-3xl border border-[#0F1A26]/5 overflow-hidden transition-all duration-500 hover:shadow-lg hover:shadow-[#0F1A26]/5 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${index * 75}ms` }}
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full flex items-center justify-between p-4 md:p-6 lg:p-8 text-left group"
                >
                  <span className="font-semibold text-base md:text-lg text-[#0F1A26] pr-4 tracking-tight group-hover:text-[#EEBC3F] transition-colors duration-300">{t(`questions.${faq.questionKey}.question`)}</span>
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${openItems.includes(index) ? 'bg-[#EEBC3F]' : 'bg-[#F8F6F3] group-hover:bg-[#EEBC3F]/10'}`}>
                    {openItems.includes(index) ? (
                      <ChevronUp className={`w-4 h-4 md:w-5 md:h-5 ${openItems.includes(index) ? 'text-[#0F1A26]' : 'text-[#EEBC3F]'}`} />
                    ) : (
                      <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-[#0F1A26]/40 group-hover:text-[#EEBC3F]" />
                    )}
                  </div>
                </button>
                {openItems.includes(index) && (
                  <div className="px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8 animate-in slide-in-from-top-2 duration-200">
                    <div className="pt-4 border-t border-[#0F1A26]/5">
                      {faq.questionKey === 'pocket' ? (
                        <p className="text-[#0F1A26]/60 leading-relaxed text-base md:text-lg">
                          {t(`questions.${faq.questionKey}.answer`)}{' '}
                          <Link href="/shop/passport-wallets" className="text-[#EEBC3F] hover:text-[#0F1A26] font-medium underline">
                            {t('questions.pocket.linkText')}
                          </Link>
                        </p>
                      ) : (
                        <p className="text-[#0F1A26]/60 leading-relaxed text-base md:text-lg">{t(`questions.${faq.questionKey}.answer`)}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-[#F8F6F3] flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-[#0F1A26]/30" strokeWidth={1.5} />
              </div>
              <p className="text-[#0F1A26]/50 text-xl">{t('empty.title')}</p>
              <button 
                onClick={() => setActiveCategory("all")}
                className="mt-4 text-[#EEBC3F] font-medium hover:underline"
              >
                {t('empty.cta')}
              </button>
            </div>
          )}

          {/* Contact CTA - Premium Card */}
          <div className={`mt-12 md:mt-20 bg-gradient-to-br from-[#0F1A26] via-[#1a2a3a] to-[#0F1A26] rounded-2xl md:rounded-3xl p-8 md:p-10 lg:p-16 text-center border border-white/5 shadow-2xl transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#EEBC3F]/10 flex items-center justify-center mx-auto mb-6 md:mb-8">
              <HelpCircle className="w-8 h-8 md:w-10 md:h-10 text-[#EEBC3F]" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 md:mb-4 tracking-tight">{t('needHelp')}</h2>
            <p className="text-white/50 mb-6 md:mb-10 max-w-lg mx-auto text-base md:text-lg font-light">{t('contactSubtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Button asChild className="bg-[#EEBC3F] text-[#0F1A26] hover:bg-white rounded-full px-6 md:px-10 h-12 md:h-14 font-semibold text-base md:text-lg transition-all duration-300">
                <Link href="/contact" className="inline-flex items-center gap-2">
                  {t('contactCta')}
                  <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-full px-6 md:px-10 h-12 md:h-14 font-medium text-base md:text-lg transition-all duration-300">
                <Link href="https://wa.me/201070004227" target="_blank" className="inline-flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                  {t('whatsappCta')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
