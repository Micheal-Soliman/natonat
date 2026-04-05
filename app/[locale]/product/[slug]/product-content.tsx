"use client";

import { useCart } from "@/app/lib/cart-context";
import { useWishlist } from "@/app/lib/wishlist-context";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ChevronRight, Shield, Sparkles, Ruler, Heart, Share2, Check, Star, Truck, RotateCcw, ArrowUpRight, Award, ArrowLeft, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";
import { FAQSection } from "@/app/components/faq-section";
import { SwipeableProductImage } from "@/app/components/swipeable-product-image";
import { type Product, products } from "@/lib/products";

interface ProductPageContentProps {
  product: Product;
  prevProduct: Product | null;
  nextProduct: Product | null;
}

export default function ProductPageContent({ product, prevProduct, nextProduct }: ProductPageContentProps) {
  const t = useTranslations('product');
  const { addToCart, setBuyNowItem } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState("m");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const [loadedThumbnails, setLoadedThumbnails] = useState<Set<number>>(new Set());

  const sizes = [
    { id: "s", label: "S", range: "48-53 cm" },
    { id: "m", label: "M", range: "58-63 cm" },
    { id: "l", label: "L", range: "65-70 cm" },
    { id: "xl", label: "XL", range: "72-80 cm" },
  ];

  const productImages = [
    { id: 1, alt: "Front view" },
    { id: 2, alt: "Side view" },
    { id: 3, alt: "On suitcase" },
    { id: 4, alt: "Fabric detail" },
  ];

  const relatedProducts = products
    .filter(p => p.theme === product.theme && p.id !== product.id)
    .slice(0, 3);

  // Lazy load thumbnails when they come into view
  const handleThumbnailInView = useCallback((idx: number) => {
    setLoadedThumbnails(prev => new Set([...prev, idx]));
  }, []);

  useEffect(() => {
    // Preload current image and adjacent ones
    const imagesToPreload = [activeImage, activeImage - 1, activeImage + 1].filter(
      i => i >= 0 && i < (product.images?.length || 1)
    );
    imagesToPreload.forEach(idx => handleThumbnailInView(idx));
  }, [activeImage, product.images, handleThumbnailInView]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Navigation />
      
      {/* Share Toast Notification */}
      {showShareToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#0F1A26] text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <Check className="w-5 h-5 text-[#EEBC3F]" />
          <span className="font-medium">{t('linkCopied')}</span>
        </div>
      )}
      
      <main className="min-h-screen bg-[#F1EBE3] overflow-x-hidden" ref={ref}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          {/* Product Navigation - Top */}
          <div className="flex items-center justify-between mb-8">
            {/* Left side - Previous or Back to Shop */}
            {prevProduct ? (
              <Link 
                href={`/product/${prevProduct.slug}`}
                className="flex items-center gap-3 px-4 py-3 bg-white border border-[#0F1A26]/10 rounded-full text-[#0F1A26] hover:border-[#EEBC3F] hover:bg-[#EEBC3F] hover:text-[#1e3a5f] transition-all duration-300 group shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-[#0F1A26]/5 group-hover:bg-white/20 flex items-center justify-center transition-all">
                  <ChevronLeft className="w-5 h-5" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-xs text-[#0F1A26]/50 group-hover:text-white/70">{t('nav.previous')}</span>
                  <span className="text-sm font-semibold hidden sm:block">{prevProduct.name}</span>
                </div>
              </Link>
            ) : (
              <Link 
                href="/shop" 
                className="flex items-center gap-3 px-4 py-3 bg-white border border-[#0F1A26]/10 rounded-full text-[#0F1A26] hover:border-[#EEBC3F] hover:bg-[#EEBC3F] hover:text-[#1e3a5f] transition-all duration-300 group shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-[#0F1A26]/5 group-hover:bg-white/20 flex items-center justify-center transition-all">
                  <ArrowLeft className="w-5 h-5" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-xs text-[#0F1A26]/50 group-hover:text-white/70">{t('nav.goBack')}</span>
                  <span className="text-sm font-semibold">{t('nav.backToShop')}</span>
                </div>
              </Link>
            )}
            
            {/* Center - Product counter */}
            <div className="hidden md:flex flex-col items-center">
              <span className="text-xs text-[#0F1A26]/40 uppercase tracking-wider">{t('nav.browsing')}</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[#EEBC3F] font-bold">{products.findIndex(p => p.id === product.id) + 1}</span>
                <span className="text-[#0F1A26]/30">/</span>
                <span className="text-[#0F1A26]/50">{products.length}</span>
              </div>
            </div>
            
            {/* Right side - Next or nothing */}
            {nextProduct ? (
              <Link 
                href={`/product/${nextProduct.slug}`}
                className="flex items-center gap-3 px-4 py-3 bg-white border border-[#0F1A26]/10 rounded-full text-[#0F1A26] hover:border-[#EEBC3F] hover:bg-[#EEBC3F] hover:text-[#1e3a5f] transition-all duration-300 group shadow-sm"
              >
                <div className="flex flex-col items-end leading-tight">
                  <span className="text-xs text-[#0F1A26]/50 group-hover:text-white/70">{t('nav.next')}</span>
                  <span className="text-sm font-semibold hidden md:block">{nextProduct.name}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#0F1A26]/5 group-hover:bg-white/20 flex items-center justify-center transition-all">
                  <ChevronRightIcon className="w-5 h-5" />
                </div>
              </Link>
            ) : (
              <div className="hidden sm:block w-[140px]" /> /* Spacer to maintain layout balance - hidden on mobile */
            )}
          </div>

          {/* Section 1 & 2: Gallery + Info Grid */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
            {/* Section 1: Gallery */}
            <div className={`space-y-4 sm:space-y-6 lg:sticky lg:top-28 transition-all duration-700 w-full max-w-full overflow-hidden ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
              {/* Main Image - Premium with Navigation Arrows */}
              <div className="relative aspect-square bg-white/50 backdrop-blur-sm rounded-2xl sm:rounded-3xl flex items-center justify-center overflow-hidden border border-[#0F1A26]/10 shadow-2xl shadow-[#0F1A26]/10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(238,188,63,0.15),transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.05),transparent_50%)]" />
                <div className="absolute inset-0 sm:p-4">
                  <Image 
                    src={product.images?.[activeImage] || product.image} 
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain p-2 sm:p-4"
                    priority
                  />
                </div>

                {/* Premium Tag */}
                <div className="absolute top-3 left-3 sm:top-6 sm:left-6">
                  <div className="bg-[#EEBC3F] rounded-full px-2 py-1 sm:px-4 sm:py-2 border border-[#EEBC3F] shadow-lg">
                    <span className="text-[#0F1A26] text-[10px] sm:text-xs font-bold tracking-wider">{t('badge')}</span>
                  </div>
                </div>

                {/* Previous/Next Arrows */}
                <button
                  onClick={() => setActiveImage((prev) => (prev === 0 ? (product.images?.length || 1) - 1 : prev - 1))}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-12 sm:h-12 bg-white/90 hover:bg-[#EEBC3F] text-[#0F1A26] rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-110 active:scale-95"
                  aria-label={t('aria.previousImage')}
                >
                  <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
                </button>
                <button
                  onClick={() => setActiveImage((prev) => (prev === (product.images?.length || 1) - 1 ? 0 : prev + 1))}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-12 sm:h-12 bg-white/90 hover:bg-[#EEBC3F] text-[#0F1A26] rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-110 active:scale-95"
                  aria-label={t('aria.nextImage')}
                >
                  <ChevronRightIcon className="w-4 h-4 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Thumbnails - Horizontal Scrollable with Index */}
              <div className="space-y-2 sm:space-y-3 w-full max-w-full overflow-hidden">
                {/* Thumbnails Row */}
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-3 px-1 scrollbar-thin scrollbar-thumb-[#EEBC3F]/40 scrollbar-track-transparent hover:scrollbar-thumb-[#EEBC3F] max-w-full">
                  {(product.images || [product.image]).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg sm:rounded-xl bg-white/80 flex items-center justify-center transition-all duration-300 border-2 overflow-hidden ${activeImage === idx
                          ? "border-[#EEBC3F] shadow-lg shadow-[#EEBC3F]/20"
                          : "border-transparent opacity-80 hover:opacity-100"
                        }`}
                    >
                      <Image 
                        src={img} 
                        alt={`${product.name} view ${idx + 1}`}
                        width={96}
                        height={96}
                        className="w-full h-full object-contain p-1"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
                
                {/* Index Indicator with Dots */}
                <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-full">
                  <span className="text-xs sm:text-sm font-bold text-[#EEBC3F] min-w-[16px] sm:min-w-[20px]">
                    {String(activeImage + 1).padStart(2, '0')}
                  </span>
                  
                  {/* Dots */}
                  <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto max-w-[180px] sm:max-w-[280px] px-1">
                    {(product.images || [product.image]).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(idx)}
                        className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${
                          activeImage === idx 
                            ? "w-4 sm:w-6 bg-[#EEBC3F]" 
                            : "w-1.5 sm:w-1.5 bg-[#0F1A26]/20 hover:bg-[#0F1A26]/40"
                        }`}
                        aria-label={t('aria.goToImage', { number: idx + 1 })}
                      />
                    ))}
                  </div>
                  
                  <span className="text-xs sm:text-sm text-[#0F1A26]/60 min-w-[16px] sm:min-w-[20px]">
                    {String(product.images?.length || 1).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Product Info */}
            <div className={`lg:pl-8 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
              {/* Category & Actions */}
              <div className="flex items-start justify-between mb-4 sm:mb-6">
                <div className="flex-1 min-w-0">
                  <span className="text-[#EEBC3F] text-xs font-bold tracking-[0.3em] uppercase">{product.type}</span>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#0F1A26] mt-1 sm:mt-2 tracking-tight">{product.name}</h1>
                </div>
                <div className="flex gap-2 sm:gap-3 ml-4">
                  <button 
                    onClick={() => {
                      if (isInWishlist(product.id)) {
                        removeFromWishlist(product.id);
                      } else {
                        addToWishlist(product);
                      }
                    }}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border border-[#0F1A26]/10 flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:scale-110 ${
                      isInWishlist(product.id) 
                        ? 'text-[#EEBC3F] border-[#EEBC3F]' 
                        : 'text-[#0F1A26]/40 hover:text-[#EEBC3F] hover:border-[#EEBC3F]'
                    }`}
                  >
                    <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isInWishlist(product.id) ? 'fill-[#EEBC3F]' : ''}`} strokeWidth={1.5} />
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setShowShareToast(true);
                      setTimeout(() => setShowShareToast(false), 2000);
                    }}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border border-[#0F1A26]/10 flex items-center justify-center text-[#0F1A26]/40 hover:text-[#EEBC3F] hover:border-[#EEBC3F] transition-all duration-300 hover:shadow-lg hover:scale-110"
                  >
                    <Share2 className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Rating - Premium */}
              <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8 flex-wrap">
                <div className="flex items-center gap-1 bg-white rounded-full px-3 sm:px-4 py-1.5 sm:py-2 border border-[#0F1A26]/5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-3 h-3 sm:w-4 sm:h-4 fill-[#EEBC3F] text-[#EEBC3F]" strokeWidth={1.5} />
                  ))}
                  <span className="text-xs sm:text-sm font-bold text-[#0F1A26] ml-1 sm:ml-2">4.9</span>
                </div>
                <span className="text-xs sm:text-sm text-[#0F1A26]/50 underline decoration-[#0F1A26]/20 underline-offset-4">127 verified reviews</span>
              </div>

              {/* Price - Premium */}
              <div className="flex flex-wrap items-baseline gap-2 sm:gap-4 mb-6 sm:mb-8 p-3 sm:p-6 bg-gradient-to-r from-[#EEBC3F]/20 to-[#EEBC3F]/5 rounded-xl sm:rounded-2xl border-2 border-[#EEBC3F]/30">
                <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#0F1A26] tracking-tight">EGP {product.price}</span>
                <span className="text-lg sm:text-xl md:text-2xl text-[#0F1A26]/50 line-through font-medium">EGP {product.originalPrice}</span>
                <span className="bg-[#EEBC3F] text-[#0F1A26] text-xs sm:text-sm font-bold px-3 sm:px-4 py-1 sm:py-2 rounded-full shadow-lg">Save {Math.round((1 - product.price / product.originalPrice) * 100)}%</span>
              </div>

              {/* Size Selection */}
              {product.size && (
                <div className="mb-6 sm:mb-8">
                  <div className="flex items-center justify-between mb-3 sm:mb-5">
                    <label className="text-xs sm:text-sm font-bold text-[#0F1A26] tracking-[0.1em] uppercase flex items-center gap-2">
                      <Award className="w-3 h-3 sm:w-4 sm:h-4 text-[#EEBC3F]" />
                      {t('size.select')}
                    </label>
                    <Link href="/how-it-works" className="text-xs sm:text-sm bg-[#EEBC3F] hover:bg-[#d4a535] text-[#0F1A26] transition-all flex items-center gap-1.5 font-bold px-3 sm:px-4 py-2 rounded-lg shadow-md hover:shadow-lg hover:scale-105">
                      <Ruler className="w-3 h-3 sm:w-4 sm:h-4" />
                      {t('size.howToMeasure')}
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                    {sizes.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSize(size.id)}
                        className={`py-3 sm:py-5 rounded-xl sm:rounded-2xl border-2 text-center transition-all duration-300 ${selectedSize === size.id
                            ? "border-[#EEBC3F] bg-[#EEBC3F] text-white shadow-xl shadow-[#EEBC3F]/30 scale-105"
                            : "border-[#0F1A26]/10 hover:border-[#EEBC3F]/50 bg-white hover:shadow-lg"
                          }`}
                      >
                        <span className={`block font-bold text-base sm:text-lg ${selectedSize === size.id ? "text-white" : "text-[#0F1A26]"}`}>{size.label}</span>
                        <span className={`block text-xs mt-1 ${selectedSize === size.id ? "text-white/70" : "text-[#0F1A26]/50"}`}>{size.range}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity & Add to Cart - Premium */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="flex items-center bg-white border-2 border-[#0F1A26]/10 rounded-2xl overflow-hidden hover:border-[#EEBC3F]/30 transition-colors w-full sm:w-auto">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex-1 sm:flex-none sm:w-12 h-14 sm:h-16 flex items-center justify-center text-[#0F1A26]/60 hover:bg-[#EEBC3F]/10 hover:text-[#EEBC3F] transition-all text-lg sm:text-xl font-bold"
                  >
                    -
                  </button>
                  <span className="flex-1 sm:flex-none sm:w-12 text-center font-bold text-[#0F1A26] text-lg sm:text-xl">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex-1 sm:flex-none sm:w-12 h-14 sm:h-16 flex items-center justify-center text-[#0F1A26]/60 hover:bg-[#EEBC3F]/10 hover:text-[#EEBC3F] transition-all text-lg sm:text-xl font-bold"
                  >
                    +
                  </button>
                </div>
                <Button 
                  onClick={() => {
                    addToCart({
                      id: product.id,
                      name: product.name,
                      slug: product.slug,
                      type: product.type,
                      price: product.price,
                      originalPrice: product.originalPrice,
                      image: product.image,
                      size: product.size ? selectedSize : undefined,
                      quantity: quantity,
                    });
                  }}
                  className="flex-1 bg-[#0F1A26] text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26] h-14 sm:h-16 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 hover:shadow-xl hover:shadow-[#EEBC3F]/20 group"
                >
                  {t('addToCart')}
                </Button>
                <Button 
                  onClick={() => {
                    setBuyNowItem({
                      id: product.id,
                      name: product.name,
                      slug: product.slug,
                      type: product.type,
                      price: product.price,
                      originalPrice: product.originalPrice,
                      image: product.image,
                      size: product.size ? selectedSize : undefined,
                      quantity: quantity,
                    });
                    router.push("/checkout");
                  }}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-[#EEBC3F] to-[#d4a535] text-[#0F1A26] hover:shadow-xl hover:shadow-[#EEBC3F]/30 h-14 sm:h-16 px-4 sm:px-10 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 group"
                >
                  {t('buyNow')}
                </Button>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {[
                  { icon: Shield, title: t('benefits.protection.title'), desc: t('benefits.protection.desc') },
                  { icon: Sparkles, title: t('benefits.washable.title'), desc: t('benefits.washable.desc') },
                  { icon: Truck, title: t('benefits.shipping.title'), desc: t('benefits.shipping.desc') },
                  { icon: RotateCcw, title: t('benefits.returns.title'), desc: t('benefits.returns.desc') },
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-[#0F1A26]/5 hover:border-[#EEBC3F]/20 hover:shadow-lg transition-all duration-300 group">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center group-hover:bg-[#EEBC3F] transition-colors flex-shrink-0">
                      <benefit.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#EEBC3F] group-hover:text-white transition-colors" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <span className="block font-bold text-[#0F1A26] text-xs sm:text-sm">{benefit.title}</span>
                      <span className="block text-[#0F1A26]/50 text-xs">{benefit.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sections 3 & 4: Why You'll Love It + FAQs - Side by Side */}
          <div className="mt-16 lg:mt-24">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Section 3: Why You'll Love It (We Love) */}
              <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#0F1A26]/5 shadow-lg h-full">
                  <h3 className="text-base font-bold text-[#0F1A26] mb-5 tracking-[0.1em] uppercase flex items-center gap-3">
                    <Check className="w-5 h-5 text-[#EEBC3F]" />
                    {t('description.title')}
                  </h3>
                  <ul className="space-y-3">
                    {[t('description.1'), t('description.2'), t('description.3'), t('description.4')].map((item, index) => (
                      <li key={index} className="flex items-center gap-3 text-[#0F1A26]/70 p-3 bg-[#F1EBE3] rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-[#EEBC3F]/10 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-[#EEBC3F]" strokeWidth={2} />
                        </div>
                        <span className="font-medium text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Section 4: FAQs */}
              <div className={`transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="h-full">
                  <FAQSection
                    title={t('faq.title')}
                    translationNamespace="faqs"
                    faqs={
                      product.category === "luggage-covers" ? [
                        { questionKey: "questions.sizeCover.question", answerKey: "questions.sizeCover.answer" },
                        { questionKey: "questions.washCover.question", answerKey: "questions.washCover.answer" },
                        { questionKey: "questions.security.question", answerKey: "questions.security.answer" },
                        { questionKey: "questions.handles.question", answerKey: "questions.handles.answer" },
                      ] : product.category === "passport-wallets" ? [
                        { questionKey: "questions.rfid.question", answerKey: "questions.rfid.answer" },
                        { questionKey: "questions.cards.question", answerKey: "questions.cards.answer" },
                        { questionKey: "questions.leather.question", answerKey: "questions.leather.answer" },
                        { questionKey: "questions.pocket.question", answerKey: "questions.pocket.answer" },
                      ] : [
                        { questionKey: "questions.returnPolicy.question", answerKey: "questions.returnPolicy.answer" },
                        { questionKey: "questions.exchange.question", answerKey: "questions.exchange.answer" },
                        { questionKey: "questions.freeShip.question", answerKey: "questions.freeShip.answer" },
                      ]
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          <div className="mt-12 pt-12 lg:mt-24 lg:pt-20 border-t border-[#0F1A26]/10">
            <div className={`flex items-center justify-between mb-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div>
                <span className="text-[#EEBC3F] text-xs font-bold tracking-[0.3em] uppercase">{t('related.subtitle')}</span>
                <h2 className="text-3xl md:text-4xl font-bold text-[#0F1A26] mt-2 tracking-tight">{t('related.title')}</h2>
              </div>
              <Link href="/shop" className="bg-white text-[#0F1A26] hover:bg-[#EEBC3F] hover:text-[#0F1A26] px-6 py-3 rounded-full font-semibold transition-all duration-300 border border-[#0F1A26]/10 hover:border-[#EEBC3F] flex items-center gap-2 group">
                {t('related.viewAll')}
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" strokeWidth={2} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((relatedProduct, index) => (
                <Link
                  key={relatedProduct.id}
                  href={`/product/${relatedProduct.slug}`}
                  className={`group transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${index * 100 + 200}ms` }}
                >
                  <SwipeableProductImage product={relatedProduct} />
                  <div className="mt-3">
                    <h3 className="text-[#0F1A26] font-bold group-hover:text-[#EEBC3F] transition-colors duration-300 text-sm sm:text-lg line-clamp-1">{relatedProduct.name}</h3>
                    <div className="flex items-baseline gap-2 sm:gap-3 mt-1 sm:mt-2">
                      <span className="text-[#0F1A26] font-bold text-sm sm:text-lg">EGP {relatedProduct.price}</span>
                      <span className="text-[#0F1A26]/30 text-xs sm:text-sm line-through">EGP {relatedProduct.originalPrice}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
