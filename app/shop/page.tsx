"use client";

import { useCart } from "@/app/lib/cart-context";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Filter, X } from "lucide-react";
import { products, categories, sizes, themes } from "@/lib/products";
import { SizeModal } from "@/app/components/size-modal";
import { Loading } from "@/app/components/loading";
import { SwipeableProductImage } from "@/app/components/swipeable-product-image";

function ShopContent() {
  const { addToCart } = useCart();
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("category") || "all";
  const sizeFromUrl = searchParams.get("size");
  const sortFromUrl = searchParams.get("sort");
  const [activeCategory, setActiveCategory] = useState(categoryFromUrl);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(sizeFromUrl ? [sizeFromUrl] : []);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [showBestSellers, setShowBestSellers] = useState(sortFromUrl === "best-sellers");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hideNav, setHideNav] = useState(false);
  const [sizeModalOpen, setSizeModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const categoryTabsRef = useRef<HTMLDivElement>(null);

  // Update activeCategory when URL changes
  useEffect(() => {
    setActiveCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  // Update showBestSellers when URL changes
  useEffect(() => {
    setShowBestSellers(sortFromUrl === "best-sellers");
  }, [sortFromUrl]);

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

  // Hide navbar when category tabs become sticky
  useEffect(() => {
    const handleScroll = () => {
      if (categoryTabsRef.current) {
        const rect = categoryTabsRef.current.getBoundingClientRect();
        setHideNav(rect.top <= 0);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredProducts = products.filter((product) => {
    if (showBestSellers && product.tag !== "Best Seller") return false;
    if (activeCategory !== "all" && product.category !== activeCategory) return false;
    if (selectedSizes.length > 0 && product.size && !selectedSizes.includes(product.size)) return false;
    if (selectedThemes.length > 0 && !selectedThemes.includes(product.theme)) return false;
    return true;
  });

  const toggleSize = (sizeId: string) => {
    setSelectedSizes((prev) =>
      prev.includes(sizeId) ? prev.filter((s) => s !== sizeId) : [...prev, sizeId]
    );
  };

  const toggleBestSellers = () => {
    setShowBestSellers((prev) => !prev);
  };

  const toggleTheme = (themeId: string) => {
    setSelectedThemes((prev) =>
      prev.includes(themeId) ? prev.filter((t) => t !== themeId) : [...prev, themeId]
    );
  };

  const clearFilters = () => {
    setSelectedSizes([]);
    setSelectedThemes([]);
    setShowBestSellers(false);
  };

  const activeFiltersCount = selectedSizes.length + selectedThemes.length + (showBestSellers ? 1 : 0);

  // Dynamic header based on category
  const getHeaderContent = () => {
    switch (activeCategory) {
      case "luggage-covers":
        return {
          title: <>Luggage <span className="text-[#EEBC3F]">Covers</span></>,
          subtitle: "Stretchy, washable covers that protect your suitcase"
        };
      case "passport-wallets":
        return {
          title: <>Passport <span className="text-[#EEBC3F]">Wallets</span></>,
          subtitle: "Premium leather with RFID protection for secure travel"
        };
      case "bundles":
        return {
          title: <>Bundle <span className="text-[#EEBC3F]">Deals</span></>,
          subtitle: "Curated bundles at better prices. Save up to 30%."
        };
      default:
        return {
          title: <>The <span className="text-[#EEBC3F]">Shop</span></>,
          subtitle: "Premium travel accessories for the modern traveler"
        };
    }
  };

  const headerContent = getHeaderContent();

  const handleAddToCart = (e: React.MouseEvent, product: typeof products[0]) => {
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
  };

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${hideNav ? '-translate-y-full' : 'translate-y-0'}`}>
        <Navigation />
      </div>
      <main className="min-h-screen bg-[#F1EBE3]">
        {/* Header - Clean */}
        <div className="bg-[#0F1A26] pt-32 pb-16 md:pt-40 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight">
              {headerContent.title}
            </h1>
            <p className="text-white/50 mt-4 max-w-xl mx-auto font-light text-lg">
              {headerContent.subtitle}
            </p>
          </div>
        </div>

        {/* Category Tabs - Clean */}
        <div ref={categoryTabsRef} className="bg-white border-b border-[#0F1A26]/5 sticky top-0 z-[60]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto gap-2 py-4 no-scrollbar">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={cat.id === "all" ? "/shop" : `/shop?category=${cat.id}`}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                    activeCategory === cat.id
                      ? "bg-[#0F1A26] text-white"
                      : "bg-[#F8F6F3] text-[#0F1A26]/70 hover:text-[#0F1A26]"
                  }`}
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex gap-8">
            {/* Sidebar Filters - Desktop - Clean */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-28">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-[#0F1A26]">Filters</h2>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-[#EEBC3F] hover:text-[#0F1A26] transition-colors font-medium"
                    >
                      Clear {activeFiltersCount}
                    </button>
                  )}
                </div>

                {/* Best Seller Filter - Desktop */}
                <div className="mb-8">
                  <h3 className="text-xs font-semibold text-[#0F1A26] mb-3 tracking-wider uppercase">Best Sellers</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        showBestSellers 
                          ? "bg-[#EEBC3F] border-[#EEBC3F]" 
                          : "border-[#0F1A26]/20"
                      }`}
                      onClick={toggleBestSellers}
                    >
                      {showBestSellers && (
                        <svg className="w-3 h-3 text-[#0F1A26]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${showBestSellers ? "text-[#0F1A26] font-medium" : "text-[#0F1A26]/60"}`}>
                      Show Best Sellers Only
                    </span>
                  </label>
                </div>

                {/* Size Filter - Clean */}
                {(activeCategory === "all" || activeCategory === "luggage-covers") && (
                  <div className="mb-8">
                    <h3 className="text-xs font-semibold text-[#0F1A26] mb-3 tracking-wider uppercase">Size</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {sizes.map((size) => (
                        <button
                          key={size.id}
                          onClick={() => toggleSize(size.id)}
                          className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                            selectedSizes.includes(size.id)
                              ? "bg-[#0F1A26] text-white"
                              : "bg-[#0F1A26]/5 text-[#0F1A26]/60 hover:bg-[#0F1A26]/10"
                          }`}
                        >
                          {size.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[#0F1A26]/40 text-xs mt-2">Height in inches</p>
                  </div>
                )}

                {/* Theme Filter - Clean */}
                <div className="mb-8">
                  <h3 className="text-xs font-semibold text-[#0F1A26] mb-3 tracking-wider uppercase">Theme</h3>
                  <div className="space-y-2">
                    {themes.map((theme) => (
                      <label 
                        key={theme.id} 
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            selectedThemes.includes(theme.id) 
                              ? "bg-[#EEBC3F] border-[#EEBC3F]" 
                              : "border-[#0F1A26]/20"
                          }`}
                          onClick={() => toggleTheme(theme.id)}
                        >
                          {selectedThemes.includes(theme.id) && (
                            <svg className="w-3 h-3 text-[#0F1A26]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-sm ${selectedThemes.includes(theme.id) ? "text-[#0F1A26] font-medium" : "text-[#0F1A26]/60"}`}>
                          {theme.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Size Guide Card - Clean */}
                <div className="bg-[#0F1A26] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-2">Size Guide</h3>
                  <div className="space-y-1.5 text-xs">
                    {sizes.map((size) => (
                      <div key={size.id} className="flex justify-between text-white/60">
                        <span>{size.label}</span>
                        <span>{size.range}"</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Product Grid - Clean */}
            <div className="flex-1">
              {/* Mobile Filter Button - Clean */}
              <div className="lg:hidden mb-6">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="flex items-center gap-2 px-4 py-3 bg-white border border-[#0F1A26]/10 rounded-full text-[#0F1A26]"
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-[#EEBC3F] text-[#0F1A26] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ml-2">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Results count - Clean */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-[#0F1A26]/50 text-sm">
                  Showing <span className="text-[#0F1A26] font-semibold">{filteredProducts.length}</span> products
                </p>
              </div>

              {/* Grid - Clean */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                {filteredProducts.map((product, index) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className={`group transition-all duration-500 hover:-translate-y-2 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <SwipeableProductImage 
                      product={product}
                      onAddToCart={handleAddToCart}
                    />

                    {/* Product Info - Clean */}
                    <div>
                      <span className="text-[#EEBC3F] text-[10px] font-semibold tracking-wider uppercase">
                        {product.type}
                      </span>
                      <h3 className="text-[#0F1A26] font-medium text-sm mt-1 mb-1 group-hover:text-[#EEBC3F] transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[#0F1A26] font-bold text-lg">EGP {product.price}</span>
                          <span className="text-[#0F1A26]/50 text-sm line-through font-medium">EGP {product.originalPrice}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-[#0F1A26]/50 mb-3">No products found</p>
                  <button 
                    onClick={clearFilters} 
                    className="text-[#EEBC3F] hover:text-[#0F1A26] font-medium transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Filters Drawer - Clean */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/30" onClick={() => setMobileFiltersOpen(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-[#0F1A26]">Filters</h2>
                <button onClick={() => setMobileFiltersOpen(false)} className="w-8 h-8 rounded-full bg-[#0F1A26]/5 flex items-center justify-center">
                  <X className="w-4 h-4 text-[#0F1A26]" />
                </button>
              </div>

              {/* Mobile Best Seller Filter */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-[#0F1A26] mb-3 tracking-wider uppercase">Best Sellers</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      showBestSellers ? "bg-[#EEBC3F] border-[#EEBC3F]" : "border-[#0F1A26]/20"
                    }`}
                    onClick={toggleBestSellers}
                  >
                    {showBestSellers && (
                      <svg className="w-3 h-3 text-[#0F1A26]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm ${showBestSellers ? "text-[#0F1A26] font-medium" : "text-[#0F1A26]/60"}`}>
                    Show Best Sellers Only
                  </span>
                </label>
              </div>

              {/* Mobile Size Filter - Clean */}
              {(activeCategory === "all" || activeCategory === "luggage-covers") && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-[#0F1A26] mb-3 tracking-wider uppercase">Size</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => toggleSize(size.id)}
                        className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                          selectedSizes.includes(size.id)
                            ? "bg-[#0F1A26] text-white"
                            : "bg-[#0F1A26]/5 text-[#0F1A26]/60"
                        }`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Theme Filter - Clean */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-[#0F1A26] mb-3 tracking-wider uppercase">Theme</h3>
                <div className="space-y-2">
                  {themes.map((theme) => (
                    <label key={theme.id} className="flex items-center gap-2 cursor-pointer">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          selectedThemes.includes(theme.id) ? "bg-[#EEBC3F] border-[#EEBC3F]" : "border-[#0F1A26]/20"
                        }`}
                        onClick={() => toggleTheme(theme.id)}
                      >
                        {selectedThemes.includes(theme.id) && (
                          <svg className="w-3 h-3 text-[#0F1A26]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm ${selectedThemes.includes(theme.id) ? "text-[#0F1A26] font-medium" : "text-[#0F1A26]/60"}`}>
                        {theme.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full bg-[#0F1A26] text-white rounded-full h-12 font-medium" 
                onClick={() => setMobileFiltersOpen(false)}
              >
                Show {filteredProducts.length} Products
              </Button>
            </div>
          </div>
        )}
      </main>
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

      <Footer />
    </>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ShopContent />
    </Suspense>
  );
}
