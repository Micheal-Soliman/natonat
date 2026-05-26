"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Shield, Check, AlertTriangle, Clock, Package, Sparkles, Mail, ArrowRight } from "lucide-react";
import { Loading } from "@/app/components/loading";

const getClaimSteps = (t: (key: string) => string) => [
  { title: t('steps.contact.title'), desc: t('steps.contact.desc') },
  { title: t('steps.evidence.title'), desc: t('steps.evidence.desc') },
  { title: t('steps.resolution.title'), desc: t('steps.resolution.desc') }
];

export default function WarrantyPage() {
  return (
    <Suspense fallback={<Loading />}>
      <WarrantyContent />
    </Suspense>
  );
}

function WarrantyContent() {
  const t = useTranslations('legal.warranty');
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

  const claimSteps = getClaimSteps(t);

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
              <span className="text-[#EEBC3F]">{t('hero.title')}</span> {t('hero.warrantyText')}
            </h1>
            <p className="text-lg md:text-xl md:text-2xl text-white/50 max-w-3xl mx-auto font-light leading-relaxed">
              {t('hero.subtitle')}
            </p>
          </div>
        </div>

        <div ref={ref} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Warranty Badge - Prominent */}
          <div className={`flex justify-center mb-12 md:mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center justify-center gap-4 md:gap-8 bg-gradient-to-r from-[#EEBC3F]/30 via-[#EEBC3F]/20 to-[#EEBC3F]/30 rounded-2xl md:rounded-3xl px-6 md:px-16 py-6 md:py-10 border-2 border-[#EEBC3F] shadow-xl shadow-[#EEBC3F]/20 hover:shadow-2xl hover:shadow-[#EEBC3F]/30 transition-all duration-300 transform hover:scale-105 min-w-[280px] md:min-w-[400px]">
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl md:rounded-3xl bg-[#EEBC3F] flex items-center justify-center shadow-lg shadow-[#EEBC3F]/50">
                <Shield className="w-10 h-10 md:w-14 md:h-14 text-[#0F1A26]" strokeWidth={2} />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs md:text-sm text-[#0F1A26]/60 font-medium uppercase tracking-wider mb-1 md:mb-2">{t('badge.label')}</p>
                <p className="text-3xl md:text-5xl font-bold text-[#0F1A26] tracking-tight">{t('badge.duration')}</p>
              </div>
            </div>
          </div>

          {/* Coverage */}
          <section className={`mb-12 md:mb-16 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-[#EEBC3F]" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-[#0F1A26]">{t('coverage.title')}</h2>
            </div>
            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5">
              <p className="text-[#0F1A26]/70 mb-6 text-lg">
                {t('coverage.description')} <strong className="text-[#0F1A26]">{t('coverage.warrantyPeriod')}</strong> {t('coverage.againstDefects')}
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
                  <h3 className="font-bold text-[#0F1A26] mb-4 flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" strokeWidth={2} />
                    {t('coverage.covered.title')}
                  </h3>
                  <ul className="space-y-3 text-[#0F1A26]/70">
                    {t.raw('coverage.covered.items').map((item: string, index: number) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                  <h3 className="font-bold text-[#0F1A26] mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" strokeWidth={2} />
                    {t('coverage.notCovered.title')}
                  </h3>
                  <ul className="space-y-3 text-[#0F1A26]/70">
                    {t.raw('coverage.notCovered.items').map((item: string, index: number) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Product Specific */}
          <section className={`mb-12 md:mb-16 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center">
                <Package className="w-5 h-5 md:w-6 md:h-6 text-[#EEBC3F]" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-[#0F1A26]">{t('productSpecific.title')}</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5">
                <h3 className="font-bold text-[#0F1A26] mb-4 text-lg">{t('productSpecific.luggageCovers.title')}</h3>
                <ul className="space-y-2 text-[#0F1A26]/70">
                  {t.raw('productSpecific.luggageCovers.items').map((item: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#EEBC3F]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5">
                <h3 className="font-bold text-[#0F1A26] mb-4 text-lg">{t('productSpecific.passportWallets.title')}</h3>
                <ul className="space-y-2 text-[#0F1A26]/70">
                  {t.raw('productSpecific.passportWallets.items').map((item: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#EEBC3F]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* How to Claim */}
          <section className={`mb-12 md:mb-16 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-[#EEBC3F]" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-[#0F1A26]">{t('howToClaim.title')}</h2>
            </div>
            <div className="bg-gradient-to-br from-[#0F1A26] to-[#1a2a3a] rounded-2xl md:rounded-3xl p-6 md:p-8">
              <div className="space-y-6">
                {claimSteps.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#EEBC3F]/20 flex items-center justify-center">
                      <span className="text-[#EEBC3F] font-bold text-lg">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white mb-1">{step.title}</h3>
                      <p className="text-white/70">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Important Notes */}
          <section className={`mb-12 md:mb-16 transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-[#EEBC3F]" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-bold text-[#0F1A26]">{t('importantNotes.title')}</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-[#EEBC3F]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F1A26] mb-1">{t('importantNotes.period.title')}</h3>
                    <p className="text-[#0F1A26]/60 text-sm">{t('importantNotes.period.desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-[#EEBC3F]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F1A26] mb-1">{t('importantNotes.airline.title')}</h3>
                    <p className="text-[#0F1A26]/60 text-sm">{t('importantNotes.airline.desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className={`transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-gradient-to-br from-[#EEBC3F]/20 via-[#F8F6F3] to-white rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 border border-[#EEBC3F]/20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#EEBC3F] flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-[#0F1A26]" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-bold text-[#0F1A26] mb-3">{t('cta.title')}</h2>
              <p className="text-[#0F1A26]/70 mb-6 max-w-lg mx-auto">
                {t('cta.subtitle')}
              </p>
              <Link 
                href="/contact" 
                className="inline-flex items-center gap-2 bg-[#0F1A26] text-white px-8 py-4 rounded-full font-semibold hover:bg-[#EEBC3F] hover:text-[#0F1A26] transition-all duration-300"
              >
                {t('cta.button')}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
