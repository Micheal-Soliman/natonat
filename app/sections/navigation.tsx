"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShopMegaMenu } from "./shop-mega-menu";
import { useCart } from "@/app/lib/cart-context";

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
    href: "/shop/luggage-covers",
    image: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=400&q=80",
  },
  {
    id: "passport-wallets",
    name: "Passport Wallets",
    description: "RFID-blocking organizers",
    href: "/shop/passport-wallets",
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&q=80",
  },
  {
    id: "travel-sets",
    name: "Travel Sets",
    description: "Curated bundles",
    href: "/shop/travel-sets",
    image: "https://images.unsplash.com/photo-1504198458649-3128b932f49e?w=400&q=80",
  },
];

export function Navigation() {
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  const otherNavLinks = [
    { href: "/how-it-works", label: "Size Guide" },
    { href: "/about", label: "About" },
    { href: "/faqs", label: "FAQs" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-out ${
        scrolled 
          ? "py-3" 
          : "py-6"
      }`}
    >
      <nav 
        className={`mx-4 sm:mx-6 lg:mx-8 transition-all duration-700 ease-out ${
          scrolled 
            ? "bg-[#0a0f14]/95 backdrop-blur-xl rounded-full shadow-2xl shadow-black/20 border border-white/10" 
            : "bg-white/80 backdrop-blur-md rounded-full border border-white/20"
        }`}
      >
        <div className={`flex items-center justify-between transition-all duration-700 ${scrolled ? "h-14 px-6" : "h-16 px-8"}`}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <img 
              src={scrolled ? '/logo-after.png' : '/logo-before.png'} 
              width={200} 
              height={32} 
              alt="logo" 
              className="object-contain transition-all duration-500" 
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {/* Shop Mega Menu */}
            <ShopMegaMenu scrolled={scrolled} />

            {otherNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-5 py-2 text-sm font-medium transition-all duration-300 rounded-full ${
                  isActive(link.href)
                    ? scrolled 
                      ? "text-white" 
                      : "text-[#0F1A26]"
                    : scrolled 
                      ? "text-white/60 hover:text-white" 
                      : "text-[#0F1A26]/60 hover:text-[#0F1A26]"
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className={`absolute inset-0 rounded-full -z-10 transition-all duration-300 ${
                    scrolled ? "bg-white/10" : "bg-[#0F1A26]/10"
                  }`} />
                )}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/cart" className="relative">
              <button className={`rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
                scrolled 
                  ? "w-10 h-10 text-white/60 hover:text-white hover:bg-white/10" 
                  : "w-10 h-10 text-[#0F1A26]/60 hover:text-[#0F1A26] hover:bg-[#0F1A26]/10"
              }`}>
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EEBC3F] text-[#0F1A26] text-xs font-bold rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </Link>
            <Link href="/shop">
              <Button 
                className="bg-[#EEBC3F] text-[#0a0f14] hover:bg-white rounded-full px-6 h-11 text-sm font-bold transition-all duration-300 hover:shadow-lg hover:shadow-[#EEBC3F]/30 hover:scale-105"
              >
                Shop Now
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-3">
            <Link href="/cart" className="relative" onClick={() => setMobileMenuOpen(false)}>
              <button className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer ${
                scrolled ? "text-[#0F1A26]" : "text-[#0F1A26]/70 hover:text-[#0F1A26]"
              }`}>
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EEBC3F] text-[#0F1A26] text-xs font-bold rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer ${
                scrolled 
                  ? "bg-[#0F1A26]/10 text-[#0F1A26]" 
                  : "bg-[#0F1A26]/10 text-[#0F1A26]"
              }`}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-4 right-4 mt-3 bg-[#0a0f14]/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/10 animate-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col gap-1">
              {/* Shop Dropdown Toggle */}
              <button
                onClick={() => setMobileShopOpen(!mobileShopOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  isActive("/shop")
                    ? "bg-[#EEBC3F]/20 text-[#EEBC3F]"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>Shop</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${mobileShopOpen ? "rotate-180" : ""}`} />
              </button>
              
              {/* Shop Categories Dropdown */}
              {mobileShopOpen && (
                <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                  <Link
                    href="/shop"
                    className={`block px-4 py-2 rounded-xl text-sm transition-colors ml-4 ${
                      pathname === "/shop"
                        ? "text-[#EEBC3F] bg-[#EEBC3F]/10"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                    onClick={() => {
                      setMobileShopOpen(false);
                      setMobileMenuOpen(false);
                    }}
                  >
                    All Products
                  </Link>
                  {shopCategories.filter(c => c.id !== "all").map((category) => (
                    <Link
                      key={category.id}
                      href={category.href}
                      className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-colors ml-4 ${
                        isActive(category.href)
                          ? "text-[#EEBC3F] bg-[#EEBC3F]/10"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                      onClick={() => {
                        setMobileShopOpen(false);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <img src={category.image} alt={category.name} className="w-8 h-8 rounded-lg object-cover" />
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
              {otherNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "bg-[#EEBC3F]/20 text-[#EEBC3F]"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>
                <Button className="mt-3 bg-[#EEBC3F] text-[#0a0f14] hover:bg-[#F5D47A] rounded-xl h-12 font-bold w-full">
                  Shop Now
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
