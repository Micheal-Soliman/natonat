"use client";

import { useCart } from "@/app/lib/cart-context";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ChevronRight, Shield, Sparkles, Ruler, Heart, Share2, Check, Star, Truck, RotateCcw, ArrowUpRight, Crown, Zap, Award, ArrowLeft, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";
import { type Product, products } from "@/lib/products";

interface ProductPageContentProps {
  product: Product;
  prevProduct: Product | null;
  nextProduct: Product | null;
}

export default function ProductPageContent({ product, prevProduct, nextProduct }: ProductPageContentProps) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState("m");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const sizes = [
    { id: "s", label: "S", range: "18-21 inches" },
    { id: "m", label: "M", range: "22-25 inches" },
    { id: "l", label: "L", range: "26-29 inches" },
    { id: "xl", label: "XL", range: "30-32 inches" },
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
                  <span className="text-xs text-[#0F1A26]/50 group-hover:text-white/70">Previous</span>
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
                  <span className="text-xs text-[#0F1A26]/50 group-hover:text-white/70">Go back</span>
                  <span className="text-sm font-semibold">Back to Shop</span>
                </div>
              </Link>
            )}
            
            {/* Center - Product counter */}
            <div className="hidden md:flex flex-col items-center">
              <span className="text-xs text-[#0F1A26]/40 uppercase tracking-wider">Browsing</span>
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
                  <span className="text-xs text-[#0F1A26]/50 group-hover:text-white/70">Next</span>
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

          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Images - Premium Gallery */}
            <div className={`space-y-6 lg:sticky lg:top-28 transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
              {/* Main Image - Premium with Navigation Arrows */}
              <div className="aspect-square bg-white/50 backdrop-blur-sm rounded-3xl flex items-center justify-center relative overflow-hidden border border-[#0F1A26]/10 shadow-2xl shadow-[#0F1A26]/10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(238,188,63,0.15),transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.05),transparent_50%)]" />
                <img 
                  src={product.images?.[activeImage] || product.image} 
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-contain p-4"
                />

                {/* Premium Tag */}
                <div className="absolute top-6 left-6">
                  <div className="bg-[#EEBC3F] rounded-full px-4 py-2 border border-[#EEBC3F] shadow-lg">
                    <span className="text-[#0F1A26] text-xs font-bold tracking-wider">PREMIUM</span>
                  </div>
                </div>

                {/* Previous/Next Arrows */}
                <button
                  onClick={() => setActiveImage((prev) => (prev === 0 ? (product.images?.length || 1) - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-[#EEBC3F] text-[#0F1A26] rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-110"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setActiveImage((prev) => (prev === (product.images?.length || 1) - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-[#EEBC3F] text-[#0F1A26] rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-110"
                  aria-label="Next image"
                >
                  <ChevronRightIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Thumbnails - Horizontal Scrollable with Index */}
              <div className="space-y-3">
                {/* Thumbnails Row */}
                <div className="flex gap-3 overflow-x-auto pb-3 px-1 scrollbar-thin scrollbar-thumb-[#EEBC3F]/40 scrollbar-track-transparent hover:scrollbar-thumb-[#EEBC3F]">
                  {(product.images || [product.image]).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-white/80 flex items-center justify-center transition-all duration-300 border-2 overflow-hidden ${activeImage === idx
                          ? "border-[#EEBC3F] shadow-lg shadow-[#EEBC3F]/20"
                          : "border-transparent opacity-80 hover:opacity-100"
                        }`}
                    >
                      <img 
                        src={img} 
                        alt={`${product.name} view ${idx + 1}`}
                        className="w-full h-full object-contain p-1"
                      />
                    </button>
                  ))}
                </div>
                
                {/* Index Indicator with Dots */}
                <div className="flex items-center justify-center gap-4">
                  <span className="text-sm font-bold text-[#EEBC3F] min-w-[20px]">
                    {String(activeImage + 1).padStart(2, '0')}
                  </span>
                  
                  {/* Dots */}
                  <div className="flex items-center gap-1.5">
                    {(product.images || [product.image]).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          activeImage === idx 
                            ? "w-6 bg-[#EEBC3F]" 
                            : "w-1.5 bg-[#0F1A26]/20 hover:bg-[#0F1A26]/40"
                        }`}
                        aria-label={`Go to image ${idx + 1}`}
                      />
                    ))}
                  </div>
                  
                  <span className="text-sm text-[#0F1A26]/60 min-w-[20px]">
                    {String(product.images?.length || 1).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>

            {/* Product Info - Premium */}
            <div className={`lg:pl-8 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
              {/* Category & Actions */}
              <div className="flex items-start justify-between mb-4 sm:mb-6">
                <div className="flex-1 min-w-0">
                  <span className="text-[#EEBC3F] text-xs font-bold tracking-[0.3em] uppercase">{product.type}</span>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#0F1A26] mt-1 sm:mt-2 tracking-tight">{product.name}</h1>
                </div>
                <div className="flex gap-2 sm:gap-3 ml-4">
                  <button className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border border-[#0F1A26]/10 flex items-center justify-center text-[#0F1A26]/40 hover:text-[#EEBC3F] hover:border-[#EEBC3F] transition-all duration-300 hover:shadow-lg hover:scale-110">
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
                  </button>
                  <button className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border border-[#0F1A26]/10 flex items-center justify-center text-[#0F1A26]/40 hover:text-[#EEBC3F] hover:border-[#EEBC3F] transition-all duration-300 hover:shadow-lg hover:scale-110">
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

              {/* Size Selection - Premium */}
              {product.size && (
                <div className="mb-6 sm:mb-8">
                  <div className="flex items-center justify-between mb-3 sm:mb-5">
                    <label className="text-xs sm:text-sm font-bold text-[#0F1A26] tracking-[0.1em] uppercase flex items-center gap-2">
                      <Award className="w-3 h-3 sm:w-4 sm:h-4 text-[#EEBC3F]" />
                      Select Size
                    </label>
                    <Link href="/how-it-works" className="text-xs sm:text-sm bg-[#EEBC3F]/10 hover:bg-[#EEBC3F] text-[#EEBC3F] hover:text-[#0F1A26] transition-all flex items-center gap-1.5 font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-[#EEBC3F]/30">
                      <Ruler className="w-3 h-3 sm:w-4 sm:h-4" />
                      How to Measure?
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
                  Add to Cart
                </Button>
                <Button 
                  onClick={() => {
                    addToCart({
                      id: product.id,
                      name: product.name,
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
                  Buy Now
                </Button>
              </div>

              {/* Benefits - Premium Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {[
                  { icon: Shield, title: "Scratch Protection", desc: "Protects your luggage" },
                  { icon: Sparkles, title: "Machine Washable", desc: "Easy to clean" },
                  { icon: Truck, title: "Free Shipping", desc: "On orders over 500 EGP" },
                  { icon: RotateCcw, title: "30-Day Returns", desc: "Hassle free" },
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

              {/* Description - Premium */}
              <div className="bg-white rounded-3xl p-6 border border-[#0F1A26]/5">
                <h3 className="text-sm font-bold text-[#0F1A26] mb-5 tracking-[0.1em] uppercase flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#EEBC3F]" />
                  Why You&apos;ll Love It
                </h3>
                <ul className="space-y-4">
                  {[
                    "Protects from scratches, dirt & rough handling",
                    "Stretchy, washable spandex/polyester fabric",
                    "Easy access to top & side handles",
                    "Wheels remain free for easy rolling"
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3 text-[#0F1A26]/70">
                      <div className="w-8 h-8 rounded-lg bg-[#EEBC3F]/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-[#EEBC3F]" strokeWidth={2} />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Related Products - Premium */}
          <div className="mt-24 pt-20 border-t border-[#0F1A26]/10">
            <div className={`flex items-center justify-between mb-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div>
                <span className="text-[#EEBC3F] text-xs font-bold tracking-[0.3em] uppercase">Complete Your Look</span>
                <h2 className="text-3xl md:text-4xl font-bold text-[#0F1A26] mt-2 tracking-tight">You May Also Like</h2>
              </div>
              <Link href="/shop" className="bg-white text-[#0F1A26] hover:bg-[#EEBC3F] hover:text-[#0F1A26] px-6 py-3 rounded-full font-semibold transition-all duration-300 border border-[#0F1A26]/10 hover:border-[#EEBC3F] flex items-center gap-2 group">
                View All
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" strokeWidth={2} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((product, index) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className={`group transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${index * 100 + 200}ms` }}
                >
                  <div className="relative aspect-[3/4] bg-gradient-to-br from-[#0F1A26] to-[#364353] rounded-2xl sm:rounded-3xl overflow-hidden mb-3 sm:mb-4 border border-[#0F1A26]/10 shadow-lg shadow-[#0F1A26]/5">
                    <img 
                      src={products.find(p => p.slug === product.slug)?.image || product.image} 
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-[#0F1A26]/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                      <button
                        className="w-14 h-14 bg-[#EEBC3F] rounded-full flex items-center justify-center transform scale-0 group-hover:scale-100 transition-all duration-500 hover:scale-110 shadow-lg shadow-[#EEBC3F]/30"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Adding related product to cart:', product.name);
                          addToCart({
                            id: product.id,
                            name: product.name,
                            type: "Luggage Cover",
                            price: product.price,
                            originalPrice: product.originalPrice,
                            image: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=400&q=80",
                            quantity: 1,
                          });
                        }}
                      >
                        <ShoppingBag className="w-6 h-6 text-[#0F1A26]" strokeWidth={1.5} />
                      </button>
                    </div>

                    {/* Sale Badge */}
                    {product.originalPrice > product.price && (
                      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-[#EEBC3F] text-[#0F1A26] text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                        SALE
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-[#0F1A26] font-bold group-hover:text-[#EEBC3F] transition-colors duration-300 text-sm sm:text-lg line-clamp-1">{product.name}</h3>
                    <div className="flex items-baseline gap-2 sm:gap-3 mt-1 sm:mt-2">
                      <span className="text-[#0F1A26] font-bold text-sm sm:text-lg">EGP {product.price}</span>
                      <span className="text-[#0F1A26]/30 text-xs sm:text-sm line-through">EGP {product.originalPrice}</span>
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
