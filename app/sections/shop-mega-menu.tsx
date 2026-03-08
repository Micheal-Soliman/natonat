"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, ArrowRight, ArrowUpRight } from "lucide-react";

const shopCategories = [
  {
    id: "all",
    name: "All Products",
    description: "Browse everything",
    href: "/shop",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80",
  },
  {
    id: "luggage-covers",
    name: "Luggage Covers",
    description: "Protective stretchy covers",
    href: "/shop?category=luggage-covers",
    image: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=400&q=80",
  },
  {
    id: "passport-wallets",
    name: "Passport Wallets",
    description: "RFID-blocking organizers",
    href: "/shop?category=passport-wallets",
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&q=80",
  },
  {
    id: "travel-sets",
    name: "Travel Sets",
    description: "Curated bundles",
    href: "/shop?category=travel-sets",
    image: "https://images.unsplash.com/photo-1504198458649-3128b932f49e?w=400&q=80",
  },
];

interface ShopMegaMenuProps {
  scrolled: boolean;
}

export function ShopMegaMenu({ scrolled }: ShopMegaMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "all";

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
    setIsHovered(true);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
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
        className={`relative px-5 py-2 text-sm font-medium transition-all duration-300 rounded-full flex items-center gap-1.5 cursor-pointer ${
          isActive("/shop")
            ? scrolled 
              ? "text-white" 
              : "text-[#0F1A26]"
            : scrolled 
              ? "text-white/60 hover:text-white" 
              : "text-[#0F1A26]/60 hover:text-[#0F1A26]"
        }`}
      >
        Shop
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} 
        />
        {isActive("/shop") && (
          <span className={`absolute inset-0 rounded-full -z-10 transition-all duration-300 ${
            scrolled ? "bg-white/10" : "bg-[#0F1A26]/10"
          }`} />
        )}
      </button>

      {/* Mega Menu Dropdown - Wide Horizontal Layout */}
      <div 
        className={`absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[1000px] max-w-[calc(100vw-2rem)] mx-4 transition-all duration-300 z-[100] ${
          isOpen 
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
                  Collections
                </p>
                <h3 className={`text-lg font-medium mt-0.5 ${scrolled ? 'text-white' : 'text-[#0F1A26]'}`}>Shop by Category</h3>
              </div>
              <span className={`text-sm font-medium ${scrolled ? 'text-white/30' : 'text-[#0F1A26]/30'}`}>{shopCategories.length - 1} categories</span>
            </div>
          </div>

          {/* Categories - Horizontal Row */}
          <div className={`p-4 ${scrolled ? 'bg-[#0F1A26]/50' : 'bg-[#FAFAF8]'}`}>
            <div className="grid grid-cols-4 gap-3">
              {shopCategories.map((category, index) => (
                <Link
                  key={category.id}
                  href={category.href}
                  className={`group relative flex flex-col overflow-hidden rounded-xl transition-all duration-500 ${
                    isActive(category.href) && category.id !== "all"
                      ? "ring-2 ring-[#EEBC3F]"
                      : "hover:shadow-lg hover:shadow-[#0F1A26]/5"
                  }`}
                  style={{ 
                    transitionDelay: isOpen ? `${index * 75}ms` : "0ms"
                  }}
                >
                  {/* Image Container */}
                  <div className="relative h-50 overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
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
                    <h4 className={`font-semibold text-sm transition-colors duration-300 ${
                      isActive(category.href) && category.id !== "all" 
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
                  <span className={`font-semibold text-sm ${scrolled ? 'text-white' : 'text-[#0F1A26]'}`}>Browse All Products</span>
                </div>
              </div>
              <div className={`flex items-center gap-2 transition-colors ${scrolled ? 'text-white/30 group-hover:text-[#EEBC3F]' : 'text-[#0F1A26]/30 group-hover:text-[#EEBC3F]'}`}>
                <span className="text-xs font-medium">View</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
