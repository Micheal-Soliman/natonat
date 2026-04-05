"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useWishlist } from "@/app/lib/wishlist-context";
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Heart, ArrowRight, Package, ShoppingBag } from "lucide-react";

export default function WishlistPage() {
  const t = useTranslations('wishlist');
  const { items, removeFromWishlist, clearWishlist } = useWishlist();

  if (items.length === 0) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-[#F1EBE3] pt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-8 rounded-full bg-white flex items-center justify-center shadow-lg">
              <Heart className="w-10 h-10 sm:w-14 sm:h-14 text-[#0F1A26]/20" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0F1A26] mb-4 tracking-tight">
              {t('empty.title')}
            </h1>
            <p className="text-[#0F1A26]/60 text-base sm:text-lg mb-8 max-w-md mx-auto">
              {t('empty.subtitle')}
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-[#0F1A26] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg transition-all duration-300 hover:bg-[#EEBC3F] hover:text-[#0F1A26] hover:shadow-xl"
            >
              <ShoppingBag className="w-5 h-5" />
              {t('continueShopping')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F1EBE3] pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-12">
            <div>
              <span className="text-[#EEBC3F] text-xs sm:text-sm font-bold tracking-[0.2em] uppercase">
                {t('label')}
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0F1A26] mt-1 sm:mt-2 tracking-tight">
                {t('titleCount', { count: items.length })}
              </h1>
            </div>
            <button
              onClick={clearWishlist}
              className="border border-[#0F1A26]/20 text-[#0F1A26]/60 hover:text-red-500 hover:border-red-200 hover:bg-red-50 rounded-full px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium transition-all duration-300 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-5 sm:h-5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              {t('clearAll')}
            </button>
          </div>

          {/* Wishlist Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-[#0F1A26]/5 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                {/* Product Image */}
                <Link href={`/product/${item.slug}`} className="relative aspect-[4/5] block overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Sale Badge */}
                  {item.originalPrice > item.price && (
                    <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-[#EEBC3F] text-[#0F1A26] text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                      Save {Math.round((1 - item.price / item.originalPrice) * 100)}%
                    </div>
                  )}
                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeFromWishlist(item.id);
                    }}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-50 hover:text-red-500 z-10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-5 sm:h-5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </Link>

                {/* Product Info - Clickable to go to product */}
                <Link href={`/product/${item.slug}`} className="block p-4 sm:p-6 group/link">
                  <span className="text-[#EEBC3F] text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase">
                    {item.type}
                  </span>
                  <h3 className="font-bold text-[#0F1A26] text-base sm:text-lg mt-1 mb-2 line-clamp-1 group-hover/link:text-[#EEBC3F] transition-colors">
                    {item.name}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg sm:text-xl font-bold text-[#0F1A26]">
                      EGP {item.price}
                    </span>
                    <span className="text-sm text-[#0F1A26]/40 line-through">
                      EGP {item.originalPrice}
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 sm:mt-16 text-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-[#0F1A26] hover:text-[#EEBC3F] font-bold text-base sm:text-lg transition-colors"
            >
              <Package className="w-5 h-5" />
              {t('discoverMore')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
