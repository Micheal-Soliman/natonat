"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { products } from "@/lib/products";
import { useCart } from "@/app/lib/cart-context";
import { SizeModal } from "@/app/components/size-modal";

// Filter best seller products from lib/products
const bestSellers = products.filter(p => p.tag === "Best Seller" || p.tag === "New").slice(0, 6);

export function BestSellers() {
  const { addToCart } = useCart();
  const [sizeModalOpen, setSizeModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<typeof bestSellers[0] | null>(null);
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
    <section ref={ref} className="py-24 bg-[#0F1A26] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-end justify-between mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div>
            <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.2em] uppercase">Curated</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white mt-3 tracking-tight">
              Best Sellers
            </h2>
            <p className="text-white/50 mt-2 font-light">
              Our most loved travel accessories
            </p>
          </div>
          <Button
            variant="outline"
            className="hidden md:flex border-white/20 text-white hover:bg-white hover:text-[#0F1A26] rounded-full px-6 h-11 transition-all duration-300"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className={`w-full transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <CarouselContent className="-ml-5">
            {bestSellers.map((product, index) => (
              <CarouselItem
                key={product.id}
                className="pl-5 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
              >
                <Link href={`/product/${product.id}`} className="group cursor-pointer block">
                  {/* Product Image */}
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4 border border-white/5">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    
                    {product.tag && (
                      <span className={`absolute top-4 left-4 z-10 text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-full ${
                        product.tag === 'Best Seller' ? 'bg-[#EEBC3F] text-[#0F1A26]' :
                        product.tag === 'New' ? 'bg-white text-[#0F1A26]' :
                        product.tag === 'Limited' ? 'bg-[#4B1F1F] text-[#F1EBE3]' :
                        'bg-[#EEBC3F]/20 text-[#EEBC3F] border border-[#EEBC3F]/30'
                      }`}>
                        {product.tag}
                      </span>
                    )}
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                      <button 
                        className="w-14 h-14 bg-[#EEBC3F] rounded-full flex items-center justify-center transform scale-0 group-hover:scale-100 transition-all duration-500 hover:scale-110 hover:shadow-xl hover:shadow-[#EEBC3F]/30"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (product.category === "luggage-covers") {
                            setSelectedProduct(product);
                            setSizeModalOpen(true);
                          } else {
                            addToCart({
                              id: product.id,
                              name: product.name,
                              type: product.type,
                              price: product.price,
                              originalPrice: product.originalPrice,
                              image: product.image,
                              quantity: 1,
                            });
                          }
                        }}
                      >
                        <ShoppingBag className="w-6 h-6 text-[#0F1A26]" />
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[#EEBC3F]/80 text-[10px] font-semibold tracking-[0.15em] uppercase">
                        {product.type}
                      </span>
                      {product.size && (
                        <>
                          <span className="text-white/20">·</span>
                          <span className="text-white/40 text-[10px]">Size {product.size}</span>
                        </>
                      )}
                    </div>
                    <h3 className="text-white font-medium text-lg mb-2 tracking-tight group-hover:text-[#EEBC3F] transition-colors duration-300">
                      {product.name}
                    </h3>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Custom navigation */}
          <div className="hidden md:flex items-center gap-3 mt-8">
            <CarouselPrevious className="static translate-y-0 w-12 h-12 rounded-full bg-white/5 border-white/10 text-white hover:bg-white hover:text-[#0F1A26] transition-all duration-300" />
            <CarouselNext className="static translate-y-0 w-12 h-12 rounded-full bg-white/5 border-white/10 text-white hover:bg-white hover:text-[#0F1A26] transition-all duration-300" />
          </div>
        </Carousel>

        {/* Mobile CTA */}
        <div className="mt-8 text-center md:hidden">
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white hover:text-[#0F1A26] rounded-full"
          >
            View All Products
          </Button>
        </div>
      </div>
      {/* Size Selection Modal */}
      <SizeModal
        isOpen={sizeModalOpen}
        onClose={() => {
          setSizeModalOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={(size) => {
          if (selectedProduct) {
            addToCart({
              id: selectedProduct.id,
              name: selectedProduct.name,
              type: selectedProduct.type,
              price: selectedProduct.price,
              originalPrice: selectedProduct.originalPrice,
              image: selectedProduct.image,
              size: size,
              quantity: 1,
            });
          }
          setSizeModalOpen(false);
          setSelectedProduct(null);
        }}
        productName={selectedProduct?.name || ""}
      />
    </section>
  );
}
