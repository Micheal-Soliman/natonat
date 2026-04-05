"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Shield, Lock, Eye, Users, Cookie, FileCheck, Mail, Phone } from "lucide-react";
import { Loading } from "@/app/components/loading";

export default function PrivacyPolicyPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PrivacyContent />
    </Suspense>
  );
}

function PrivacyContent() {
  const t = useTranslations('legal.privacy');
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
          <div className={`flex items-center gap-4 mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="w-12 h-12 rounded-2xl bg-[#EEBC3F]/10 flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-[#EEBC3F]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm text-[#0F1A26]/50">{t('lastUpdated')}</p>
              <p className="text-lg font-semibold text-[#0F1A26]">{t('date')}</p>
            </div>
          </div>

          {/* Introduction */}
          <section className={`mb-12 md:mb-16 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[#EEBC3F]" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-bold text-[#0F1A26]">{t('introduction.title')}</h2>
              </div>
              <p className="text-[#0F1A26]/70 leading-relaxed text-lg">
                {t('introduction.content')}
              </p>
            </div>
          </section>

          {/* Information We Collect */}
          <section className={`mb-12 md:mb-16 transition-all duration-700 delay-150 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-[#EEBC3F]" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-bold text-[#0F1A26]">{t('information.title')}</h2>
              </div>
              <p className="text-[#0F1A26]/70 mb-6 text-lg">{t('information.subtitle')}</p>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: t('information.personal.title'), desc: t('information.personal.desc') },
                  { title: t('information.payment.title'), desc: t('information.payment.desc') },
                  { title: t('information.order.title'), desc: t('information.order.desc') },
                  { title: t('information.technical.title'), desc: t('information.technical.desc') },
                ].map((item, index) => (
                  <div key={index} className="bg-[#F8F6F3] rounded-2xl p-5">
                    <h3 className="font-semibold text-[#0F1A26] mb-2">{item.title}</h3>
                    <p className="text-[#0F1A26]/60 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className={`mb-12 md:mb-16 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-[#EEBC3F]" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-bold text-[#0F1A26]">{t('usage.title')}</h2>
              </div>
              <div className="space-y-4">
                {t.raw('usage.items').map((item: string, index: number) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#EEBC3F]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#EEBC3F] font-bold text-sm">{index + 1}</span>
                    </div>
                    <span className="text-[#0F1A26]/70">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Data Sharing */}
          <section className={`mb-12 md:mb-16 transition-all duration-700 delay-250 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-gradient-to-br from-[#0F1A26] to-[#1a2a3a] rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#EEBC3F]/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#EEBC3F]" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-bold text-white">{t('sharing.title')}</h2>
              </div>
              <p className="text-white/60 mb-6 text-lg">
                {t('sharing.subtitle')}
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <h3 className="font-semibold text-white mb-2">{t('sharing.serviceProviders.title')}</h3>
                  <p className="text-white/60 text-sm">{t('sharing.serviceProviders.desc')}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <h3 className="font-semibold text-white mb-2">{t('sharing.legal.title')}</h3>
                  <p className="text-white/60 text-sm">{t('sharing.legal.desc')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section className={`mb-12 md:mb-16 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-[#EEBC3F]" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-bold text-[#0F1A26]">{t('rights.title')}</h2>
              </div>
              <p className="text-[#0F1A26]/70 mb-6 text-lg">{t('rights.subtitle')}</p>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: t('rights.access.title'), desc: t('rights.access.desc') },
                  { title: t('rights.correction.title'), desc: t('rights.correction.desc') },
                  { title: t('rights.deletion.title'), desc: t('rights.deletion.desc') },
                  { title: t('rights.optout.title'), desc: t('rights.optout.desc') },
                  { title: t('rights.portability.title'), desc: t('rights.portability.desc') },
                  { title: t('rights.restriction.title'), desc: t('rights.restriction.desc') },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#EEBC3F] mt-2 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-[#0F1A26]">{item.title}</h3>
                      <p className="text-[#0F1A26]/60 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Cookies & Security */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-12 md:mb-16">
            <section className={`transition-all duration-700 delay-350 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center">
                    <Cookie className="w-6 h-6 text-[#EEBC3F]" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-xl font-bold text-[#0F1A26]">{t('cookies.title')}</h2>
                </div>
                <p className="text-[#0F1A26]/70 leading-relaxed">
                  {t('cookies.content')}
                </p>
              </div>
            </section>

            <section className={`transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-[#EEBC3F]" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-xl font-bold text-[#0F1A26]">{t('security.title')}</h2>
                </div>
                <p className="text-[#0F1A26]/70 leading-relaxed">
                  {t('security.content')}
                </p>
              </div>
            </section>
          </div>

          {/* Contact */}
          <section className={`transition-all duration-700 delay-450 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
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
                <a 
                  href="tel:+201070004227" 
                  className="inline-flex items-center gap-3 px-6 py-4 bg-white rounded-2xl border border-[#0F1A26]/10 hover:border-[#EEBC3F] transition-colors"
                >
                  <Phone className="w-5 h-5 text-[#EEBC3F]" />
                  <span className="font-medium text-[#0F1A26]" dir="ltr">+20 10 70004227</span>
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
