"use client";

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { Globe } from 'lucide-react';

export function LocaleSwitcher({ scrolled = false }: { scrolled?: boolean }) {
  const locale = useLocale();
  const t = useTranslations("localeSwitcher");
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === locale) return;
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className={`flex items-center gap-1 rounded-full p-1 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/10 backdrop-blur-sm border border-white/20' 
        : 'bg-[#0F1A26]/5 backdrop-blur-sm border border-[#0F1A26]/10'
    }`}>
      <button
        onClick={() => handleLocaleChange('en')}
        className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-200 ${
          locale === 'en'
            ? scrolled 
              ? 'bg-[#EEBC3F] text-[#0a0f14] shadow-md'
              : 'bg-[#0F1A26] text-white shadow-md'
            : scrolled 
              ? 'text-white/70 hover:text-white hover:bg-white/10' 
              : 'text-[#0F1A26]/70 hover:text-[#0F1A26] hover:bg-[#0F1A26]/10'
        }`}
        aria-label={t("switchToEnglish")}
      >
        EN
      </button>
      
      <button
        onClick={() => handleLocaleChange('ar')}
        className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-200 ${
          locale === 'ar'
            ? scrolled 
              ? 'bg-[#EEBC3F] text-[#0a0f14] shadow-md'
              : 'bg-[#0F1A26] text-white shadow-md'
            : scrolled 
              ? 'text-white/70 hover:text-white hover:bg-white/10' 
              : 'text-[#0F1A26]/70 hover:text-[#0F1A26] hover:bg-[#0F1A26]/10'
        }`}
        aria-label={t("switchToArabic")}
      >
        AR
      </button>
    </div>
  );
}

export function LocaleSwitcherMobile() {
  const locale = useLocale();
  const t = useTranslations("localeSwitcher");
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === locale) return;
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex items-center gap-3 px-4 py-4" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2">
        <Globe className="w-5 h-5 text-[#EEBC3F]" />
        <span className="text-white/80 text-sm font-medium">
          {t("label")}
        </span>
      </div>
      
      <div className="relative flex items-center p-1 rounded-full bg-white/10 backdrop-blur-sm ms-auto">
        {/* Sliding background pill */}
        <div 
          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-[#EEBC3F] transition-all duration-300 ease-out ${
            locale === 'en' ? 'start-1' : 'end-1'
          }`}
        />
        
        <button
          onClick={() => handleLocaleChange('en')}
          className={`relative z-10 px-4 py-2 text-sm font-medium rounded-full transition-colors duration-300 ${
            locale === 'en' ? 'text-[#0a0f14]' : 'text-white/70 hover:text-white'
          }`}
        >
          En
        </button>
        <button
          onClick={() => handleLocaleChange('ar')}
          className={`relative z-10 px-4 py-2 text-sm font-medium rounded-full transition-colors duration-300 ${
            locale === 'ar' ? 'text-[#0a0f14]' : 'text-white/70 hover:text-white'
          }`}
        >
          AR
        </button>
      </div>
    </div>
  );
}
