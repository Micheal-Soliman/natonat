"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from 'next-intl';
import { Shield, Sparkles, Eye, Briefcase } from "lucide-react";

const arthausFontStyle = `
  @font-face {
    font-family: 'Arthaus-Bold';
    src: url('/Arthaus-Bold.ttf') format('truetype');
    font-weight: bold;
    font-style: normal;
    font-display: swap;
  }
`;

export function BenefitsStrip() {
  const t = useTranslations('benefits');
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const benefits = [
    {
      number: t('items.protection.number'),
      icon: Shield,
      title: t('items.protection.title'),
      subtitle: t('items.protection.subtitle'),
      image: "/octopus photo/Black/1.webp",
    },
    {
      number: t('items.durability.number'),
      icon: Sparkles,
      title: t('items.durability.title'),
      subtitle: t('items.durability.subtitle'),
      image: "/octopus photo/Dubai/1.webp",
    },
    {
      number: t('items.recognition.number'),
      icon: Eye,
      title: t('items.recognition.title'),
      subtitle: t('items.recognition.subtitle'),
      image: "/octopus photo/Egypt Skyline/1.webp",
    },
    {
      number: t('items.ecosystem.number'),
      icon: Briefcase,
      title: t('items.ecosystem.title'),
      subtitle: t('items.ecosystem.subtitle'),
      image: "/octopus photo/Egyptian Queen/1.webp",
    },
  ];

  return (
    <section ref={ref} className="py-24 bg-[#F5F0EB] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - Minimal */}
        <div className={`mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[#EEBC3F] text-xs tracking-[0.3em] uppercase font-medium">{t('sectionLabel')}</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-[#0F1A26] mt-4 tracking-tight">
                {t('title')} <span className="font-medium text-[#EEBC3F]" style={{ fontFamily: "'Arthaus-Bold', sans-serif" }}>natOnat</span>
              </h2>
            </div>
            <p className="text-[#0F1A26]/50 text-sm max-w-xs text-right hidden md:block leading-relaxed">
              {t('subtitle')}
            </p>
          </div>
          <div className="h-px bg-gradient-to-r from-[#EEBC3F]/50 via-[#0F1A26]/10 to-transparent mt-8" />
        </div>

        {/* Editorial Grid - Mobile: 1 column */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className={`group relative bg-white rounded-2xl overflow-hidden transition-all duration-700 shadow-lg shadow-[#0F1A26]/5 hover:shadow-xl hover:shadow-[#0F1A26]/10 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {/* Image Layer */}
              <div className="absolute inset-0">
                <Image
                  src={benefit.image}
                  alt={benefit.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="w-full h-full object-cover opacity-90 transition-all duration-700 group-hover:opacity-100 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>

              {/* Content */}
              <div className="relative h-[400px] lg:h-[500px] p-8 flex flex-col justify-between">
                {/* Top - Number */}
                <div className="flex items-start justify-between">
                  <span className="text-[#EEBC3F]/30 text-7xl font-light tracking-tighter">
                    {benefit.number}
                  </span>
                  <benefit.icon className="w-5 h-5 text-white/20" strokeWidth={1} />
                </div>

                {/* Bottom - Text */}
                <div className="space-y-3">
                  <div className="h-px w-12 bg-[#EEBC3F]/50 transition-all duration-500 group-hover:w-20" />
                  <h3 className="text-white text-2xl lg:text-3xl font-light tracking-tight">
                    {benefit.title}
                  </h3>
                  <p className="text-white/50 text-sm tracking-wide font-light">
                    {benefit.subtitle}
                  </p>
                </div>
              </div>

              {/* Hover Overlay Line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#EEBC3F] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </div>
          ))}
        </div>

        {/* Bottom Tagline */}
        <div className={`mt-16 flex items-center justify-center gap-4 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="h-px w-16 bg-[#0F1A26]/30" />
          <span className="text-[#0F1A26]/70 text-xs tracking-[0.4em] uppercase font-medium">
            {t('footer')}
          </span>
          <div className="h-px w-16 bg-[#0F1A26]/30" />
        </div>
      </div>
    </section>
  );
}
