"use client";

import { Suspense, useState, useEffect } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, Package, Truck, Shield, X } from "lucide-react";
import { useCart } from "@/app/lib/cart-context";
import { Loading } from "@/app/components/loading";

interface GroupedItem {
  id: number;
  slug: string;
  name: string;
  type: string;
  price: number;
  originalPrice?: number;
  image: string;
  variants: {
    size?: string;
    color?: string;
    quantity: number;
  }[];
}

function groupCartItems(items: ReturnType<typeof useCart>['items']): GroupedItem[] {
  const grouped = new Map<number, GroupedItem>();
  
  items.forEach((item) => {
    if (!grouped.has(item.id)) {
      grouped.set(item.id, {
        id: item.id,
        slug: item.slug,
        name: item.name,
        type: item.type,
        price: item.price,
        originalPrice: item.originalPrice,
        image: item.image,
        variants: [],
      });
    }
    
    const group = grouped.get(item.id)!;
    group.variants.push({
      size: item.size,
      color: item.color,
      quantity: item.quantity,
    });
  });
  
  return Array.from(grouped.values());
}

function getTotalQuantity(variants: GroupedItem['variants']) {
  return variants.reduce((sum, v) => sum + v.quantity, 0);
}

function getTotalPrice(price: number, variants: GroupedItem['variants']) {
  return price * getTotalQuantity(variants);
}

export default function CartPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CartContent />
    </Suspense>
  );
}

function CartContent() {
  const t = useTranslations('cart');
  const { items, removeFromCart, updateQuantity, subtotal, setBuyNowItem } = useCart();
  const groupedItems = groupCartItems(items);
  const shipping = subtotal > 1000 ? 0 : 75;
  const total = subtotal + shipping;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Clear buyNowItem when viewing cart - user is using cart checkout flow
    setBuyNowItem(null);
  }, [setBuyNowItem]);

  // Prevent hydration mismatch - render loading state until mounted
  if (!mounted) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-[#F1EBE3]">
          <div className="bg-[#0F1A26] pt-32 pb-16 md:pt-40 md:pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight">
                {t('header.title').split(' ')[0]} <span className="text-[#EEBC3F]">{t('header.title').split(' ').slice(1).join(' ')}</span>
              </h1>
              <p className="text-white/50 mt-4 max-w-xl mx-auto font-light text-lg">
                {t('header.subtitle')}
              </p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="animate-pulse">
              <div className="h-96 bg-[#0F1A26]/5 rounded-2xl"></div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F1EBE3]">
        {/* Header - Clean */}
        <div className="bg-[#0F1A26] pt-28 pb-16 md:pt-40 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight">
              {t('header.title').split(' ')[0]} <span className="text-[#EEBC3F]">{t('header.title').split(' ').slice(1).join(' ')}</span>
            </h1>
            <p className="text-white/50 mt-4 max-w-xl mx-auto font-light text-base md:text-lg">
              {t('header.subtitle')}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-[#0F1A26]/5 flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-8 h-8 text-[#0F1A26]/30" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F1A26] mb-2">{t('empty.title')}</h2>
              <p className="text-[#0F1A26]/50 mb-6">{t('empty.subtitle')}</p>
              <Link href="/shop">
                <Button className="bg-[#0F1A26] text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26] rounded-full px-8 h-12 font-semibold transition-all duration-300">
                  {t('empty.continueShopping')}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Cart Items */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[#0F1A26]">
                    {t('cartItems', { count: groupedItems.length })}
                  </h2>
                  <Link 
                    href="/shop" 
                    className="text-sm text-[#EEBC3F] hover:text-[#0F1A26] font-medium flex items-center gap-2 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t('continueShopping')}
                  </Link>
                </div>

                <div className="space-y-4">
                  {groupedItems.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-white rounded-2xl p-4 border border-[#0F1A26]/5 flex gap-4"
                    >
                      {/* Image */}
                      <Link href={`/product/${item.slug}`} className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-[#F8F6F3] relative group">
                        <Image 
                          src={item.image} 
                          alt={item.name}
                          fill
                          sizes="96px"
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </Link>

                      {/* Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[#EEBC3F] text-xs font-semibold tracking-wider uppercase">
                                {item.type}
                              </span>
                              <Link href={`/product/${item.slug}`}>
                                <h3 className="text-[#0F1A26] font-medium mt-0.5 hover:text-[#EEBC3F] transition-colors cursor-pointer">{item.name}</h3>
                              </Link>
                            </div>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="w-8 h-8 rounded-full bg-[#0F1A26]/5 flex items-center justify-center text-[#0F1A26]/50 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {/* Sizes List */}
                          {item.variants.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {item.variants.map((variant, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  {variant.size && (
                                    <span className="bg-[#EEBC3F]/10 text-[#0F1A26] px-2 py-0.5 rounded text-xs font-medium">
                                      {t('size')} {variant.size.toUpperCase()}
                                    </span>
                                  )}
                                  {variant.color && (
                                    <span className="text-[#0F1A26]/60">{variant.color}</span>
                                  )}
                                  <span className="text-[#0F1A26]/50">× {variant.quantity}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          {/* Quantity - Total for all variants */}
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                // Decrease first variant as example
                                if (item.variants[0]) {
                                  const originalItem = items.find(i => 
                                    i.id === item.id && 
                                    i.size === item.variants[0].size && 
                                    i.color === item.variants[0].color
                                  );
                                  if (originalItem) {
                                    updateQuantity(originalItem.id, -1);
                                  }
                                }
                              }}
                              className="w-8 h-8 rounded-lg bg-[#0F1A26]/5 flex items-center justify-center text-[#0F1A26] hover:bg-[#0F1A26]/10 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-medium text-[#0F1A26]">
                              {getTotalQuantity(item.variants)}
                            </span>
                            <button 
                              onClick={() => {
                                // Increase first variant as example
                                if (item.variants[0]) {
                                  const originalItem = items.find(i => 
                                    i.id === item.id && 
                                    i.size === item.variants[0].size && 
                                    i.color === item.variants[0].color
                                  );
                                  if (originalItem) {
                                    updateQuantity(originalItem.id, 1);
                                  }
                                }
                              }}
                              className="w-8 h-8 rounded-lg bg-[#0F1A26]/5 flex items-center justify-center text-[#0F1A26] hover:bg-[#0F1A26]/10 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Price */}
                          <span className="font-semibold text-[#0F1A26]">
                            EGP {getTotalPrice(item.price, item.variants)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:w-96 order-first lg:order-last">
                <div className="bg-white rounded-2xl p-6 border border-[#0F1A26]/5 lg:sticky lg:top-28">
                  <h2 className="text-lg font-semibold text-[#0F1A26] mb-6">{t('summary.title')}</h2>
                  
                  <p className="text-xs text-[#EEBC3F] font-medium mb-4 text-center">
                    {t('summary.egyptOnly')}
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#0F1A26]/60">{t('summary.subtotal')}</span>
                      <span className="text-[#0F1A26] font-medium">EGP {subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#0F1A26]/60">{t('summary.shipping')}</span>
                      <span className="text-[#0F1A26] font-medium">
                        {shipping === 0 ? t('summary.free') : `EGP ${shipping}`}
                      </span>
                    </div>
                    <div className="border-t border-[#0F1A26]/10 pt-3">
                      <div className="flex justify-between">
                        <span className="text-[#0F1A26] font-semibold">{t('summary.total')}</span>
                        <span className="text-[#0F1A26] font-bold text-lg">EGP {total}</span>
                      </div>
                    </div>
                  </div>

                  <Link href="/checkout">
                    <Button className="w-full bg-[#EEBC3F] text-[#0F1A26] hover:bg-[#0F1A26] hover:text-white rounded-full h-14 font-bold text-base transition-all duration-300 mb-4">
                      {t('summary.proceedToCheckout')}
                    </Button>
                  </Link>

                  <p className="text-xs text-[#0F1A26]/40 text-center">
                    {t('summary.note')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
