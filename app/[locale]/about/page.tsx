"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Award, Globe, Users, Target, TrendingUp, Check } from "lucide-react";
import { Loading } from "@/app/components/loading";

const milestones = [
  { year: "2019", key: "2019" },
  { year: "2022", key: "2022" },
  { year: "2023", key: "2023" },
  { year: "2025", key: "2025" },
];

const values = [
  { icon: Award, key: "quality" },
  { icon: Target, key: "design" },
  { icon: Globe, key: "luxury" },
  { icon: Users, key: "customer" },
];

export default function AboutPage() {
  return (
    <Suspense fallback={null}>
      <AboutContent />
    </Suspense>
  );
}

function AboutContent() {
  const t = useTranslations('about');
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

    if (ref.current) observer.observe(ref.current);

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
              {t('hero.title').split(' ')[0]} <span className="text-[#EEBC3F]">{t('hero.title').split(' ').slice(1).join(' ')}</span>
            </h1>
            <p className="text-lg md:text-xl md:text-2xl text-white/50 max-w-3xl mx-auto font-light leading-relaxed">
              {t('hero.subtitle')}
            </p>
          </div>
        </div>

        {/* Stats Bar */}
        {/* <div ref={statsRef} className="bg-white border-b border-[#0F1A26]/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className={`text-center transition-opacity transition-transform duration-700 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#EEBC3F]/10 flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="w-6 h-6 text-[#EEBC3F]" strokeWidth={1.5} />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-[#0F1A26] mb-1">{stat.value}</div>
                  <div className="text-[#0F1A26]/50 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div> */}

        {/* Brand Story - Two Column */}
        <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
              <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase">{t('journey.label')}</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0F1A26] mt-4 mb-8 tracking-tight">
                {t('journey.title')}
              </h2>
              <div className="space-y-5 text-[#0F1A26]/70 leading-relaxed text-lg">
                <p>{t('journey.paragraph1')}</p>
                <p>{t('journey.paragraph2')}</p>
                <p>{t('journey.paragraph3')}</p>
                <p>{t('journey.paragraph4')}</p>
              </div>
            </div>
            <div className={`relative transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
              <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-br from-[#EEBC3F]/20 via-[#0F1A26] to-[#0F1A26] p-8 flex flex-col items-center justify-center border border-[#EEBC3F]/20">
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full bg-[#EEBC3F]/20 flex items-center justify-center mx-auto mb-6">
                    <span className="text-6xl font-bold text-[#EEBC3F]">nat</span>
                  </div>
                  <p className="text-white/60 text-lg mb-2">Since 2019</p>
                  <p className="text-white text-2xl font-bold">natOnat</p>
                  <p className="text-[#EEBC3F] text-sm mt-2">Premium Travel Gear</p>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#EEBC3F]/10 rounded-2xl -z-10" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#0F1A26]/5 rounded-2xl -z-10" />
            </div>
          </div>
        </div>

        {/* Values - Grid */}
        <div className="bg-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16">
              <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase">{t('values.title')}</span>
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-[#0F1A26] mt-4 tracking-tight">{t('values.title')}</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {values.map((value, index) => (
                <div
                  key={index}
                  className={`group bg-[#F8F6F3] rounded-2xl md:rounded-3xl p-6 md:p-8 transition-opacity transition-transform duration-700 hover:bg-[#0F1A26] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${300 + index * 100}ms` }}
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-[#EEBC3F]/10 flex items-center justify-center mb-4 md:mb-6 group-hover:bg-[#EEBC3F] transition-colors duration-300">
                    <value.icon className="w-6 h-6 md:w-8 md:h-8 text-[#EEBC3F] group-hover:text-[#0F1A26] transition-colors" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-[#0F1A26] mb-2 md:mb-3 tracking-tight group-hover:text-white transition-colors">{t(`values.${value.key}.title`)}</h3>
                  <p className="text-sm md:text-base text-[#0F1A26]/60 group-hover:text-white/70 transition-colors leading-relaxed">{t(`values.${value.key}.description`)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center mb-12 md:mb-16">
            <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase">{t('milestones.label')}</span>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-[#0F1A26] mt-4 tracking-tight">{t('milestones.title')}</h2>
          </div>
          <div className="relative">
            {/* Center line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-[#0F1A26]/10 -translate-x-1/2 hidden md:block" />

            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={`flex flex-col md:flex-row gap-8 items-start transition-opacity transition-transform duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${500 + index * 100}ms` }}
                >
                  {/* Year - Left on desktop */}
                  <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:text-right' : 'md:order-2'}`}>
                    <div className="flex items-center gap-4 md:justify-end">
                      <span className="text-4xl font-bold text-[#EEBC3F] tracking-tight">{milestone.year}</span>
                      <div className="w-4 h-4 rounded-full bg-[#EEBC3F] flex-shrink-0 hidden md:block" />
                    </div>
                  </div>

                  {/* Content - Right on desktop */}
                  <div className={`md:w-1/2 ${index % 2 === 0 ? '' : 'md:order-1 md:text-right'}`}>
                    <div className="bg-white rounded-2xl p-6 shadow-lg shadow-[#0F1A26]/5 border border-[#0F1A26]/5 hover:shadow-xl transition-shadow">
                      <h3 className="text-xl font-bold text-[#0F1A26] mb-2 tracking-tight">{t(`milestones.${milestone.key}.title`)}</h3>
                      <p className="text-[#0F1A26]/60 leading-relaxed">{t(`milestones.${milestone.key}.description`)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mission */}
        <div className="bg-[#0F1A26] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase mb-4 md:mb-6 block">{t('mission.label')}</span>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-6 md:mb-8 tracking-tight">{t('mission.title')}</h2>
            <p className="text-lg md:text-2xl md:text-3xl text-white/50 mb-8 md:mb-12 font-light leading-relaxed max-w-4xl mx-auto">
              {t('mission.quote')}
            </p>
            <div className="flex flex-wrap justify-center gap-2 md:gap-4">
              {['quality', 'design', 'pricing', 'customer'].map((key, index) => (
                <span key={index} className="flex items-center gap-2 text-white/60 bg-white/5 backdrop-blur-sm rounded-full px-4 md:px-6 py-2 md:py-3 border border-white/10 text-sm md:text-base">
                  <Check className="w-3 h-3 md:w-4 md:h-4 text-[#EEBC3F]" />
                  {t(`mission.points.${key}`)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="bg-gradient-to-br from-white to-[#F8F6F3] rounded-2xl md:rounded-3xl p-6 md:p-10 lg:p-14 shadow-xl shadow-[#0F1A26]/5 border border-[#0F1A26]/5">
            <div className="flex items-center gap-3 md:gap-4 mb-6">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-[#EEBC3F]/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 md:w-7 md:h-7 text-[#EEBC3F]" strokeWidth={1.5} />
              </div>
              <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase">{t('future.label')}</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-[#0F1A26] mb-4 tracking-tight">{t('future.title')}</h2>
            <p className="text-[#0F1A26]/60 mb-6 md:mb-8 leading-relaxed text-base md:text-lg">
              {t('future.description')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-10">
              {['garmentBags', 'techOrganizers', 'packingCubes', 'expansion'].map((key, index) => (
                <div key={index} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white rounded-xl border border-[#0F1A26]/5">
                  <div className="w-2 h-2 rounded-full bg-[#EEBC3F] flex-shrink-0" />
                  <span className="text-[#0F1A26]/70 text-sm md:text-base">{t(`future.items.${key}`)}</span>
                </div>
              ))}
            </div>
            <Button asChild className="bg-[#0F1A26] text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26] rounded-full px-6 md:px-8 h-12 md:h-14 font-semibold text-base md:text-lg transition-all duration-300">
              <Link href="/contact" className="inline-flex items-center gap-2">
                {t('future.cta')}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
