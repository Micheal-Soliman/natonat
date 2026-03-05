"use client";

import { useCart } from "@/app/lib/cart-context";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ChevronRight, Shield, Sparkles, Ruler, Heart, Share2, Check, Star, Truck, RotateCcw, ArrowUpRight, Crown, Zap, Award, ArrowLeft } from "lucide-react";

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

const relatedProducts = [
  { id: 2, name: "Floral Design Cover", price: 649, originalPrice: 800 },
  { id: 3, name: "Classic Leather Wallet", price: 449, originalPrice: 550 },
  { id: 5, name: "Travel Set - Geo", price: 899, originalPrice: 1150 },
];

export default function ProductPage({ params }: { params: { slug: string } }) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState("m");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
      <main className="min-h-screen bg-[#F1EBE3]" ref={ref}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          {/* Back to Shop */}
          <Link 
            href="/shop" 
            className="inline-flex items-center gap-2 text-[#0F1A26]/60 hover:text-[#EEBC3F] transition-colors mb-6 mt-4 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>

          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Images - Premium Gallery */}
            <div className={`space-y-6 lg:sticky lg:top-28 transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
              {/* Main Image - Premium */}
              <div className="aspect-square bg-gradient-to-br from-[#0F1A26] via-[#1a2a3a] to-[#364353] rounded-3xl flex items-center justify-center relative overflow-hidden border border-[#0F1A26]/10 shadow-2xl shadow-[#0F1A26]/10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(238,188,63,0.15),transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.05),transparent_50%)]" />
                <span className="text-white/20 text-sm font-light tracking-widest uppercase">Product Image {activeImage + 1}</span>

                {/* Premium Tag */}
                <div className="absolute top-6 left-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                    <span className="text-white/80 text-xs font-semibold tracking-wider">PREMIUM</span>
                  </div>
                </div>
              </div>

              {/* Thumbnails - Premium */}
              <div className="grid grid-cols-4 gap-4">
                {productImages.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(idx)}
                    className={`aspect-square rounded-2xl bg-gradient-to-br from-[#0F1A26] to-[#364353] flex items-center justify-center transition-all duration-300 border-2 ${activeImage === idx
                        ? "border-[#EEBC3F] shadow-lg shadow-[#EEBC3F]/20 scale-105"
                        : "border-transparent opacity-50 hover:opacity-80 hover:scale-105"
                      }`}
                  >
                    <span className={`font-bold ${activeImage === idx ? "text-[#EEBC3F]" : "text-white/40"}`}>{idx + 1}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info - Premium */}
            <div className={`lg:pl-8 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
              {/* Category & Actions */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <span className="text-[#EEBC3F] text-xs font-bold tracking-[0.3em] uppercase">Luggage Cover</span>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0F1A26] mt-2 tracking-tight">Geo Print Cover</h1>
                </div>
                <div className="flex gap-3">
                  <button className="w-12 h-12 rounded-full bg-white border border-[#0F1A26]/10 flex items-center justify-center text-[#0F1A26]/40 hover:text-[#EEBC3F] hover:border-[#EEBC3F] transition-all duration-300 hover:shadow-lg hover:scale-110">
                    <Heart className="w-5 h-5" strokeWidth={1.5} />
                  </button>
                  <button className="w-12 h-12 rounded-full bg-white border border-[#0F1A26]/10 flex items-center justify-center text-[#0F1A26]/40 hover:text-[#EEBC3F] hover:border-[#EEBC3F] transition-all duration-300 hover:shadow-lg hover:scale-110">
                    <Share2 className="w-5 h-5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Rating - Premium */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-1 bg-white rounded-full px-4 py-2 border border-[#0F1A26]/5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-[#EEBC3F] text-[#EEBC3F]" strokeWidth={1.5} />
                  ))}
                  <span className="text-sm font-bold text-[#0F1A26] ml-2">4.9</span>
                </div>
                <span className="text-sm text-[#0F1A26]/50 underline decoration-[#0F1A26]/20 underline-offset-4">127 verified reviews</span>
              </div>

              {/* Price - Premium */}
              <div className="flex items-baseline gap-4 mb-8 p-6 bg-gradient-to-r from-[#EEBC3F]/10 to-transparent rounded-2xl border border-[#EEBC3F]/20">
                <span className="text-5xl md:text-6xl font-bold text-[#0F1A26] tracking-tight">EGP 599</span>
                <span className="text-2xl text-[#0F1A26]/30 line-through font-light">EGP 750</span>
                <span className="bg-[#0F1A26] text-white text-sm font-bold px-4 py-2 rounded-full">Save 20%</span>
              </div>

              {/* Size Selection - Premium */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-5">
                  <label className="text-sm font-bold text-[#0F1A26] tracking-[0.1em] uppercase flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#EEBC3F]" />
                    Select Size
                  </label>
                  <Link href="/how-it-works" className="text-sm text-[#EEBC3F] hover:text-[#0F1A26] transition-colors flex items-center gap-1 font-semibold">
                    <Ruler className="w-4 h-4" />
                    Size Guide
                  </Link>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {sizes.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size.id)}
                      className={`py-5 rounded-2xl border-2 text-center transition-all duration-300 ${selectedSize === size.id
                          ? "border-[#EEBC3F] bg-[#EEBC3F] text-white shadow-xl shadow-[#EEBC3F]/30 scale-105"
                          : "border-[#0F1A26]/10 hover:border-[#EEBC3F]/50 bg-white hover:shadow-lg"
                        }`}
                    >
                      <span className={`block font-bold text-lg ${selectedSize === size.id ? "text-white" : "text-[#0F1A26]"}`}>{size.label}</span>
                      <span className={`block text-xs mt-1 ${selectedSize === size.id ? "text-white/70" : "text-[#0F1A26]/50"}`}>{size.range}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity & Add to Cart - Premium */}
              <div className="flex gap-4 mb-8">
                <div className="flex items-center bg-white border-2 border-[#0F1A26]/10 rounded-2xl overflow-hidden hover:border-[#EEBC3F]/30 transition-colors">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-16 h-16 flex items-center justify-center text-[#0F1A26]/60 hover:bg-[#EEBC3F]/10 hover:text-[#EEBC3F] transition-all text-xl font-bold"
                  >
                    −
                  </button>
                  <span className="w-16 text-center font-bold text-[#0F1A26] text-xl">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-16 h-16 flex items-center justify-center text-[#0F1A26]/60 hover:bg-[#EEBC3F]/10 hover:text-[#EEBC3F] transition-all text-xl font-bold"
                  >
                    +
                  </button>
                </div>
                <Button 
                  onClick={() => {
                    console.log('Adding to cart from product page');
                    addToCart({
                      id: 1,
                      name: "Geo Print Cover",
                      type: "Luggage Cover",
                      price: 599,
                      originalPrice: 750,
                      image: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=400&q=80",
                      size: selectedSize,
                      quantity: quantity,
                    });
                  }}
                  className="flex-1 bg-[#0F1A26] text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26] h-16 rounded-2xl font-bold text-lg transition-all duration-300 hover:shadow-xl hover:shadow-[#EEBC3F]/20 group"
                >
                  Add to Cart
                </Button>
                <Button 
                  onClick={() => {
                    addToCart({
                      id: 1,
                      name: "Geo Print Cover",
                      type: "Luggage Cover",
                      price: 599,
                      originalPrice: 750,
                      image: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=400&q=80",
                      size: selectedSize,
                      quantity: quantity,
                    });
                    router.push("/checkout");
                  }}
                  className="bg-gradient-to-r from-[#EEBC3F] to-[#d4a535] text-[#0F1A26] hover:shadow-xl hover:shadow-[#EEBC3F]/30 h-16 px-10 rounded-2xl font-bold text-lg transition-all duration-300 group"
                >
                  Buy Now
                </Button>
              </div>

              {/* Benefits - Premium Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: Shield, title: "Scratch Protection", desc: "Protects your luggage" },
                  { icon: Sparkles, title: "Machine Washable", desc: "Easy to clean" },
                  { icon: Truck, title: "Free Shipping", desc: "On orders over 500 EGP" },
                  { icon: RotateCcw, title: "30-Day Returns", desc: "Hassle free" },
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#0F1A26]/5 hover:border-[#EEBC3F]/20 hover:shadow-lg transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center group-hover:bg-[#EEBC3F] transition-colors">
                      <benefit.icon className="w-6 h-6 text-[#EEBC3F] group-hover:text-white transition-colors" strokeWidth={1.5} />
                    </div>
                    <div>
                      <span className="block font-bold text-[#0F1A26] text-sm">{benefit.title}</span>
                      <span className="block text-[#0F1A26]/50 text-xs">{benefit.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Description - Premium */}
              <div className="bg-white rounded-3xl p-6 border border-[#0F1A26]/5">
                <h3 className="text-sm font-bold text-[#0F1A26] mb-5 tracking-[0.1em] uppercase flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#EEBC3F]" />
                  Why You'll Love It
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((product, index) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className={`group transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${index * 100 + 200}ms` }}
                >
                  <div className="relative aspect-[3/4] bg-gradient-to-br from-[#0F1A26] to-[#364353] rounded-3xl overflow-hidden mb-4 border border-[#0F1A26]/10 shadow-lg shadow-[#0F1A26]/5">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white/20 text-sm font-light">Product Image</span>
                    </div>

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
                      <div className="absolute top-4 left-4 bg-[#EEBC3F] text-[#0F1A26] text-xs font-bold px-3 py-1.5 rounded-full">
                        SALE
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-[#0F1A26] font-bold group-hover:text-[#EEBC3F] transition-colors duration-300 text-lg">{product.name}</h3>
                    <div className="flex items-baseline gap-3 mt-2">
                      <span className="text-[#0F1A26] font-bold text-lg">EGP {product.price}</span>
                      <span className="text-[#0F1A26]/30 text-sm line-through">EGP {product.originalPrice}</span>
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
