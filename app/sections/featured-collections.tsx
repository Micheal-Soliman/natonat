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
      image: "/octopus photo/Ascend/1.png",
      bgColor: "from-[#364353] to-[#0F1A26]",
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

        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {collections.map((collection, index) => (
            <Link
              key={collection.title}
              href={collection.href}
              className={`group relative overflow-hidden rounded-3xl aspect-[4/3] transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${(index + 1) * 150}ms` }}
            >
              {/* Background Image */}
              <Image
                src={collection.image}
                alt={collection.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="absolute inset-0 w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />

              {/* Overlay gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${collection.bgColor} opacity-80 transition-all duration-700 group-hover:opacity-0`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-all duration-700 group-hover:opacity-0" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
                <span
                  className="text-xs font-medium tracking-[0.2em] uppercase mb-3 transition-colors duration-300"
                  style={{ color: collection.accent }}
                >
                  {collection.badge}
                </span>
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-white tracking-tight mb-2 md:mb-3">
                  {collection.title}
                </h3>
                <p className="text-white/70 mb-4 md:mb-6 max-w-xs font-light text-sm md:text-base">
                  {collection.description}
                </p>
                <span className="inline-flex items-center gap-2 text-white font-medium group-hover:gap-3 transition-all duration-300 text-sm md:text-base">
                  {t('explore')}
                  <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </span>
              </div>

              {/* Hover border glow */}
              <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-white/20 transition-colors duration-500" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
