"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useTranslations } from 'next-intl';
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Truck, Clock, Package, RotateCcw, AlertCircle, Phone, Mail } from "lucide-react";
import { Loading } from "@/app/components/loading";

export default function ShippingPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ShippingContent />
    </Suspense>
  );
}

function ShippingContent() {
  const t = useTranslations('legal.shipping');
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

  const shippingRates = [
    { region: t('rates.cairoGiza'), standard: "100 EGP", express: "-", time: t('rates.cairoTime') },
    { region: t('rates.alexandria'), standard: "100 EGP", express: "-", time: t('rates.cairoTime') },
    { region: t('rates.otherGovs'), standard: "100 EGP", express: "-", time: t('rates.govsTime') },
  ];

  const returnSteps = [
    t('returns.step1'),
    t('returns.step2'),
    t('returns.step3'),
    t('returns.step4')
  ];

  const infoCards = [
    { icon: Clock, title: t('processing.title'), desc: t('processing.description') },
    { icon: Package, title: t('tracking.title'), desc: t('tracking.description') },
    { icon: AlertCircle, title: t('delays.title'), desc: t('delays.description') },
  ];

  const returnPolicy = [
    t('returns.returns30'),
    t('returns.unused'),
    t('returns.freeExchanges'),
    t('returns.refunds57')
  ];

  const nonReturnable = [
    t('returns.used'),
    t('returns.noPackaging'),
    t('returns.damaged'),
    t('returns.giftCards')
  ];

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
          {/* Shipping Section */}
          <section className={`mb-12 md:mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#EEBC3F]/10 flex items-center justify-center">
                <Truck className="w-6 h-6 md:w-7 md:h-7 text-[#EEBC3F]" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#0F1A26]">{t('shippingTitle')}</h2>
                <p className="text-[#0F1A26]/60 text-sm md:text-base">{t('shippingSubtitle')}</p>
              </div>
            </div>

            {/* Shipping Table */}
            <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5 mb-4 overflow-hidden">
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full min-w-[400px]">
                  <thead>
                    <tr className="border-b border-[#0F1A26]/10">
                      <th className="text-left py-3 md:py-4 font-bold text-[#0F1A26] w-[40%]">{t('rates.region')}</th>
                      <th className="text-left py-3 md:py-4 font-bold text-[#0F1A26] w-[30%]">{t('rates.standard')}</th>
                      <th className="text-left py-3 md:py-4 font-bold text-[#0F1A26] w-[30%]">{t('rates.deliveryTime')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#0F1A26]/70 text-sm md:text-base">
                    {shippingRates.map((rate, index) => (
                      <tr key={index} className="border-b border-[#0F1A26]/5 last:border-0">
                        <td className="py-3 md:py-4 font-medium pr-4">{rate.region}</td>
                        <td className="py-3 md:py-4 pr-4">{rate.standard}</td>
                        <td className="py-3 md:py-4">{rate.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Free Shipping Hint */}
            <div className="bg-[#EEBC3F]/10 rounded-2xl p-4 mb-8 border border-[#EEBC3F]/20">
              <p className="text-[#0F1A26]/80 text-sm text-center font-medium">
                {t('rates.freeShippingHint')}
              </p>
            </div>

            {/* Info Cards */}
            <div className="grid md:grid-cols-3 gap-4 md:gap-6">
              {infoCards.map((card, index) => (
                <div 
                  key={index}
                  className={`bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${(index + 1) * 100}ms` }}
                >
                  <card.icon className="w-8 h-8 md:w-10 md:h-10 text-[#EEBC3F] mb-3 md:mb-4" strokeWidth={1.5} />
                  <h3 className="font-bold text-[#0F1A26] mb-2">{card.title}</h3>
                  <p className="text-[#0F1A26]/60 text-sm leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Returns Section */}
          <section className={`transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#EEBC3F]/10 flex items-center justify-center">
                <RotateCcw className="w-6 h-6 md:w-7 md:h-7 text-[#EEBC3F]" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#0F1A26]">{t('returns.title')}</h2>
                <p className="text-[#0F1A26]/60 text-sm md:text-base">{t('returns.subtitle')}</p>
              </div>
            </div>

            {/* Return Policy */}
            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5 mb-4 md:mb-6">
              <h3 className="font-bold text-[#0F1A26] mb-4 md:mb-6 text-lg md:text-xl">{t('returns.policyTitle')}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {returnPolicy.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#EEBC3F]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#EEBC3F] text-xs font-bold">✓</span>
                    </div>
                    <span className="text-[#0F1A26]/70">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* How to Return */}
            <div className="bg-gradient-to-br from-[#0F1A26] to-[#1a2a3a] rounded-2xl md:rounded-3xl p-6 md:p-8 mb-4 md:mb-6">
              <h3 className="font-bold text-white mb-4 md:mb-6 text-lg md:text-xl">{t('returns.howToReturn')}</h3>
              <div className="space-y-4">
                {returnSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#EEBC3F]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#EEBC3F] font-bold">{index + 1}</span>
                    </div>
                    <p className="text-white/70 pt-2">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Non-Returnable */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl md:rounded-3xl p-6 md:p-8 border border-red-100">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-500" strokeWidth={1.5} />
                <h3 className="font-bold text-[#0F1A26] text-base md:text-lg">{t('returns.nonReturnable')}</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {nonReturnable.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <span className="text-[#0F1A26]/60 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Contact CTA */}
          <section className={`mt-12 md:mt-16 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-gradient-to-br from-[#EEBC3F]/20 via-[#F8F6F3] to-white rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 border border-[#EEBC3F]/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#EEBC3F] flex items-center justify-center">
                  <Mail className="w-6 h-6 text-[#0F1A26]" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-bold text-[#0F1A26]">{t('contact.title')}</h2>
              </div>
              <p className="text-[#0F1A26]/70 mb-6">
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
                <a 
                  href="https://wa.me/201070004227" 
                  className="inline-flex items-center gap-3 px-6 py-4 bg-white rounded-2xl border border-[#0F1A26]/10 hover:border-[#EEBC3F] transition-colors"
                >
                  <svg className="w-5 h-5 text-[#EEBC3F]" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.2.98.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  <span className="font-medium text-[#0F1A26]" dir="ltr">WhatsApp: +20 10 70004227</span>
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
