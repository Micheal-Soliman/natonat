"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import { ChevronDown, ArrowRight, ArrowUpRight } from "lucide-react";

interface ShopMegaMenuProps {
  scrolled: boolean;
}

export function ShopMegaMenu({ scrolled }: ShopMegaMenuProps) {
  const t = useTranslations('navigation');
  const tc = useTranslations('collections');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "all";

  const shopCategories = [
    {
      id: "luggage-covers",
      name: t('luggageCovers'),
      description: t('luggageCoversDesc'),
      href: "/shop?category=luggage-covers",
      image: "/octopus photo/Anara/1.png",
    },
    {
      id: "passport-wallets",
      name: t('passportWallets'),
      description: t('passportWalletsDesc'),
      href: "/shop?category=passport-wallets",
      image: "/passport wallet/Cognac brown/1.png",
    },
    {
      id: "backpacks",
      name: t('packOnat'),
      description: t('packOnatDesc'),
      href: "/shop?category=packonat",
      image: "/packOnat/Black/1.png",
    },
    {
      id: "bundles",
      name: t('travelSets'),
      description: t('travelSetsDesc'),
      href: "/shop?category=bundles",
      image: "/bundles/All%20Set%20Bundel/1%20o.png",
    },
  ];

  const isActive = (href: string) => {
    if (href === "/shop") {
      return pathname === "/shop" && !searchParams.get("category");
    }
    const category = href.split("?category=")[1];
    return currentCategory === category;
  };

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Shop Button */}
      <button
        className={`relative px-5 py-2 text-sm font-medium transition-all duration-300 rounded-full flex items-center gap-1.5 cursor-pointer ${isActive("/shop")
            ? scrolled
              ? "text-white"
              : "text-[#0F1A26]"
            : scrolled
              ? "text-white/60 hover:text-white"
              : "text-[#0F1A26]/60 hover:text-[#0F1A26]"
          }`}
      >
        {t('shop')}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
        {isActive("/shop") && (
          <span className={`absolute inset-0 rounded-full -z-10 transition-all duration-300 ${scrolled ? "bg-white/10" : "bg-[#0F1A26]/10"
            }`} />
        )}
      </button>

      {/* Mega Menu Dropdown - Wide Horizontal Layout */}
      <div
        className={`fixed top-[80px] left-1/2 -translate-x-1/2 w-[95vw] max-w-[1000px] transition-all duration-300 z-[50] ${isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
      >
        <div className={`${scrolled ? 'bg-[#0a0f14] border-white/10' : 'bg-white border-[#0F1A26]/5'} rounded-3xl shadow-2xl shadow-[#0F1A26]/15 border overflow-hidden`}>
          {/* Header */}
          <div className={`px-6 py-4 border-b ${scrolled ? 'border-white/10 bg-[#0a0f14]' : 'border-[#0F1A26]/5 bg-gradient-to-r from-[#F8F6F3] to-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#EEBC3F] text-[10px] font-semibold tracking-[0.3em] uppercase">
                  {tc('sectionLabel')}
                </p>
                <h3 className={`text-lg font-medium mt-0.5 ${scrolled ? 'text-white' : 'text-[#0F1A26]'}`}>{tc('title')}</h3>
              </div>
              <span className={`text-sm font-medium ${scrolled ? 'text-white/30' : 'text-[#0F1A26]/30'}`}>{t('categoriesCount', { count: shopCategories.length })}</span>
            </div>
          </div>

          {/* Categories - Horizontal Row */}
          <div className={`p-4 ${scrolled ? 'bg-[#0F1A26]/50' : 'bg-[#FAFAF8]'}`}>
            <div className="grid grid-cols-4 gap-3">
              {shopCategories.map((category, index) => (
                <Link
                  key={category.id}
                  href={category.href}
                  className={`group relative flex flex-col overflow-hidden rounded-xl transition-all duration-500 ${isActive(category.href) && category.id !== "all"
                      ? "ring-2 ring-[#EEBC3F]"
                      : "hover:shadow-lg hover:shadow-[#0F1A26]/5"
                    }`}
                  style={{
                    transitionDelay: isOpen ? `${index * 75}ms` : "0ms"
                  }}
                >
                  {/* Image Container */}
                  <div className="relative h-50 overflow-hidden">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      sizes="(max-width: 1024px) 25vw, 220px"
                      className="absolute inset-0 w-full h-full object-contain transition-all duration-700 group-hover:scale-110"
                      loading="lazy"
                      quality={45}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F1A26]/60 via-[#0F1A26]/20 to-transparent" />

                    {/* Active Badge */}
                    {isActive(category.href) && category.id !== "all" && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#EEBC3F] flex items-center justify-center">
                        <svg className="w-3 h-3 text-[#0F1A26]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}

                    {/* Hover Arrow */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
                        <ArrowUpRight className="w-4 h-4 text-[#0F1A26]" />
                      </div>
                    </div>
                  </div>

                  {/* Text Content - Compact */}
                  <div className={`p-3 border border-t-0 rounded-b-xl ${scrolled ? 'bg-[#0F1A26] border-white/10' : 'bg-white border-[#0F1A26]/5'}`}>
                    <h4 className={`font-semibold text-sm transition-colors duration-300 ${isActive(category.href) && category.id !== "all"
                        ? "text-[#EEBC3F]"
                        : scrolled ? 'text-white group-hover:text-[#EEBC3F]' : 'text-[#0F1A26] group-hover:text-[#EEBC3F]'
                      }`}>
                      {category.name}
                    </h4>
                    <p className={`text-xs mt-0.5 truncate ${scrolled ? 'text-white/50' : 'text-[#0F1A26]/50'}`}>
                      {category.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom CTA Bar - Compact */}
          <div className={`px-4 py-3 border-t ${scrolled ? 'bg-[#0a0f14] border-white/10' : 'bg-white border-[#0F1A26]/5'}`}>
            <Link
              href="/shop"
              className="flex items-center justify-between group px-3 py-2 rounded-lg hover:bg-[#F8F6F3] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EEBC3F]/10 flex items-center justify-center group-hover:bg-[#EEBC3F] transition-all duration-300">
                  <ArrowRight className="w-4 h-4 text-[#EEBC3F] group-hover:text-white transition-colors" />
                </div>
                <div>
                  <span className={`font-semibold text-sm ${scrolled ? 'text-white' : 'text-[#0F1A26]'}`}>{t('browseAll')}</span>
                </div>
              </div>
              <div className={`flex items-center gap-2 transition-colors ${scrolled ? 'text-white/30 group-hover:text-[#EEBC3F]' : 'text-[#0F1A26]/30 group-hover:text-[#EEBC3F]'}`}>
                <span className="text-xs font-medium">{t('view')}</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
