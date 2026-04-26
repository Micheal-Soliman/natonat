"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { ArrowUpRight } from "lucide-react";

export function FeaturedCollections() {
  const t = useTranslations('collections');
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const collections = [
    {
      title: t('luggageCovers.title'),
      description: t('luggageCovers.description'),
      badge: t('luggageCovers.badge'),
      href: "/shop?category=luggage-covers",
      image: "/octopus photo/Anara/1.png",
      bgColor: "from-[#0F1A26] to-[#364353]",
      accent: "#EEBC3F",
    },
    {
      title: t('passportWallets.title'),
      description: t('passportWallets.description'),
      badge: t('passportWallets.badge'),
      href: "/shop?category=passport-wallets",
      image: "/wallet.png",
      bgColor: "from-[#364353] to-[#0F1A26]",
      accent: "#EEBC3F",
    },
    {
      title: t('packOnat.title'),
      description: t('packOnat.description'),
      badge: t('packOnat.badge'),
      href: "/shop?category=packonat",
      image: "/pack.png",
      bgColor: "from-[#0F1A26] to-[#EEBC3F]/30",
      accent: "#EEBC3F",
    },
  ];

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

  return (
    <section ref={ref} className="py-24 bg-[#F1EBE3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.2em] uppercase">{t('sectionLabel')}</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[#0F1A26] mt-4 tracking-tight">
            {t('title')}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {collections.map((collection, index) => (
            <Link
              key={collection.title}
              href={collection.href}
              className={`group relative overflow-hidden rounded-3xl bg-[#0F1A26] transition-all duration-700 hover:shadow-2xl hover:shadow-[#EEBC3F]/10 hover:-translate-y-2 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${(index + 1) * 150}ms` }}
            >
              {/* Image Container - Full Card */}
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={collection.image}
                  alt={collection.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-contain transition-all duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Gradient Overlay - Always visible but intensifies on hover */}
                <div className={`absolute inset-0 bg-gradient-to-t ${collection.bgColor} opacity-60 group-hover:opacity-40 transition-opacity duration-700`} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F1A26] via-[#0F1A26]/50 to-transparent" />
                
                {/* Animated border on hover */}
                <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-[#EEBC3F]/50 transition-colors duration-500" />
                
                {/* Shine effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>

                {/* Content - Positioned at bottom */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                  {/* Badge with animation */}
                  <span
                    className="inline-block self-start text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-4 py-1.5 rounded-full transform translate-y-2 opacity-80 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500"
                    style={{ 
                      color: '#0F1A26',
                      backgroundColor: collection.accent
                    }}
                  >
                    {collection.badge}
                  </span>
                  
                  {/* Title with reveal animation */}
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 transform translate-y-0 group-hover:-translate-y-1 transition-transform duration-500">
                    {collection.title}
                  </h3>
                  
                  {/* Description - slides up on hover */}
                  <p className="text-white/70 text-sm mb-4 line-clamp-2 transform translate-y-2 opacity-80 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-75">
                    {collection.description}
                  </p>
                  
                  {/* Explore button with arrow animation */}
                  <span className="inline-flex items-center gap-2 text-[#EEBC3F] font-semibold text-sm transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 delay-100">
                    <span className="relative">
                      {t('explore')}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#EEBC3F] group-hover:w-full transition-all duration-500" />
                    </span>
                    <ArrowUpRight className="w-5 h-5 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
