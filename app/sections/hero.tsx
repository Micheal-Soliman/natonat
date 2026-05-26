"use client";

import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';

// Local Arthaus-Bold font
const arthausFontStyle = `
  @font-face {
    font-family: 'Arthaus-Bold';
    src: url('/Arthaus-Bold.ttf') format('truetype');
    font-weight: bold;
    font-style: normal;
    font-display: swap;
  }

  /* Marquee animation */
  @keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  
  .animate-marquee {
    animation: marquee 20s linear infinite;
  }
`;

export function Hero() {
  const t = useTranslations('hero');
  const loaded = true;
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-[#0a0f14]">
      {/* Video Background */}
      <style dangerouslySetInnerHTML={{ __html: arthausFontStyle }} />
      <div className="absolute inset-0">
        <video
          preload="metadata"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50" />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f14] via-transparent to-transparent" />
      </div>

      {/* Main content - minimal */}
      <div className="relative z-10 text-center px-4">
        {/* Small label */}
        <p className={`text-[#EEBC3F] text-[10px] sm:text-xs tracking-[0.3em] uppercase mb-4 sm:mb-8 transition-all duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
          {t('label')}
        </p>

        {/* Big bold headline with local Arthaus-Bold font */}
        <h1 
          className={`text-4xl sm:text-6xl md:text-8xl lg:text-[10rem] font-bold leading-none tracking-[0.15em] mb-6 transition-all duration-1000 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} 
          style={{ fontFamily: "'Arthaus-Bold', sans-serif" }}
        >
          <span className="block text-white">nat<span className="text-[#EEBC3F]">O</span>nat</span>
        </h1>

        {/* Tagline */}
        <p className={`text-base sm:text-lg md:text-xl text-white/40 font-light tracking-wide mb-8 sm:mb-12 transition-all duration-1000 delay-400 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
          {t('tagline')}
        </p>

        {/* Single CTA */}
        <div className={`transition-all duration-1000 delay-600 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
          <Button
            asChild
            size="lg"
            className="bg-[#EEBC3F] text-[#0a0f14] hover:bg-white rounded-full text-xs sm:text-sm font-bold px-6 sm:px-12 h-10 sm:h-14 transition-all duration-500 hover:scale-105"
          >
            <Link href="/shop">
              {t('cta')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Free Shipping Marquee Banner */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#EEBC3F] py-3 overflow-hidden z-20">
        <div className="animate-marquee flex whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center">
              <span className="text-[#0F1A26] font-semibold text-sm tracking-wide uppercase px-8">
                {t('freeShipping')} - {t('egyptOnly')}
              </span>
              <span className="text-[#0F1A26]/30">|</span>
              <span className="text-[#0F1A26] font-semibold text-sm tracking-wide uppercase px-8">
                {t('symplCashback')}
              </span>
              <span className="text-[#0F1A26]/30">|</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
