import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import { HeroVideo } from "./hero-video";

export default async function Hero() {
  const t = await getTranslations('hero');

  const renderMarqueeItem = (index: number, keyPrefix: string) => (
    <div key={`${keyPrefix}-${index}`} className="inline-flex items-center flex-none">
      <span className="text-[#0F1A26] font-semibold text-sm tracking-wide uppercase px-8">
        {t('freeShipping')} - {t('egyptOnly')}
      </span>
      <span className="text-[#0F1A26]/30">|</span>
      <span className="text-[#0F1A26] font-semibold text-sm tracking-wide uppercase px-8">
        {t('symplCashback')}
      </span>
      <span className="text-[#0F1A26]/30">|</span>
    </div>
  );

  const marqueeItems = Array.from({ length: 16 }, (_, i) => renderMarqueeItem(i, 'marquee-item'));
  const marqueeItemsCopy = Array.from({ length: 16 }, (_, i) => renderMarqueeItem(i, 'marquee-copy'));

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-[#0a0f14]">
      {/* Video Background */}
      <div className="absolute inset-0">
        <HeroVideo />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50" />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f14] via-transparent to-transparent" />
      </div>

      {/* Main content - minimal */}
      <div className="relative z-10 text-center px-4">
        {/* Small label */}
        <p className="text-[#EEBC3F] text-[10px] sm:text-xs tracking-[0.3em] uppercase mb-4 sm:mb-8">
          {t('label')}
        </p>

        {/* Big bold headline with local Arthaus-Bold font */}
        <h1
          className="text-4xl sm:text-6xl md:text-8xl lg:text-[10rem] font-bold leading-none tracking-[0.15em] mb-6"
          style={{ fontFamily: "var(--font-arthaus), sans-serif" }}
        >
          <span className="block text-white">nat<span className="text-[#EEBC3F]">O</span>nat</span>
        </h1>

        {/* Tagline */}
        <p className="text-base sm:text-lg md:text-xl text-white/40 font-light tracking-wide mb-8 sm:mb-12">
          {t('tagline')}
        </p>

        {/* Single CTA */}
        <div className="transition-all duration-1000 delay-600 opacity-100">
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
        <div className="animate-marquee whitespace-nowrap flex">
          {marqueeItems}
          {marqueeItemsCopy}
        </div>
      </div>
    </section>
  );
}
