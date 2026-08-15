"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Link } from "@/i18n/routing";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  Search,
  ArrowRight,
  Heart,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useCart } from "@/app/lib/cart-context";
import { useWishlist } from "@/app/lib/wishlist-context";
import {
  LocaleSwitcher,
  LocaleSwitcherMobile,
} from "@/app/components/locale-switcher";
import { useCatalogProducts } from "@/app/lib/catalog-context";
import { useSiteSettings } from "@/app/lib/site-settings-context";

const ShopMegaMenu = dynamic(
  () => import("./shop-mega-menu").then((mod) => mod.ShopMegaMenu),
  {
    ssr: false,
    loading: () => null,
  },
);

export function Navigation() {
  const t = useTranslations("navigation");
  const products = useCatalogProducts();
  const { discountAnnouncements } = useSiteSettings();
  const locale = useLocale();
  const { totalItems, openCart } = useCart();
  const { totalItems: wishlistTotal } = useWishlist();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isDesktopNav, setIsDesktopNav] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const scrolledRef = useRef(false);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const updateDesktopNav = () => setIsDesktopNav(media.matches);

    updateDesktopNav();
    media.addEventListener("change", updateDesktopNav);
    return () => media.removeEventListener("change", updateDesktopNav);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();

    return products
      .filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(query);
        const typeMatch = p.type.toLowerCase().includes(query);
        const categoryMatch = Array.isArray(p.category)
          ? p.category.some((c) => c.toLowerCase().includes(query))
          : p.category.toLowerCase().includes(query);

        return nameMatch || typeMatch || categoryMatch;
      })
      .slice(0, 5);
  }, [products, searchQuery]);

  useEffect(() => {
    const handleScroll = () => {
      const nextScrolled = window.scrollY > 50;
      if (scrolledRef.current === nextScrolled) return;

      scrolledRef.current = nextScrolled;
      setScrolled(nextScrolled);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileShopOpen(false);
  };

  const submitSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
      closeMobileMenu();
    }
  };

  const isShopSectionActive =
    pathname === "/shop" || pathname?.startsWith("/shop/");

  const isActive = (href: string) => {
    if (href.includes("?")) {
      const [basePath, queryString] = href.split("?");

      if (pathname !== basePath) return false;

      const hrefParams = new URLSearchParams(queryString);

      for (const [key, value] of hrefParams.entries()) {
        if (searchParams.get(key) !== value) return false;
      }

      return true;
    }

    if (href === "/shop") {
      return pathname === "/shop" && searchParams.toString() === "";
    }

    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const shopCategories = [
    {
      id: "luggage-covers",
      name: t("luggageCovers"),
      description: t("luggageCoversDesc"),
      href: "/shop?category=luggage-covers",
      image: "/Octopus/Accord/1.jpg",
    },
    {
      id: "passport-wallets",
      name: t("passportWallets"),
      description: t("passportWalletsDesc"),
      href: "/shop?category=passport-wallets",
      image: "/passport%20wallet/Cognac%20brown/1.png",
    },
    {
      id: "packonat",
      name: t("packOnat"),
      description: t("packOnatDesc"),
      href: "/shop?category=packonat",
      image: "/packOnat/Black/1.png",
    },
  ];

  const otherNavLinks = [
    { href: "/shop?sort=best-sellers", label: t("bestSellers") },
    { href: "/how-it-works", label: t("howItWorks") },
    { href: "/about", label: t("about") },
    { href: "/faqs", label: t("faqs") },
    { href: "/contact", label: t("contact") },
  ];
  const announcementItems = useMemo(
    () => {
      const repeatedAnnouncements: typeof discountAnnouncements = [];
      discountAnnouncements.forEach((announcement) => {
        repeatedAnnouncements.push(announcement, announcement);
      });
      return repeatedAnnouncements;
    },
    [discountAnnouncements],
  );
  const hasDiscountAnnouncement = discountAnnouncements.length > 0;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[80] transition-all duration-700 ease-out ${
        hasDiscountAnnouncement ? "py-2" : scrolled ? "py-3" : "py-6"
        }`}
    >
      {hasDiscountAnnouncement && (
        <div className="mx-4 mb-2 overflow-hidden rounded-full border border-[#EEBC3F]/25 bg-[#0a0f14]/95 py-2 text-[#EEBC3F] shadow-lg shadow-black/10 backdrop-blur-xl sm:mx-6 lg:mx-8">
          <div className="animate-marquee whitespace-nowrap">
            {announcementItems.map((announcement, index) => (
              <Link
                key={`${announcement._id || announcement.code}-${index}`}
                href={announcement.href}
                className="inline-flex items-center gap-3 px-6 text-[10px] font-black uppercase tracking-[0.16em] transition hover:text-white sm:px-8 sm:text-[11px] sm:tracking-[0.18em]"
              >
                <span>{announcement.text}</span>
                <span className="rounded-full border border-[#EEBC3F]/40 px-2 py-0.5 text-[9px] sm:text-[10px]">
                  {announcement.code}
                </span>
                <span className="text-white/25">|</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      <nav
        className={`mx-4 sm:mx-6 lg:mx-8 transition-all duration-700 ease-out ${scrolled
          ? "bg-[#0a0f14]/95 backdrop-blur-xl rounded-full shadow-2xl shadow-black/20 border border-white/10"
          : "bg-white/80 backdrop-blur-md rounded-full border border-white/20"
          }`}
      >
        <div
          className={`flex items-center justify-between transition-all duration-700 ${
            hasDiscountAnnouncement || scrolled ? "h-14 px-6" : "h-16 px-8"
            }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src={scrolled ? "/logo-after.png" : "/logo-before.png"}
              width={120}
              height={32}
              alt="logo"
              className="object-contain transition-all duration-500 w-auto h-6 md:h-8"
              priority={false}
              loading="lazy"
              quality={70}
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {isDesktopNav && <ShopMegaMenu scrolled={scrolled} />}

            {otherNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-5 py-2 text-sm font-medium transition-all duration-300 rounded-full ${isActive(link.href)
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
                  <span
                    className={`absolute inset-0 rounded-full -z-10 transition-all duration-300 ${scrolled ? "bg-white/10" : "bg-[#0F1A26]/10"
                      }`}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <div ref={searchRef} className="relative flex items-center">
              {searchOpen ? (
                <div className="relative">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitSearch();
                    }}
                    className="flex items-center"
                  >
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      autoFocus
                      className={`h-10 px-4 rounded-full text-sm outline-none transition-all duration-300 w-64 ${scrolled
                        ? "bg-white/10 text-white placeholder-white/50"
                        : "bg-[#0F1A26]/10 text-[#0F1A26] placeholder-[#0F1A26]/50"
                        }`}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery("");
                      }}
                      className={`ml-2 rounded-full w-8 h-8 flex items-center justify-center transition-colors ${scrolled
                        ? "text-white/60 hover:text-white hover:bg-white/10"
                        : "text-[#0F1A26]/60 hover:text-[#0F1A26] hover:bg-[#0F1A26]/10"
                        }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </form>

                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-[#0F1A26]/10 overflow-hidden z-50">
                      {searchResults.map((product) => (
                        <Link
                          key={product.id}
                          href={`/product/${product.slug}`}
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery("");
                          }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-[#F1EBE3] transition-colors"
                        >
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#F1EBE3]">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                              loading="lazy"
                              quality={40}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-[#0F1A26] font-medium text-sm truncate">
                              {product.name}
                            </p>
                            <p className="text-[#0F1A26]/50 text-xs">
                              {product.type}
                            </p>
                          </div>

                          {product.dynamicPricing ? (
                            <span className="text-[#EEBC3F] font-bold text-xs">
                              Dynamic
                            </span>
                          ) : (
                            <span className="text-[#EEBC3F] font-bold text-sm">
                              EGP {product.price}
                            </span>
                          )}
                        </Link>
                      ))}

                      <button
                        onClick={submitSearch}
                        className="w-full px-4 py-3 bg-[#F1EBE3] text-[#0F1A26] font-medium text-sm hover:bg-[#EEBC3F]/20 transition-colors flex items-center justify-center gap-2"
                      >
                        View all results
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search"
                  className={`rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${scrolled
                    ? "w-10 h-10 text-white/60 hover:text-white hover:bg-white/10"
                    : "w-10 h-10 text-[#0F1A26]/60 hover:text-[#0F1A26] hover:bg-[#0F1A26]/10"
                    }`}
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            <LocaleSwitcher scrolled={scrolled} />

            <Link
              href="/wishlist"
              className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${scrolled
                ? "text-white/70 hover:text-white hover:bg-white/15"
                : "text-[#0F1A26]/70 hover:text-[#0F1A26] hover:bg-[#0F1A26]/15"
                } ${pathname === "/wishlist"
                  ? scrolled
                    ? "bg-white/10 text-white"
                    : "bg-[#0F1A26]/10 text-[#0F1A26]"
                  : ""
                }`}
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />

              {mounted && wishlistTotal > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {wishlistTotal}
                </span>
              )}
            </Link>

            <button
              onClick={openCart}
              aria-label="Open cart"
              className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${scrolled
                ? "text-white/70 hover:text-white hover:bg-white/15"
                : "text-[#0F1A26]/70 hover:text-[#0F1A26] hover:bg-[#0F1A26]/15"
                }`}
            >
              <ShoppingBag className="w-5 h-5" />

              {mounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EEBC3F] text-[#0F1A26] text-xs font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            <Link href="/shop">
              <Button className="bg-[#EEBC3F] text-[#0a0f14] hover:bg-white rounded-full px-6 h-11 text-sm font-bold transition-all duration-300 hover:shadow-lg hover:shadow-[#EEBC3F]/30 hover:scale-105">
                {t("shopNow")}
              </Button>
            </Link>
          </div>

          {/* Mobile Buttons */}
          <div className="md:hidden flex items-center gap-2 sm:gap-3">
            <Link
              href="/wishlist"
              className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${scrolled
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-[#0F1A26]/10 text-[#0F1A26] hover:bg-[#0F1A26]/20"
                } ${pathname === "/wishlist"
                  ? "bg-[#EEBC3F] text-[#0F1A26]"
                  : ""
                }`}
              aria-label="Wishlist"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />

              {mounted && wishlistTotal > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center">
                  {wishlistTotal}
                </span>
              )}
            </Link>

            <button
              onClick={() => {
                openCart();
                closeMobileMenu();
              }}
              aria-label="Open cart"
              className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${scrolled
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-[#0F1A26]/10 text-[#0F1A26] hover:bg-[#0F1A26]/20"
                }`}
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />

              {mounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#EEBC3F] text-[#0F1A26] text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${scrolled
                ? "bg-white/10 text-white"
                : "bg-[#0F1A26]/10 text-[#0F1A26]"
                }`}
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-4 right-4 mt-3 bg-[#0a0f14]/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/10 animate-in slide-in-from-top-2 duration-300 z-[70]">
            <div
              className="flex flex-col gap-2"
              dir={locale === "ar" ? "rtl" : "ltr"}
            >
              {/* Mobile Search */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitSearch();
                }}
                className="relative"
              >
                <Search
                  className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 ${locale === "ar" ? "right-4" : "left-4"
                    }`}
                />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className={`w-full h-12 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/40 text-sm outline-none ${locale === "ar"
                    ? "pr-11 pl-4 text-right"
                    : "pl-11 pr-4 text-left"
                    }`}
                />
              </form>

              {/* Mobile Search Results */}
              {searchResults.length > 0 && (
                <div className="rounded-xl overflow-hidden border border-white/10 bg-white/5">
                  {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.slug}`}
                      onClick={() => {
                        setSearchQuery("");
                        closeMobileMenu();
                      }}
                      className="flex items-center gap-3 px-3 py-3 hover:bg-white/10 transition-colors"
                    >
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-[#F1EBE3] flex-shrink-0">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="44px"
                          className="object-cover"
                          loading="lazy"
                          quality={40}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">
                          {product.name}
                        </p>
                        <p className="text-white/45 text-xs truncate">
                          {product.type}
                        </p>
                      </div>

                      {product.dynamicPricing ? (
                        <span className="text-[#EEBC3F] font-bold text-xs">
                          Dynamic
                        </span>
                      ) : (
                        <span className="text-[#EEBC3F] font-bold text-xs">
                          EGP {product.price}
                        </span>
                      )}
                    </Link>
                  ))}

                  <button
                    onClick={submitSearch}
                    className="w-full px-4 py-3 bg-[#EEBC3F]/15 text-[#EEBC3F] font-medium text-sm hover:bg-[#EEBC3F]/25 transition-colors flex items-center justify-center gap-2"
                  >
                    View all results
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Locale Switcher */}
              <LocaleSwitcherMobile />

              {/* Shop Dropdown Toggle */}
              <button
                onClick={() => setMobileShopOpen(!mobileShopOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${isShopSectionActive
                  ? "bg-[#EEBC3F]/20 text-[#EEBC3F]"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
              >
                <span className={locale === "ar" ? "text-right" : "text-left"}>
                  {t("shop")}
                </span>

                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${mobileShopOpen ? "rotate-180" : ""
                    }`}
                />
              </button>

              {/* Shop Categories Dropdown */}
              {mobileShopOpen && (
                <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                  {shopCategories.map((category) => (
                    <Link
                      key={category.id}
                      href={category.href}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ms-4 ${isActive(category.href)
                        ? "text-[#EEBC3F] bg-[#EEBC3F]/10"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                        }`}
                      onClick={closeMobileMenu}
                    >
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#F1EBE3] flex-shrink-0">
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                          loading="lazy"
                          quality={35}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium truncate ${locale === "ar" ? "text-right" : "text-left"
                            }`}
                        >
                          {category.name}
                        </p>

                        <p
                          className={`text-xs text-white/35 truncate ${locale === "ar" ? "text-right" : "text-left"
                            }`}
                        >
                          {category.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Other Links */}
              {otherNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${locale === "ar" ? "text-right" : "text-left"
                    } ${isActive(link.href)
                      ? "bg-[#EEBC3F]/20 text-[#EEBC3F]"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile CTA */}
              <Link href="/shop" onClick={closeMobileMenu}>
                <Button className="mt-3 bg-[#EEBC3F] text-[#0a0f14] hover:bg-[#F5D47A] rounded-xl h-12 font-bold w-full">
                  {t("shopNow")}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
