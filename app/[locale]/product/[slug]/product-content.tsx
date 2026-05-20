"use client";

import { useCart } from "@/app/lib/cart-context";
import { useWishlist } from "@/app/lib/wishlist-context";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ChevronRight, Shield, Sparkles, Ruler, Heart, Share2, Check, Star, Truck, RotateCcw, ArrowUpRight, Award, ArrowLeft, ChevronLeft, ChevronRight as ChevronRightIcon, ChevronDown } from "lucide-react";
import { FAQSection } from "@/app/components/faq-section";
import { SwipeableProductImage } from "@/app/components/swipeable-product-image";
import { type Product, products } from "@/lib/products";
import { calculateBundlePrice, getPricingRuleKey } from "@/lib/bundle-pricing";

// Separate component for detailed product description
interface ProductDetailedDescriptionProps {
  product: Product;
  selectedSize: string;
  quantity: number;
  t: (key: string) => string;
  addToCart: (item: {
    id: number;
    name: string;
    slug: string;
    type: string;
    price: number;
    originalPrice: number;
    image: string;
    size?: string;
    quantity: number;
  }) => void;
}

interface ProductDetailedDescriptionIntroProps {
  product: Product;
  onExpand: () => void;
}

type ProductVideoItem = {
  poster: string;
  src: string;
  label?: string;
};

function ProductVideoSection({
  title,
  subtitle,
  poster,
  src,
  fullWidth,
  videoFit = "cover",
  videos,
}: {
  title: string;
  subtitle: string;
  poster?: string;
  src?: string;
  fullWidth?: boolean;
  videoFit?: "cover" | "contain";
  videos?: ProductVideoItem[];
}) {
  const wrapperClassName = fullWidth
    ? "mt-6 lg:mt-8 relative left-1/2 right-1/2 -mx-[50vw] w-screen"
    : "mt-6 lg:mt-8";

  const innerClassName = fullWidth
    ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    : undefined;

  const videoClassName = `w-full h-full ${videoFit === "contain" ? "object-contain" : "object-cover"
    }`;

  return (
    <div className={wrapperClassName}>
      <div className={innerClassName}>
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#0F1A26]/5 shadow-lg">
          <h3 className="text-base font-bold text-[#0F1A26] mb-5 tracking-[0.1em] uppercase flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#EEBC3F]" />
            {title}
          </h3>

          {videos && videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              {videos.map((video, index) => (
                <div
                  key={`${video.src}-${index}`}
                  className="rounded-2xl overflow-hidden bg-[#F1EBE3] border border-[#0F1A26]/5 shadow-sm"
                >
                  <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-[#F1EBE3]">
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      controls
                      preload="metadata"
                      className={videoClassName}
                      poster={video.poster}
                    >
                      <source src={video.src} type="video/mp4" />
                      <source src={video.src} type="video/quicktime" />
                      Your browser does not support the video tag.
                    </video>
                  </div>

                  {video.label && (
                    <p className="text-[#0F1A26]/60 text-xs sm:text-sm mt-3 text-center px-3 pb-3">
                      {video.label}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#F1EBE3]">
              <video
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="metadata"
                className={videoClassName}
                poster={poster}
              >
                {src && <source src={src} type="video/mp4" />}
                {src && <source src={src} type="video/quicktime" />}
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          <p className="text-[#0F1A26]/60 text-sm mt-4 text-center">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

// Component for showing just the intro (partially open)
function ProductDetailedDescriptionIntro({ product, onExpand }: ProductDetailedDescriptionIntroProps) {
  const tp = useTranslations('products');
  const t = useTranslations('product');

  // Check if this product has detailed description data
  const hasDetailedDescription = () => {
    try {
      const intro = tp(`${product.slug}.intro`);
      return intro && intro !== `${product.slug}.intro`;
    } catch {
      return false;
    }
  };

  const getIntro = () => {
    try {
      return tp(`${product.slug}.intro`);
    } catch {
      return null;
    }
  };

  if (!hasDetailedDescription()) {
    return null;
  }

  const intro = getIntro();
  if (!intro) return null;

  return (
    <button
      onClick={onExpand}
      className="w-full text-left p-5 bg-white rounded-xl border border-[#0F1A26]/5 shadow-md hover:shadow-lg hover:border-[#EEBC3F]/30 transition-all duration-300 cursor-pointer group"
    >
      <p className="text-[#0F1A26]/80 text-sm leading-relaxed">
        {intro}
      </p>
      {/* Clickable indicator showing there's more content */}
      <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-[#0F1A26]/10 text-[#EEBC3F] group-hover:text-[#0F1A26] transition-colors">
        <span className="text-xs font-medium">{t('readMore.moreAvailable')}</span>
        <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
      </div>
    </button>
  );
}

// Component for showing intro text only (no button) when expanded
function ProductDetailedDescriptionTextOnly({ product }: { product: Product }) {
  const tp = useTranslations('products');

  // Check if this product has detailed description data
  const hasDetailedDescription = () => {
    try {
      const intro = tp(`${product.slug}.intro`);
      return intro && intro !== `${product.slug}.intro`;
    } catch {
      return false;
    }
  };

  if (!hasDetailedDescription()) {
    return null;
  }

  return (
    <div className="p-5 bg-white rounded-xl border border-[#0F1A26]/5 shadow-md">
      <p className="text-[#0F1A26]/80 text-sm leading-relaxed">
        {tp(`${product.slug}.intro`)}
      </p>
    </div>
  );
}

// Component for showing full content when expanded
function ProductDetailedDescriptionFull({ product, selectedSize, quantity, t, addToCart }: ProductDetailedDescriptionProps) {
  const tp = useTranslations('products');

  // Helper to safely get array data
  const getArray = (path: string): string[] => {
    try {
      const raw = tp.raw(`${product.slug}.${path}`);
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  };

  // Helper to safely get features array
  const getFeatures = (): { title: string; desc: string }[] => {
    try {
      const raw = tp.raw(`${product.slug}.whyChoose.features`);
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  };

  const perfectFor = getArray('designInspiration.perfectFor');
  const targetAudience = getArray('targetAudience.items');
  const sizes = getArray('sizeGuide.sizes');
  const features = getFeatures();

  return (
    <div className="space-y-4">
      {/* 2-Column Layout for side-by-side content */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Design Inspiration */}
        {perfectFor.length > 0 && (
          <div className="p-5 bg-white rounded-xl border border-[#0F1A26]/5 shadow-md">
            <h4 className="font-bold text-[#0F1A26] mb-2 flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-[#EEBC3F]" />
              {tp(`${product.slug}.designInspiration.title`)}
            </h4>
            <p className="text-[#0F1A26]/70 text-sm mb-3">{tp(`${product.slug}.designInspiration.content`)}</p>
            <ul className="space-y-1.5">
              {perfectFor.map((item: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2 text-[#0F1A26]/70 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EEBC3F]" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-[#0F1A26]/60 text-xs mt-3 italic">{tp(`${product.slug}.designInspiration.tagline`)}</p>
          </div>
        )}

        {/* Target Audience */}
        {targetAudience.length > 0 && (
          <div className="p-5 bg-white rounded-xl border border-[#0F1A26]/5 shadow-md">
            <h4 className="font-bold text-[#0F1A26] mb-2 text-sm">{tp(`${product.slug}.targetAudience.title`)}</h4>
            <ul className="space-y-1.5">
              {targetAudience.map((item: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2 text-[#0F1A26]/70 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EEBC3F]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Size Guide */}
        {sizes.length > 0 && (
          <div className="p-5 bg-white rounded-xl border border-[#0F1A26]/5 shadow-md">
            <h4 className="font-bold text-[#0F1A26] mb-2 flex items-center gap-2 text-sm">
              <Ruler className="w-4 h-4 text-[#EEBC3F]" />
              {tp(`${product.slug}.sizeGuide.title`)}
            </h4>
            <p className="text-[#0F1A26]/70 text-sm mb-1">{tp(`${product.slug}.sizeGuide.subtitle`)}</p>
            <p className="text-[#0F1A26]/60 text-xs mb-2">{tp(`${product.slug}.sizeGuide.tip`)}</p>
            <ul className="space-y-1 mb-2">
              {sizes.map((size: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2 text-[#0F1A26]/70 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EEBC3F]" />
                  {size}
                </li>
              ))}
            </ul>
            <p className="text-[#0F1A26]/60 text-xs italic">{tp(`${product.slug}.sizeGuide.proTip`)}</p>
          </div>
        )}

        {/* About natOnat */}
        <div className="p-5 bg-[#0F1A26] rounded-xl text-white">
          <h4 className="font-bold mb-2 text-sm">{tp(`${product.slug}.about.title`)}</h4>
          <p className="text-white/80 text-sm">{tp(`${product.slug}.about.content`)}</p>
        </div>
      </div>

      {/* Why Choose - Full width */}
      {features.length > 0 && (
        <div className="p-5 bg-white rounded-xl border border-[#0F1A26]/5 shadow-md">
          <h4 className="font-bold text-[#0F1A26] mb-2 flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-[#EEBC3F]" />
            {tp(`${product.slug}.whyChoose.title`)}
          </h4>
          <p className="text-[#0F1A26]/70 text-sm mb-3">{tp(`${product.slug}.whyChoose.intro`)}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {features.map((feature: { title: string; desc: string }, idx: number) => (
              <div key={idx} className="flex items-start gap-2 p-2.5 bg-[#F1EBE3] rounded-lg">
                <span className="w-4 h-4 rounded-full bg-[#EEBC3F] text-white text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                <div>
                  <span className="font-bold text-[#0F1A26] text-xs block">{feature.title}</span>
                  <p className="text-[#0F1A26]/60 text-[11px] leading-tight">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA - Full width */}
      <div className="p-5 bg-gradient-to-r from-[#EEBC3F]/20 to-[#EEBC3F]/5 rounded-xl border border-[#EEBC3F]/30 text-center">
        <h4 className="font-bold text-[#0F1A26] mb-1 text-sm">{tp(`${product.slug}.cta.title`)}</h4>
        <p className="text-[#0F1A26]/70 text-sm mb-3">{tp(`${product.slug}.cta.content`)}</p>
        <Button
          onClick={() => {
            addToCart({
              id: Number(product.id),
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
          className="bg-[#EEBC3F] text-[#0F1A26] hover:bg-[#d4a535] h-10 px-6 rounded-lg font-bold text-sm"
        >
          {t('addToCart')}
        </Button>
      </div>
    </div>
  );
}

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
  const [selectedColor, setSelectedColor] = useState<string | null>(product.colors?.[0]?.id || null);
  const [quantity, setQuantity] = useState(1);
  const [showDetails, setShowDetails] = useState(true); // Partially open - shows intro only
  const [detailsExpanded, setDetailsExpanded] = useState(false); // Controls full expansion
  const [showInfo, setShowInfo] = useState(true); // Fully open by default

  const isBundle = product.category === "bundles" && !!product.bundleItems?.length;
  const getBundleProduct = useCallback(
    (productId: number) => products.find((p) => p.id === productId),
    []
  );

  const getBundleSizeOptions = useCallback((bundleProduct: Product): string[] => {
    if (bundleProduct.sizePrices) {
      return Object.keys(bundleProduct.sizePrices);
    }
    return [];
  }, []);

  const [bundleSelections, setBundleSelections] = useState<{ [key: number]: { productId?: number; size?: string; color?: string } }>(() => {
    const initial: { [key: number]: { productId?: number; size?: string; color?: string } } = {};
    if (isBundle && product.bundleItems) {
      product.bundleItems.forEach((item, index) => {
        const productId = item.productId || item.productIds?.[0];
        const bundleProduct = productId ? products.find((p) => p.id === productId) : undefined;
        const sizeOptions = bundleProduct ? getBundleSizeOptions(bundleProduct) : [];
        initial[index] = {
          productId: productId,
          size: sizeOptions[0],
          color: bundleProduct?.colors?.[0]?.id,
        };
      });
    }
    return initial;
  });

  // Helper function to get price based on selected size
  const getPriceBySize = (sizeId: string) => {
    if (product.sizePrices && product.sizePrices[sizeId as keyof typeof product.sizePrices]) {
      return product.sizePrices[sizeId as keyof typeof product.sizePrices];
    }
    return { price: product.price, originalPrice: product.originalPrice };
  };

  // Calculate dynamic bundle price using the pricing system
  const calculateDynamicBundlePrice = useCallback(() => {
    if (!product.dynamicPricing || !product.bundleItems) {
      return { price: product.price, originalPrice: product.originalPrice };
    }

    const pricingRuleKey = getPricingRuleKey(product);
    if (!pricingRuleKey) {
      return { price: product.price, originalPrice: product.originalPrice };
    }

    // Convert bundleSelections to the format expected by the pricing system
    const selections = product.bundleItems.map((item, index) => ({
      productId: bundleSelections[index]?.productId,
      size: bundleSelections[index]?.size,
      color: bundleSelections[index]?.color,
      quantity: item.quantity,
    }));

    return calculateBundlePrice(product.bundleItems, selections, products, pricingRuleKey);
  }, [product, bundleSelections, products]);

  const currentPrice = product.dynamicPricing ? calculateDynamicBundlePrice() : getPriceBySize(selectedSize);

  // Filter images based on selected color - memoized to prevent infinite loops
  const colorImages = useMemo(() => {
    if (!product.colors || !selectedColor) return product.images || [product.image];
    const colorIndex = product.colors.findIndex(c => c.id === selectedColor);
    if (colorIndex === -1) return product.images || [product.image];
    // Each color has 3 images, get the slice for selected color
    const startIdx = colorIndex * 3;
    const endIdx = startIdx + 3;
    return product.images?.slice(startIdx, endIdx) || [product.image];
  }, [product.colors, product.images, product.image, selectedColor]);

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

  // Reset active image when color changes
  useEffect(() => {
    setActiveImage(0);
  }, [selectedColor]);

  useEffect(() => {
    // Preload current image and adjacent ones
    const imagesToPreload = [activeImage, activeImage - 1, activeImage + 1].filter(
      i => i >= 0 && i < (colorImages.length || 1)
    );
    imagesToPreload.forEach(idx => handleThumbnailInView(idx));
  }, [activeImage, colorImages, handleThumbnailInView]);

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

      <main className="min-h-screen bg-[#F1EBE3] overflow-x-hidden pb-20 lg:pb-0" ref={ref}>
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
            <div className={`space-y-4 sm:space-y-6 transition-all duration-700 w-full max-w-full overflow-hidden ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
              {/* Main Image - Premium with Navigation Arrows + Swipe Support */}
              <div
                className="relative aspect-square bg-white/50 backdrop-blur-sm rounded-2xl sm:rounded-3xl flex items-center justify-center overflow-hidden border border-[#0F1A26]/10 shadow-2xl shadow-[#0F1A26]/10 touch-pan-y"
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  (e.currentTarget as any).touchStartX = touch.clientX;
                }}
                onTouchEnd={(e) => {
                  const touch = e.changedTouches[0];
                  const startX = (e.currentTarget as any).touchStartX;
                  const diff = startX - touch.clientX;
                  const threshold = 50;
                  if (Math.abs(diff) > threshold) {
                    if (diff > 0) {
                      setActiveImage((prev) => (prev === (colorImages.length || 1) - 1 ? 0 : prev + 1));
                    } else {
                      setActiveImage((prev) => (prev === 0 ? (colorImages.length || 1) - 1 : prev - 1));
                    }
                  }
                }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(238,188,63,0.15),transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.05),transparent_50%)]" />
                <div className="absolute inset-0 sm:p-4">
                  <Image
                    src={colorImages[activeImage] || product.image}
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
                  {(colorImages || [product.image]).map((img, idx) => (
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
                    {(colorImages || [product.image]).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(idx)}
                        className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${activeImage === idx
                          ? "w-4 sm:w-6 bg-[#EEBC3F]"
                          : "w-1.5 sm:w-1.5 bg-[#0F1A26]/20 hover:bg-[#0F1A26]/40"
                          }`}
                        aria-label={t('aria.goToImage', { number: idx + 1 })}
                      />
                    ))}
                  </div>

                  <span className="text-xs sm:text-sm text-[#0F1A26]/60 min-w-[16px] sm:min-w-[20px]">
                    {String(colorImages.length || 1).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Product Info */}
            <div className={`lg:pl-8 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
              {/* Buy Box - Price + Size + Add to Cart */}
              <div className="space-y-4">
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
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border border-[#0F1A26]/10 flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:scale-110 ${isInWishlist(product.id)
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
                  <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#0F1A26] tracking-tight">EGP {currentPrice.price}</span>
                  <span className="text-lg sm:text-xl md:text-2xl text-[#0F1A26]/50 line-through font-medium">EGP {currentPrice.originalPrice}</span>
                  <span className="bg-[#EEBC3F] text-[#0F1A26] text-xs sm:text-sm font-bold px-3 sm:px-4 py-1 sm:py-2 rounded-full shadow-lg">Save {Math.round((1 - currentPrice.price / currentPrice.originalPrice) * 100)}%</span>
                </div>

                {/* Size Selection */}
                {product.size && (
                  <div className="mb-6 sm:mb-8">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <label className="text-xs sm:text-sm font-bold text-[#0F1A26] tracking-[0.1em] uppercase flex items-center gap-2">
                        <Award className="w-3 h-3 sm:w-4 sm:h-4 text-[#EEBC3F]" />
                        {t('size.select')}
                      </label>
                      <Link href="/how-it-works" className="text-xs sm:text-sm bg-[#EEBC3F] hover:bg-[#d4a535] text-[#0F1A26] transition-all flex items-center gap-1.5 font-bold px-3 sm:px-4 py-2 rounded-lg shadow-md hover:shadow-lg hover:scale-105">
                        <Ruler className="w-3 h-3 sm:w-4 sm:h-4" />
                        {t('size.howToMeasure')}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 mb-3 sm:mb-4 bg-[#EEBC3F]/10 rounded-lg px-3 py-2">
                      <Ruler className="w-4 h-4 text-[#EEBC3F] flex-shrink-0" />
                      <p className="text-[#0F1A26] text-xs font-semibold">{t('size.heightNote')}</p>
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
                          <span className={`block text-[10px] uppercase tracking-wider mt-0.5 ${selectedSize === size.id ? "text-white/60" : "text-[#0F1A26]/40"}`}>{t('size.heightLabel')}</span>
                          <span className={`block text-xs mt-0.5 ${selectedSize === size.id ? "text-white/70" : "text-[#0F1A26]/50"}`}>{size.range}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isBundle && product.bundleItems && (
                  <div className="mb-6 sm:mb-8">
                    <h4 className="font-bold text-[#0F1A26] text-sm mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-[#EEBC3F] text-[#0F1A26] flex items-center justify-center text-xs font-bold">
                        {product.bundleItems.length}
                      </span>
                      {t("bundleItemsTitle")}
                    </h4>
                    <div className="space-y-4">
                      {product.bundleItems.map((item, index) => {
                        const selection = bundleSelections[index] || {};
                        const selectedProductId = selection.productId || item.productId || item.productIds?.[0];
                        const bundleProduct = selectedProductId ? getBundleProduct(selectedProductId) : undefined;
                        const sizeOptions = bundleProduct ? getBundleSizeOptions(bundleProduct) : [];

                        // Get available product options for this bundle item
                        const productOptions = item.productIds
                          ? item.productIds.map(id => {
                            const p = getBundleProduct(id);
                            return p ? { id: p.id, name: p.name, image: p.image } : null;
                          }).filter(Boolean)
                          : item.productId && bundleProduct
                            ? [{ id: bundleProduct.id, name: bundleProduct.name, image: bundleProduct.image }]
                            : [];

                        return (
                          <div key={index} className="bg-white rounded-xl p-4 border border-[#0F1A26]/10">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 rounded-lg bg-[#F1EBE3] flex items-center justify-center overflow-hidden">
                                {bundleProduct ? (
                                  <img src={bundleProduct.image} alt={bundleProduct.name} className="w-full h-full object-contain" />
                                ) : (
                                  <div className="w-full h-full bg-[#EEBC3F]/20" />
                                )}
                              </div>
                              <div className="flex-1">
                                {item.label && <p className="text-[#0F1A26]/50 text-xs mb-0.5">{item.label}</p>}
                                {productOptions.length > 1 ? (
                                  <select
                                    value={selectedProductId || ""}
                                    onChange={(e) => {
                                      const newProductId = parseInt(e.target.value);
                                      const newProduct = getBundleProduct(newProductId);
                                      const newSizeOptions = newProduct ? getBundleSizeOptions(newProduct) : [];
                                      setBundleSelections((prev) => ({
                                        ...prev,
                                        [index]: {
                                          ...prev[index],
                                          productId: newProductId,
                                          size: newSizeOptions[0],
                                          color: newProduct?.colors?.[0]?.id,
                                        },
                                      }));
                                    }}
                                    className="w-full text-sm font-semibold text-[#0F1A26] bg-transparent border border-[#0F1A26]/20 rounded-lg px-2 py-1 focus:border-[#EEBC3F] focus:outline-none"
                                  >
                                    <option value="">Select product...</option>
                                    {productOptions.map((opt) => opt && (
                                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                                    ))}
                                  </select>
                                ) : bundleProduct ? (
                                  <h5 className="font-semibold text-[#0F1A26] text-sm">{bundleProduct.name}</h5>
                                ) : null}
                                <span className="text-[#EEBC3F] text-xs font-medium block mt-1">Qty: {item.quantity}</span>
                              </div>
                            </div>

                            {sizeOptions.length > 0 && (
                              <div className="mb-3">
                                <label className="text-[#0F1A26]/60 text-xs mb-2 block">{t("size.select")}</label>
                                <div className="flex flex-wrap gap-2">
                                  {sizeOptions.map((size: string) => (
                                    <button
                                      key={size}
                                      onClick={() =>
                                        setBundleSelections((prev) => ({
                                          ...prev,
                                          [index]: { ...prev[index], size },
                                        }))
                                      }
                                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selection.size === size
                                        ? "bg-[#EEBC3F] text-[#0F1A26]"
                                        : "bg-white text-[#0F1A26]/70 hover:bg-[#EEBC3F]/20"
                                        }`}
                                    >
                                      {size.toUpperCase()}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {bundleProduct?.colors && bundleProduct.colors.length > 0 && (
                              <div>
                                <label className="text-[#0F1A26]/60 text-xs mb-2 block">{t("color.select")}</label>
                                <div className="flex flex-wrap gap-2">
                                  {bundleProduct.colors.map((color) => (
                                    <button
                                      key={color.id}
                                      onClick={() =>
                                        setBundleSelections((prev) => ({
                                          ...prev,
                                          [index]: { ...prev[index], color: color.id },
                                        }))
                                      }
                                      className={`w-8 h-8 rounded-full border-2 transition-all overflow-hidden ${selection.color === color.id
                                        ? "border-[#EEBC3F] ring-2 ring-[#EEBC3F]/30"
                                        : "border-[#0F1A26]/10 hover:border-[#EEBC3F]/50"
                                        }`}
                                      title={color.name}
                                    >
                                      <img src={color.image} alt={color.name} className="w-full h-full object-cover" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Color Selection */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-[#0F1A26] font-semibold text-sm sm:text-base flex items-center gap-2">
                        {t('color.select') || 'Select Color'}
                        <span className="text-[#EEBC3F]">·</span>
                        <span className="text-[#0F1A26]/60 font-normal">{product.colors.find(c => c.id === selectedColor)?.name}</span>
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {product.colors.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => {
                            setSelectedColor(color.id);
                            setActiveImage(0); // Reset to first image of new color
                          }}
                          className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 overflow-hidden transition-all duration-300 ${selectedColor === color.id
                            ? "border-[#EEBC3F] shadow-lg shadow-[#EEBC3F]/30 scale-105 ring-2 ring-[#EEBC3F]/20"
                            : "border-[#0F1A26]/10 hover:border-[#EEBC3F]/50 hover:shadow-md"
                            }`}
                        >
                          <img
                            src={color.image}
                            alt={color.name}
                            className="w-full h-full object-cover"
                          />
                          {selectedColor === color.id && (
                            <div className="absolute inset-0 bg-[#EEBC3F]/20 flex items-center justify-center">
                              <Check className="w-5 h-5 sm:w-6 sm:h-6 text-[#0F1A26] bg-white rounded-full p-1" />
                            </div>
                          )}
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
                      const cartBundleSelections =
                        isBundle && product.bundleItems
                          ? product.bundleItems.map((item, index) => {
                            const selection = bundleSelections[index] || {};
                            const selectedProductId = selection.productId || item.productId || item.productIds?.[0];
                            const bundleProduct = selectedProductId ? getBundleProduct(selectedProductId) : undefined;
                            return {
                              productId: selectedProductId || 0,
                              productName: bundleProduct?.name || "",
                              size: selection.size,
                              color: selection.color,
                              quantity: item.quantity,
                            };
                          })
                          : undefined;

                      addToCart({
                        id: product.id,
                        name: product.name,
                        slug: product.slug,
                        type: product.type,
                        price: currentPrice.price,
                        originalPrice: currentPrice.originalPrice,
                        image: product.colors && selectedColor
                          ? product.colors.find(c => c.id === selectedColor)?.image || product.image
                          : product.image,
                        size: product.size ? selectedSize : undefined,
                        color: product.colors && selectedColor ? selectedColor : undefined,
                        quantity: quantity,
                        isBundle,
                        bundleSelections: cartBundleSelections,
                      });
                    }}
                    className="flex-1 bg-[#0F1A26] text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26] h-14 sm:h-16 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 hover:shadow-xl hover:shadow-[#EEBC3F]/20 group"
                  >
                    {t('addToCart')}
                  </Button>
                  <Button
                    onClick={() => {
                      const priceToUse = currentPrice?.price || product?.price || 0;
                      if (!priceToUse || priceToUse === 0) {
                        console.error("[Product] Cannot buy now - invalid price:", { currentPrice, product });
                        alert("Error: Product price not loaded. Please refresh the page.");
                        return;
                      }

                      const cartBundleSelections =
                        isBundle && product.bundleItems
                          ? product.bundleItems.map((item, index) => {
                            const selection = bundleSelections[index] || {};
                            const selectedProductId = selection.productId || item.productId || item.productIds?.[0];
                            const bundleProduct = selectedProductId ? getBundleProduct(selectedProductId) : undefined;
                            return {
                              productId: selectedProductId || 0,
                              productName: bundleProduct?.name || "",
                              size: selection.size,
                              color: selection.color,
                              quantity: item.quantity,
                            };
                          })
                          : undefined;

                      setBuyNowItem({
                        id: product.id,
                        name: product.name,
                        slug: product.slug,
                        type: product.type,
                        price: priceToUse,
                        originalPrice: currentPrice?.originalPrice || product?.originalPrice || priceToUse,
                        image: product.colors && selectedColor
                          ? product.colors.find(c => c.id === selectedColor)?.image || product.image
                          : product.image,
                        size: product.size ? selectedSize : undefined,
                        color: product.colors && selectedColor ? selectedColor : undefined,
                        quantity: quantity,
                        isBundle,
                        bundleSelections: cartBundleSelections,
                      });
                      router.push("/checkout");
                    }}
                    className="flex-1 sm:flex-none bg-gradient-to-r from-[#EEBC3F] to-[#d4a535] text-[#0F1A26] hover:shadow-xl hover:shadow-[#EEBC3F]/30 h-14 sm:h-16 px-4 sm:px-10 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 group"
                  >
                    {t('buyNow')}
                  </Button>
                </div>
              </div>{/* End Sticky Buy Box */}

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

          {/* Video Section - Full Width */}
          {product.category === "passport-wallets" && (
            <ProductVideoSection
              title={t('videoSection.title') || 'See It In Action'}
              subtitle={
                t('videoSection.passportSubtitle') ||
                'Discover the premium leather and RFID protection of our passport wallet'
              }
              poster="/passport%20wallet/Cognac%20brown/1.png"
              src="/passport%20wallet/Wallet%20landscape%20without%20logo.mov"
              fullWidth
            />
          )}

          {product.category === "packonat" && (
            <ProductVideoSection
              title={t('videoSection.title') || 'See It In Action'}
              subtitle={
                t('videoSection.subtitle') ||
                'Watch how PackOnat keeps your clothes organized and wrinkle-free'
              }
              poster="/packOnat/Black/1.png"
              src="/packOnat/Cloth%20case%20landscape%20without%20logo.mov"
              fullWidth
              videoFit="contain"
            />
          )}

          {product.category === "luggage-covers" && (
            <ProductVideoSection
              title={t('videoSection.title') || 'See It In Action'}
              subtitle={
                t('videoSection.subtitle') ||
                'Watch how our luggage covers protect your suitcase in style'
              }
              fullWidth
              videoFit="contain"
              videos={[
                {
                  poster: "/octopus photo/Black/1.png",
                  src: "/octopus photo/Wear2.mp4",
                  label: "Premium suitcase protection",
                },
                {
                  poster: "/octopus photo/Green/1.png",
                  src: "/octopus photo/Wear.mp4",
                  label: "Easy to wear in seconds",
                },
                {
                  poster: "/octopus photo/Black/1.png",
                  src: "/octopus photo/Wear3.mp4",
                  label: "Travel-ready secure fit",
                },
              ]}
            />
          )}

          {/* Detailed Product Description - Partially open (intro only) */}
          <div className="mt-6 lg:mt-8">
            <button
              onClick={() => setDetailsExpanded(!detailsExpanded)}
              className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-[#0F1A26]/5 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <span className="font-bold text-[#0F1A26] text-sm">{t('readMore.detailsTitle')}</span>
              <div className={`w-8 h-8 rounded-full bg-[#EEBC3F]/10 flex items-center justify-center group-hover:bg-[#EEBC3F] transition-all ${detailsExpanded ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-5 h-5 text-[#EEBC3F] group-hover:text-white" />
              </div>
            </button>
            {/* Show intro card with click button when collapsed */}
            {!detailsExpanded && (
              <div className="mt-4">
                <ProductDetailedDescriptionIntro product={product} onExpand={() => setDetailsExpanded(true)} />
              </div>
            )}
            {/* Show intro text (no button) + full content when expanded */}
            {detailsExpanded && (
              <div className="mt-4 space-y-4">
                <ProductDetailedDescriptionTextOnly product={product} />
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <ProductDetailedDescriptionFull
                    product={product}
                    selectedSize={selectedSize}
                    quantity={quantity}
                    t={t}
                    addToCart={addToCart}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sections 3 & 4: Why You'll Love It + FAQs - Fully open by default */}
          <div className="mt-6 lg:mt-8">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-[#0F1A26]/5 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <span className="font-bold text-[#0F1A26] text-sm">{t('readMore.infoTitle')}</span>
              <div className={`w-8 h-8 rounded-full bg-[#EEBC3F]/10 flex items-center justify-center group-hover:bg-[#EEBC3F] transition-all ${showInfo ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-5 h-5 text-[#EEBC3F] group-hover:text-white" />
              </div>
            </button>
            {showInfo && (
              <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
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
                          ] : product.category === "packonat" ? [
                            { questionKey: "questions.returnPolicy.question", answerKey: "questions.returnPolicy.answer" },
                            { questionKey: "questions.exchange.question", answerKey: "questions.exchange.answer" },
                            { questionKey: "questions.freeShip.question", answerKey: "questions.freeShip.answer" },
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
            )}
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
                      {relatedProduct.dynamicPricing ? (
                        <span className="text-[#EEBC3F] font-bold text-sm sm:text-lg">Price calculated on selection</span>
                      ) : (
                        <>
                          <span className="text-[#0F1A26] font-bold text-sm sm:text-lg">EGP {relatedProduct.price}</span>
                          <span className="text-[#0F1A26]/30 text-xs sm:text-sm line-through">EGP {relatedProduct.originalPrice}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Sticky Buy Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#0F1A26]/10 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-[#0F1A26] font-bold text-sm truncate">{product.name}</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-[#0F1A26] font-bold text-base">EGP {currentPrice.price}</span>
                <span className="text-[#0F1A26]/40 text-xs line-through">EGP {currentPrice.originalPrice}</span>
              </div>
            </div>
            <Button
              onClick={() => {
                const cartBundleSelections =
                  isBundle && product.bundleItems
                    ? product.bundleItems.map((item, index) => {
                      const selection = bundleSelections[index] || {};
                      const selectedProductId = selection.productId || item.productId || item.productIds?.[0];
                      const bundleProduct = selectedProductId ? getBundleProduct(selectedProductId) : undefined;
                      return {
                        productId: selectedProductId || 0,
                        productName: bundleProduct?.name || "",
                        size: selection.size,
                        color: selection.color,
                        quantity: item.quantity,
                      };
                    })
                    : undefined;

                addToCart({
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  type: product.type,
                  price: currentPrice.price,
                  originalPrice: currentPrice.originalPrice,
                  image: product.image,
                  size: product.size ? selectedSize : undefined,
                  quantity: quantity,
                  isBundle,
                  bundleSelections: cartBundleSelections,
                });
              }}
              className="bg-[#0F1A26] text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26] h-12 px-6 rounded-xl font-bold text-sm transition-all duration-300 flex-shrink-0"
            >
              {t('addToCart')}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
