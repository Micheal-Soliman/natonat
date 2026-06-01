"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { Ruler, Package, Check, Sparkles, ArrowRight, ChevronDown, ChevronUp, Luggage } from "lucide-react";
import { Loading } from "@/app/components/loading";

const getSteps = () => [
  { icon: Ruler, key: "measure" },
  { icon: Package, key: "choose" },
  { icon: Check, key: "travel" },
];

const getFaqs = () => [
  { questionKey: "sizeCover" },
  { questionKey: "hardShell" },
  { questionKey: "dualZippers" },
  { questionKey: "washCover" },
];

export default function HowItWorksPage() {
  return (
    <Suspense fallback={<Loading />}>
      <HowItWorksContent />
    </Suspense>
  );
}

function HowItWorksContent() {
  const t = useTranslations('howItWorks');
  const tp = useTranslations('products');
  const [isVisible, setIsVisible] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const steps = getSteps();
  const faqs = getFaqs();

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
        {/* Hero - Premium with padding for navbar */}
        <div className="bg-[#0F1A26] pt-28 pb-16 md:pt-40 md:pb-28">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase mb-4 block">
              {t('hero.label')}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 md:mb-6 tracking-tight">
              {t('hero.title')}
            </h1>
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              {t('hero.subtitle')}
            </p>
          </div>
        </div>

        {/* Steps Section */}
        <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 md:-mt-10 relative z-10">
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`group bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-lg shadow-[#0F1A26]/5 border border-[#0F1A26]/5 transition-all duration-700 hover:shadow-xl hover:shadow-[#0F1A26]/10 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="flex items-start justify-between mb-4 md:mb-6">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#0F1A26] flex items-center justify-center group-hover:bg-[#EEBC3F] transition-colors duration-300">
                    <step.icon className="w-6 h-6 md:w-7 md:h-7 text-[#EEBC3F] group-hover:text-[#0F1A26] transition-colors" />
                  </div>
                  <span className="text-4xl md:text-5xl font-bold text-[#0F1A26]/5">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-[#0F1A26] mb-2 md:mb-3">{t(`steps.${step.key}.title`)}</h3>
                <p className="text-[#0F1A26]/60 mb-3 md:mb-4 leading-relaxed text-sm md:text-base">{t(`steps.${step.key}.description`)}</p>
                <div className="flex items-center gap-2 text-[#EEBC3F] text-xs md:text-sm font-medium">
                  <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
                  {t(`steps.${step.key}.tip`)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Size Guide + Calculator Section */}


        {/* Video/Image Measurement Guide - Enhanced */}
        <div className="bg-white mt-10 py-12 md:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-12">
              <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase">
                {t('video.label')}
              </span>

              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#0F1A26] mt-2 md:mt-3">
                {t('video.title')}
              </h2>

              <p className="text-[#0F1A26]/50 mt-2 md:mt-3 max-w-xl mx-auto text-sm md:text-base">
                {t('video.subtitle')}
              </p>
            </div>

            <div className="bg-[#0F1A26] rounded-3xl overflow-hidden">
              {/* Video */}
              <div className="aspect-video relative bg-black">
                <video
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                  preload="none"
                  poster="/videos/measurement-poster.jpg"
                >
                  <source src="/size.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                {/* Measurement Tips Overlay */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 md:p-8">
                  <div className="flex flex-wrap gap-3 md:gap-4 justify-center">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 md:px-4 py-2">
                      <Ruler className="w-4 h-4 text-[#EEBC3F]" />
                      <span className="text-white text-xs md:text-sm">
                        {t('video.tip1')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 md:px-4 py-2">
                      <Luggage className="w-4 h-4 text-[#EEBC3F]" />
                      <span className="text-white text-xs md:text-sm">
                        {t('video.tip2')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CM to Inches Conversion Table */}
              <div className="p-8 border-t border-white/10">
                <h3 className="text-xl font-bold text-white mb-2 text-center">
                  {t('conversionChart.title')}
                </h3>

                <p className="text-white/50 text-xs text-center mb-6">
                  {t('sizeGuide.note')}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { size: "S", inches: "18-21\"", cm: "45-53 cm", type: t('sizes.s.type') },
                    { size: "M", inches: "22-25\"", cm: "55-63 cm", type: t('sizes.m.type') },
                    { size: "L", inches: "26-28\"", cm: "65-70 cm", type: t('sizes.l.type') },
                    { size: "XL", inches: "29-32\"", cm: "72-81 cm", type: t('sizes.xl.type') },
                  ].map((item) => (
                    <div
                      key={item.size}
                      className="bg-white/5 rounded-xl p-4 text-center border border-white/10 hover:border-[#EEBC3F]/30 transition-all duration-300"
                    >
                      <span className="text-2xl font-bold text-[#EEBC3F]">
                        {item.size}
                      </span>

                      <p className="text-white font-semibold mt-1">
                        {item.inches}
                      </p>

                      <p className="text-[#EEBC3F] text-sm">
                        {item.cm}
                      </p>

                      <p className="text-white/40 text-xs mt-1">
                        {item.type}
                      </p>

                      <p className="text-white/30 text-[14px] mt-2">
                        ({t('sizeGuide.heightOnly')})
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose - Using Product Features */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="text-center mb-8 md:mb-12">
            <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase">{t('benefits.label')}</span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#0F1A26] mt-2 md:mt-3">{tp('vibra.whyChoose.title')}</h2>
            <p className="text-[#0F1A26]/70 mt-4 max-w-2xl mx-auto">{tp('vibra.whyChoose.intro')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {[0, 1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="text-center group bg-white p-5 rounded-xl border border-[#0F1A26]/5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-[#EEBC3F]/10 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-[#EEBC3F]" />
                </div>
                <h3 className="text-base font-bold text-[#0F1A26] mb-2">{tp(`vibra.whyChoose.features.${index}.title`)}</h3>
                <p className="text-[#0F1A26]/60 leading-relaxed text-sm">{tp(`vibra.whyChoose.features.${index}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-white py-12 md:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-12">
              <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase">{t('faq.label')}</span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#0F1A26] mt-2 md:mt-3">{t('faq.title')}</h2>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-[#0F1A26]/10 rounded-xl md:rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 md:p-6 text-left hover:bg-[#F8F6F3] transition-colors"
                  >
                    <h3 className="font-semibold text-[#0F1A26] text-sm md:text-base pr-4">{t(`faq.questions.${faq.questionKey}.question`)}</h3>
                    {openFaq === index ? (
                      <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-[#EEBC3F] flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-[#0F1A26]/40 flex-shrink-0" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-4 md:px-6 pb-4 md:pb-6 animate-in slide-in-from-top-2 duration-200">
                      <p className="text-[#0F1A26]/60 text-sm md:text-base">{t(`faq.questions.${faq.questionKey}.answer`)}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/faqs"
                className="inline-flex items-center gap-2 text-[#EEBC3F] hover:text-[#0F1A26] font-medium transition-colors group"
              >
                {t('faq.viewAll')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#0F1A26] py-12 md:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 md:mb-4">{t('cta.title')}</h2>
            <p className="text-white/50 mb-6 md:mb-8 max-w-lg mx-auto text-sm md:text-base">{t('cta.subtitle')}</p>
            <Button
              asChild
              className="bg-[#EEBC3F] text-[#0F1A26] hover:bg-white rounded-full px-6 md:px-8 py-4 md:py-6 text-base md:text-lg font-bold"
            >
              <Link href="/shop/luggage-covers" className="inline-flex items-center gap-2">
                {t('cta.button')}
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
