"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { FileText, ShoppingBag, CreditCard, Truck, RotateCcw, Copyright, User, Scale, Gavel, RefreshCw, Mail } from "lucide-react";
import { Loading } from "@/app/components/loading";

const getTerms = (t: (key: string) => string) => [
  { icon: FileText, key: "agreement" },
  { icon: ShoppingBag, key: "products" },
  { icon: CreditCard, key: "payment" },
  { icon: Truck, key: "shipping" },
  { icon: RotateCcw, key: "returns" },
  { icon: Copyright, key: "intellectual" },
  { icon: User, key: "accounts" },
  { icon: Scale, key: "liability" },
  { icon: Gavel, key: "governing" },
  { icon: RefreshCw, key: "changes" },
];

export default function TermsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <TermsContent />
    </Suspense>
  );
}

function TermsContent() {
  const t = useTranslations('legal.terms');
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const terms = getTerms(t);

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

        <div ref={ref} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Last Updated */}
          <div className={`flex items-center gap-3 md:gap-4 mb-8 md:mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-[#EEBC3F]/10 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 md:w-6 md:h-6 text-[#EEBC3F]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm text-[#0F1A26]/50">{t('lastUpdated')}</p>
              <p className="text-lg font-semibold text-[#0F1A26]">{t('date')}</p>
            </div>
          </div>

          {/* Terms Sections */}
          <div className="space-y-4 md:space-y-6">
            {terms.map((term, index) => {
              const Icon = term.icon;
              return (
                <section 
                  key={index}
                  className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5 hover:shadow-xl transition-shadow">
                    <div className="flex items-start gap-3 md:gap-5">
                      <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-[#EEBC3F]/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 md:w-7 md:h-7 text-[#EEBC3F]" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 md:gap-3 mb-2 md:mb-3">
                          <span className="text-xs md:text-sm font-bold text-[#EEBC3F]">{String(index + 1).padStart(2, '0')}</span>
                          <h2 className="text-lg md:text-xl font-bold text-[#0F1A26]">{t(`sections.${term.key}.title`)}</h2>
                        </div>
                        <p className="text-[#0F1A26]/70 leading-relaxed text-sm md:text-base lg:text-lg">{t(`sections.${term.key}.content`)}</p>
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>

          {/* Contact */}
          <section className={`mt-12 md:mt-16 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-gradient-to-br from-[#EEBC3F]/20 via-[#F8F6F3] to-white rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 border border-[#EEBC3F]/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#EEBC3F] flex items-center justify-center">
                  <Mail className="w-6 h-6 text-[#0F1A26]" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-bold text-[#0F1A26]">{t('contact.title')}</h2>
              </div>
              <p className="text-[#0F1A26]/70 mb-6 text-lg">
                {t('contact.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="mailto:info@natonat.com" 
                  className="inline-flex items-center gap-3 px-6 py-4 bg-white rounded-2xl border border-[#0F1A26]/10 hover:border-[#EEBC3F] transition-colors"
                >
                  <Mail className="w-5 h-5 text-[#EEBC3F]" />
                  <span className="font-medium text-[#0F1A26]">info@natonat.com</span>
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
