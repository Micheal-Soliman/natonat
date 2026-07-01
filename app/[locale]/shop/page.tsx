"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import { categories, genders, collections, printTypes, type Product } from "@/lib/products";
import { Loading } from "@/app/components/loading";
import { SwipeableProductImage } from "@/app/components/swipeable-product-image";
import { BundleQuickCustomizer } from "@/app/components/bundle-quick-customizer";
import { WishlistToggleButton } from "@/app/components/wishlist-toggle-button";
import { useToast } from "@/app/components/toast-provider";
import { useCatalogProducts } from "@/app/lib/catalog-context";
import { useSizeGuideSizes } from "@/app/lib/site-settings-context";
import { useCart } from "@/app/lib/cart-context";
import { getStockLabel, isProductOutOfStock, isProductSizeOutOfStock } from "@/lib/product-stock";

function ShopContent() {
  const t = useTranslations('shop');
  const toastT = useTranslations('commerceToast');
  const stockT = useTranslations('stock');
  const router = useRouter();
  const products = useCatalogProducts();
  const sizes = useSizeGuideSizes();
  const { addToCart, setBuyNowItem } = useCart();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("category") || "all";
  const sizeFromUrl = searchParams.get("size");
  const sortFromUrl = searchParams.get("sort");
  const searchFromUrl = searchParams.get("search");
  const [activeCategory, setActiveCategory] = useState(categoryFromUrl);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(sizeFromUrl ? [sizeFromUrl] : []);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectedPrintTypes, setSelectedPrintTypes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [showBestSellers, setShowBestSellers] = useState(sortFromUrl === "best-sellers");
  const [searchQuery, setSearchQuery] = useState(searchFromUrl || "");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [hideNav, setHideNav] = useState(false);
  const stockLabels = {
    inStock: stockT("inStock"),
    lowStock: stockT("lowStock"),
    outOfStock: stockT("outOfStock"),
  };
  const [currentPage, setCurrentPage] = useState(1);
  const [quickSelections, setQuickSelections] = useState<Record<number, { size?: string; color?: string }>>({});
  const PRODUCTS_PER_PAGE = 12;
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

  // Update search query when URL changes
  useEffect(() => {
    setSearchQuery(searchFromUrl || "");
  }, [searchFromUrl]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
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
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matches = 
        product.name.toLowerCase().includes(query) ||
        (Array.isArray(product.category) 
          ? product.category.some(cat => cat.toLowerCase().includes(query))
          : product.category.toLowerCase().includes(query)) ||
        product.type.toLowerCase().includes(query);
      if (!matches) return false;
    }
    if (showBestSellers && product.tag !== "Best Seller") return false;
    if (activeCategory !== "all") {
      const productCategories = Array.isArray(product.category) ? product.category : [product.category];
      if (!productCategories.includes(activeCategory)) return false;
    }
    if (selectedSizes.length > 0 && product.size && !selectedSizes.includes(product.size)) return false;
    // New filters for luggage covers only
    if (activeCategory === "luggage-covers" || activeCategory === "all") {
      if (selectedGenders.length > 0 && product.gender) {
        const productGenders = Array.isArray(product.gender) ? product.gender : [product.gender];
        // If unisex is in product genders, it should match any gender filter
        // If "unisex" filter is selected, it matches only products that have "unisex"
        const isMatch = productGenders.some(g => {
          if (selectedGenders.includes(g)) return true;
          if (g === "unisex" && (selectedGenders.includes("male") || selectedGenders.includes("female"))) return true;
          return false;
        });
        if (!isMatch) return false;
      }
      if (selectedCollections.length > 0 && product.collection && !selectedCollections.includes(product.collection)) return false;
      if (selectedPrintTypes.length > 0 && product.printType && !selectedPrintTypes.includes(product.printType)) return false;
    }
    if (selectedColors.length > 0 && (!product.color || !selectedColors.includes(product.color))) return false;
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, selectedSizes, selectedGenders, selectedCollections, selectedPrintTypes, selectedColors, showBestSellers, searchQuery]);

  const toggleSize = (sizeId: string) => {
    setSelectedSizes((prev) =>
      prev.includes(sizeId) ? prev.filter((s) => s !== sizeId) : [...prev, sizeId]
    );
  };

  const toggleBestSellers = () => {
    setShowBestSellers((prev) => !prev);
  };

  const toggleGender = (genderId: string) => {
    setSelectedGenders((prev) =>
      prev.includes(genderId) ? prev.filter((g) => g !== genderId) : [...prev, genderId]
    );
  };

  const toggleCollection = (collectionId: string) => {
    setSelectedCollections((prev) =>
      prev.includes(collectionId) ? prev.filter((c) => c !== collectionId) : [...prev, collectionId]
    );
  };

  const togglePrintType = (printTypeId: string) => {
    setSelectedPrintTypes((prev) =>
      prev.includes(printTypeId) ? prev.filter((p) => p !== printTypeId) : [...prev, printTypeId]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const clearFilters = () => {
    setSelectedSizes([]);
    setSelectedGenders([]);
    setSelectedCollections([]);
    setSelectedPrintTypes([]);
    setSelectedColors([]);
    setShowBestSellers(false);
    setCurrentPage(1);
  };

  const activeFiltersCount = selectedSizes.length + selectedGenders.length + selectedCollections.length + selectedPrintTypes.length + selectedColors.length + (showBestSellers ? 1 : 0);

  // Dynamic header based on category
  const getHeaderContent = () => {
    switch (activeCategory) {
      case "luggage-covers":
        return {
          title: <>{t('header.luggageCovers.title').split(' ')[0]} <span className="text-[#EEBC3F]">{t('header.luggageCovers.title').split(' ').slice(1).join(' ')}</span></>,
          subtitle: t('header.luggageCovers.subtitle')
        };
      case "passport-wallets":
        return {
          title: <>{t('header.passportWallets.title').split(' ')[0]} <span className="text-[#EEBC3F]">{t('header.passportWallets.title').split(' ').slice(1).join(' ')}</span></>,
          subtitle: t('header.passportWallets.subtitle')
        };
      case "packonat":
        return {
          title: <>{t('header.packOnat.title').split(' ')[0]} <span className="text-[#EEBC3F]">{t('header.packOnat.title').split(' ').slice(1).join(' ')}</span></>,
          subtitle: t('header.packOnat.subtitle')
        };
      case "bundles":
        return {
          title: <>{t('header.bundles.title').split(' ')[0]} <span className="text-[#EEBC3F]">{t('header.bundles.title').split(' ').slice(1).join(' ')}</span></>,
          subtitle: t('header.bundles.subtitle')
        };
      default:
        return {
          title: <>{t('header.default.title').split(' ')[0]} <span className="text-[#EEBC3F]">{t('header.default.title').split(' ').slice(1).join(' ')}</span></>,
          subtitle: t('header.default.subtitle')
        };
    }
  };

  const getProductCategories = (product: Product) =>
    Array.isArray(product.category) ? product.category : [product.category];

  const isBundleProduct = (product: Product) => getProductCategories(product).includes("bundles");

  const getQuickSizeOptions = (product: Product) => {
    if (product.sizePrices) {
      return sizes.filter((size) => product.sizePrices?.[size.id as keyof NonNullable<Product["sizePrices"]>]);
    }

    if (!product.size) return [];

    const selectedSize = product.size.toLowerCase();
    return sizes.filter((size) => size.id === selectedSize);
  };

  const getQuickSelection = (product: Product) => {
    const sizeOptions = getQuickSizeOptions(product);
    const colorOptions = product.colors || [];
    const savedSelection = quickSelections[product.id] || {};
    const availableSizeOptions = sizeOptions.filter((size) => !isProductSizeOutOfStock(product, size.id));
    const savedSizeIsAvailable =
      savedSelection.size && !isProductSizeOutOfStock(product, savedSelection.size);
    const defaultSize =
      (availableSizeOptions.find((size) => size.id === "m") || availableSizeOptions[0] || sizeOptions[0])?.id ||
      product.size?.toLowerCase();

    return {
      size: savedSizeIsAvailable ? savedSelection.size : defaultSize,
      color: savedSelection.color || colorOptions[0]?.id || product.color,
    };
  };

  const updateQuickSelection = (productId: number, selection: { size?: string; color?: string }) => {
    setQuickSelections((current) => ({
      ...current,
      [productId]: {
        ...current[productId],
        ...selection,
      },
    }));
  };

  const getQuickCartItem = (product: Product) => {
    const selection = getQuickSelection(product);
    const sizeKey = selection.size?.toLowerCase() as keyof NonNullable<Product["sizePrices"]>;
    const sizePrice = sizeKey && product.sizePrices?.[sizeKey];
    const colorVariant = product.colors?.find((color) => color.id === selection.color);

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      type: product.type,
      price: sizePrice?.price ?? product.price,
      originalPrice: sizePrice?.originalPrice ?? product.originalPrice,
      image: colorVariant?.image || product.image,
      size: product.sizePrices || product.size ? selection.size : undefined,
      color: colorVariant?.name || selection.color || product.color,
      quantity: 1,
    };
  };

  const getColorSwatchStyle = (colorName?: string) => {
    const normalizedColor = colorName?.toLowerCase() || "";
    const colorMap: Record<string, string> = {
      black: "#111827",
      white: "#F8FAFC",
      grey: "#9CA3AF",
      gray: "#9CA3AF",
      blue: "#2563EB",
      navy: "#1E3A8A",
      red: "#DC2626",
      green: "#16A34A",
      yellow: "#FACC15",
      gold: "#D6A62C",
      purple: "#7C3AED",
      orange: "#F97316",
      brown: "#8B5E3C",
      cognac: "#9A5A2E",
    };

    const matches = Object.entries(colorMap)
      .filter(([name]) => normalizedColor.includes(name))
      .map(([, value]) => value);

    if (matches.length >= 2) {
      return { background: `linear-gradient(135deg, ${matches[0]} 0 50%, ${matches[1]} 50% 100%)` };
    }

    if (matches.length === 1) {
      return { backgroundColor: matches[0] };
    }

    return { background: "linear-gradient(135deg, #EEBC3F, #0F1A26)" };
  };

  const handleQuickAdd = (product: Product) => {
    const selection = getQuickSelection(product);
    if (isProductOutOfStock(product) || isProductSizeOutOfStock(product, selection.size)) return;
    if (!addToCart(getQuickCartItem(product), { openCart: false })) return;
    showToast({
      title: toastT("addedToCart"),
      description: product.name,
      action: {
        label: toastT("checkout"),
        onClick: () => router.push("/checkout"),
      },
      cancel: {
        label: toastT("keepShopping"),
        onClick: () => {},
      },
    });
  };

  const handleQuickBuy = (product: Product) => {
    const selection = getQuickSelection(product);
    if (isProductOutOfStock(product) || isProductSizeOutOfStock(product, selection.size)) return;
    setBuyNowItem(getQuickCartItem(product));
    router.push("/checkout");
  };

  const headerContent = getHeaderContent();
  const categoryCopyKey =
    activeCategory === "luggage-covers" ||
    activeCategory === "passport-wallets" ||
    activeCategory === "packonat" ||
    activeCategory === "bundles"
      ? activeCategory
      : "all";

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 z-[70] transition-transform duration-300 ${hideNav ? '-translate-y-full' : 'translate-y-0'}`}>
        <Navigation />
      </div>
      <main className="min-h-screen bg-[#F1EBE3]">
        {/* Header - Clean */}
        <div className="bg-[#0F1A26] pt-32 pb-16 md:pt-40 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight">
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
            <div className="flex snap-x overflow-x-auto gap-2 py-4 no-scrollbar">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={cat.id === "all" ? "/shop" : `/shop?category=${cat.id}`}
                  className={`snap-start px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
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
                  <h2 className="font-semibold text-[#0F1A26]">{t('filters.title')}</h2>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-[#EEBC3F] hover:text-[#0F1A26] transition-colors font-medium"
                    >
                      {t('filters.clear', { count: activeFiltersCount })}
                    </button>
                  )}
                </div>

                {/* Best Seller Filter - Desktop */}
                <div className="mb-8">
                  <h3 className="text-xs font-semibold text-[#0F1A26] mb-3 tracking-wider uppercase">{t('filters.bestSellers.title')}</h3>
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
                      {t('filters.bestSellers.showOnly')}
                    </span>
                  </label>
                </div>

                {/* Size Filter - Clean */}
                {(activeCategory === "all" || activeCategory === "luggage-covers") && (
                  <div className="mb-8">
                    <h3 className="text-xs font-semibold text-[#0F1A26] mb-3 tracking-wider uppercase">{t('filters.size.title')}</h3>
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
                    <p className="text-[#0F1A26]/40 text-xs mt-2">{t('filters.size.note')}</p>
                  </div>
                )}

                {/* Gender Filter - For Luggage Covers */}
                {(activeCategory === "all" || activeCategory === "luggage-covers") && (
                  <div className="mb-8">
                    <h3 className="text-xs font-semibold text-[#0F1A26] mb-3 tracking-wider uppercase">{t('filters.gender.title')}</h3>
                    <div className="space-y-2">
                      {genders.map((gender) => (
                        <label 
                          key={gender.id} 
                          className="flex items-center gap-2 cursor-pointer group"
                          onClick={() => toggleGender(gender.id)}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                              selectedGenders.includes(gender.id)
                                ? "bg-[#EEBC3F] border-[#EEBC3F]"
                                : "border-[#0F1A26]/20 group-hover:border-[#EEBC3F]/50"
                            }`}
                          >
                            {selectedGenders.includes(gender.id) && (
                              <svg className="w-3 h-3 text-[#0F1A26]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-sm ${selectedGenders.includes(gender.id) ? "text-[#0F1A26] font-medium" : "text-[#0F1A26]/60"}`}>
                            {t(`filters.gender.${gender.id}`)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Collection Filter - For Luggage Covers */}
                {(activeCategory === "all" || activeCategory === "luggage-covers") && (
                  <div className="mb-8">
                    <h3 className="text-xs font-semibold text-[#0F1A26] mb-3 tracking-wider uppercase">{t('filters.collection.title')}</h3>
                    <div className="space-y-2">
                      {collections.map((collection) => (
                        <label 
                          key={collection.id} 
                          className="flex items-center gap-2 cursor-pointer group"
                          onClick={() => toggleCollection(collection.id)}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                              selectedCollections.includes(collection.id)
                                ? "bg-[#EEBC3F] border-[#EEBC3F]"
                                : "border-[#0F1A26]/20 group-hover:border-[#EEBC3F]/50"
                            }`}
                          >
                            {selectedCollections.includes(collection.id) && (
                              <svg className="w-3 h-3 text-[#0F1A26]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-sm ${selectedCollections.includes(collection.id) ? "text-[#0F1A26] font-medium" : "text-[#0F1A26]/60"}`}>
                            {t(`filters.collection.${collection.id}`)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Print Type Filter - For Luggage Covers */}
                {(activeCategory === "all" || activeCategory === "luggage-covers") && (
                  <div className="mb-8">
                    <h3 className="text-xs font-semibold text-[#0F1A26] mb-3 tracking-wider uppercase">{t('filters.printType.title')}</h3>
                    <div className="space-y-2">
                      {printTypes.map((printType) => (
                        <label 
                          key={printType.id} 
                          className="flex items-center gap-2 cursor-pointer group"
                          onClick={() => togglePrintType(printType.id)}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                              selectedPrintTypes.includes(printType.id)
                                ? "bg-[#EEBC3F] border-[#EEBC3F]"
                                : "border-[#0F1A26]/20 group-hover:border-[#EEBC3F]/50"
                            }`}
                          >
                            {selectedPrintTypes.includes(printType.id) && (
                              <svg className="w-3 h-3 text-[#0F1A26]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-sm ${selectedPrintTypes.includes(printType.id) ? "text-[#0F1A26] font-medium" : "text-[#0F1A26]/60"}`}>
                            {t(`filters.printType.${printType.id}`)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Filter - For All Products */}
                <div className="mb-8">
                  <h3 className="text-xs font-semibold text-[#0F1A26] mb-3 tracking-wider uppercase">{t('filters.color.title')}</h3>
                  <div className="space-y-2">
                    {/* Get unique colors from products */}
                    {Array.from(new Set(products.filter(p => p.color).map(p => p.color))).map((color) => (
                      <label 
                        key={color} 
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={() => toggleColor(color!)}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            selectedColors.includes(color!) 
                              ? "bg-[#EEBC3F] border-[#EEBC3F]" 
                              : "border-[#0F1A26]/20 group-hover:border-[#EEBC3F]/50"
                          }`}
                        >
                          {selectedColors.includes(color!) && (
                            <svg className="w-3 h-3 text-[#0F1A26]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-sm ${selectedColors.includes(color!) ? "text-[#0F1A26] font-medium" : "text-[#0F1A26]/60"}`}>
                          {color}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Size Guide Card - Clean */}
                <div className="bg-[#0F1A26] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-2">{t('filters.sizeGuide.title')}</h3>
                  <div className="space-y-1.5 text-xs">
                    {sizes.map((size) => (
                      <div key={size.id} className="flex justify-between text-white/60">
                        <span>{size.label}</span>
                        <span>{size.range}&quot;</span>
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
                  <span className="text-sm font-medium">{t('mobile.filters')}</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-[#EEBC3F] text-[#0F1A26] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ml-2">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="mb-6 rounded-2xl border border-[#0F1A26]/10 bg-white px-4 py-4 sm:px-5">
                <h2 className="text-base sm:text-lg font-bold text-[#0F1A26]">
                  {t(`categoryCopy.${categoryCopyKey}.title`)}
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#0F1A26]/60">
                  {t(`categoryCopy.${categoryCopyKey}.description`)}
                </p>
              </div>

              {/* Results count - Clean */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-[#0F1A26]/50 text-sm">
                  {t('results.showing', { count: filteredProducts.length })}
                </p>
              </div>

              {/* Grid - Clean */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {paginatedProducts.map((product, index) => {
                  const sizeOptions = getQuickSizeOptions(product);
                  const colorOptions = product.colors || [];
                  const selection = getQuickSelection(product);
                  const isBundle = isBundleProduct(product);
                  const isUnavailable = isProductOutOfStock(product) || isProductSizeOutOfStock(product, selection.size);
                  const productTypeLabel = getProductCategories(product).includes("luggage-covers") ? "Bag Covers" : product.type;

                  return (
                    <div
                      key={product.id}
                      className={`group transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                      style={{ transitionDelay: `${index * 50}ms` }}
                    >
                      <div className="relative">
                        <Link href={`/product/${product.slug}`} className="block">
                          <SwipeableProductImage product={product} />
                        </Link>
                        <WishlistToggleButton
                          product={product}
                          className="absolute right-2 top-12 sm:right-3 sm:top-14"
                        />
                      </div>

                      {/* Product Info - Clean */}
                      <div className="px-1">
                        <Link href={`/product/${product.slug}`} className="block">
                          <span className="text-[#EEBC3F] text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase">
                            {productTypeLabel}
                          </span>
                          <h3 className="text-[#0F1A26] font-medium text-xs sm:text-sm mt-0.5 mb-0.5 sm:mt-1 sm:mb-1 group-hover:text-[#EEBC3F] transition-colors line-clamp-1">
                            {product.name}
                          </h3>
                          {product.stockStatus && product.stockStatus !== "in_stock" && (
                            <span className={`mb-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isUnavailable ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                            }`}>
                              {getStockLabel(product, stockLabels)}
                            </span>
                          )}
                        </Link>

                        {isBundle ? (
                          <BundleQuickCustomizer product={product} products={products} variant="light" />
                        ) : (
                        <div className="mt-2 rounded-2xl border border-[#0F1A26]/8 bg-white/85 p-2 shadow-sm backdrop-blur-sm sm:p-3">
                          {!isBundle && (sizeOptions.length > 1 || colorOptions.length > 1) && (
                            <div className="mb-2 space-y-2">
                              {sizeOptions.length > 1 && (
                                <div>
                                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#0F1A26]/45">
                                    {t('quickAdd.size')}
                                  </div>
                                  <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-4">
                                    {sizeOptions.map((size) => {
                                      const isSelected = selection.size === size.id;
                                      const isSizeUnavailable = isProductSizeOutOfStock(product, size.id);

                                      return (
                                        <button
                                          key={size.id}
                                          type="button"
                                          aria-label={`${t('quickAdd.size')}: ${size.label}, ${size.cm} cm`}
                                          aria-pressed={isSelected}
                                          disabled={isSizeUnavailable}
                                          onClick={() => updateQuickSelection(product.id, { size: size.id })}
                                          className={`min-w-0 min-h-12 rounded-xl border px-2 py-1.5 text-center transition-all disabled:cursor-not-allowed disabled:opacity-45 ${
                                            isSelected
                                              ? "border-[#EEBC3F] bg-[#EEBC3F] text-[#0F1A26] shadow-sm"
                                              : "border-[#0F1A26]/10 bg-[#F8F6F3] text-[#0F1A26]/65 hover:border-[#EEBC3F]/60 hover:text-[#0F1A26]"
                                          }`}
                                        >
                                          <span className="block text-sm font-black leading-none">{size.label}</span>
                                          <span className="mt-1 block whitespace-nowrap text-[10px] font-bold leading-none opacity-75">
                                            {size.cm} cm
                                          </span>
                                          {isSizeUnavailable && (
                                            <span className="mt-1 block text-[8px] font-bold text-red-600">
                                              {stockT("outOfStock")}
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {colorOptions.length > 1 && (
                                <div>
                                  <div className="mb-1.5 flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F1A26]/45">
                                      {t('quickAdd.color')}
                                    </span>
                                    <span className="truncate text-[11px] font-semibold text-[#0F1A26]/65">
                                      {colorOptions.find((color) => color.id === selection.color)?.name}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {colorOptions.map((color) => {
                                      const isSelected = selection.color === color.id;

                                      return (
                                        <button
                                          key={color.id}
                                          type="button"
                                          aria-label={`${t('quickAdd.color')}: ${color.name}`}
                                          aria-pressed={isSelected}
                                          onClick={() => updateQuickSelection(product.id, { color: color.id })}
                                          className={`h-7 w-7 rounded-full border p-0.5 transition-all ${
                                            isSelected
                                              ? "border-[#EEBC3F] ring-2 ring-[#EEBC3F]/35"
                                              : "border-[#0F1A26]/15 hover:border-[#EEBC3F]/70"
                                          }`}
                                        >
                                          <span
                                            className="block h-full w-full rounded-full border border-black/10"
                                            style={getColorSwatchStyle(color.name)}
                                          />
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {isBundle && (
                            <Link
                              href={`/product/${product.slug}`}
                              className="mb-2 block rounded-xl bg-[#EEBC3F]/10 px-3 py-2 text-center text-xs font-bold text-[#0F1A26] hover:bg-[#EEBC3F]/20"
                            >
                              {t('quickAdd.customize')}
                            </Link>
                          )}

                          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                            <Button
                              type="button"
                              aria-label={t('quickAdd.add')}
                              onClick={() => handleQuickAdd(product)}
                              disabled={isUnavailable}
                              className="h-10 rounded-xl bg-[#F8F6F3] border border-[#0F1A26]/10 text-[#0F1A26] hover:bg-[#0F1A26] hover:text-white px-2 text-xs font-bold"
                              variant="outline"
                            >
                              <span className="truncate">{isUnavailable ? getStockLabel(product, stockLabels) : t('quickAdd.add')}</span>
                            </Button>
                            <Button
                              type="button"
                              aria-label={t('quickAdd.buy')}
                              onClick={() => handleQuickBuy(product)}
                              disabled={isUnavailable}
                              className="h-10 rounded-xl bg-[#EEBC3F] text-[#0F1A26] hover:bg-[#d4a535] px-2 text-xs font-bold shadow-sm shadow-[#EEBC3F]/25"
                            >
                              <span className="truncate">{isUnavailable ? getStockLabel(product, stockLabels) : t('quickAdd.buy')}</span>
                            </Button>
                          </div>
                        </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-full bg-[#0F1A26] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#EEBC3F] hover:text-[#0F1A26] transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-[#EEBC3F] text-[#0F1A26]'
                            : 'bg-[#0F1A26]/10 text-[#0F1A26] hover:bg-[#0F1A26]/20'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-full bg-[#0F1A26] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#EEBC3F] hover:text-[#0F1A26] transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {filteredProducts.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-[#0F1A26]/50 mb-3">{t('noProducts')}</p>
                  <button 
                    onClick={clearFilters} 
                    className="text-[#EEBC3F] hover:text-[#0F1A26] font-medium transition-colors"
                  >
                    {t('clearFilters')}
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
                <h2 className="font-semibold text-[#0F1A26]">{t('filters.title')}</h2>
                <button onClick={() => setMobileFiltersOpen(false)} className="w-8 h-8 rounded-full bg-[#0F1A26]/5 flex items-center justify-center">
                  <X className="w-4 h-4 text-[#0F1A26]" />
                </button>
              </div>

              {/* Mobile Best Seller Filter */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-[#0F1A26] mb-3 tracking-wider uppercase">{t('filters.bestSellers.title')}</h3>
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
                    {t('filters.bestSellers.showOnly')}
                  </span>
                </label>
              </div>

              {/* Mobile Size Filter - Clean */}
              {(activeCategory === "all" || activeCategory === "luggage-covers") && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-[#0F1A26] mb-3 tracking-wider uppercase">{t('filters.size.title')}</h3>
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

              {/* Mobile Gender Filter */}
              {(activeCategory === "all" || activeCategory === "luggage-covers") && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-[#0F1A26] mb-3 tracking-wider uppercase">{t('filters.gender.title')}</h3>
                  <div className="space-y-2">
                    {genders.map((gender) => (
                      <label 
                        key={gender.id} 
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => toggleGender(gender.id)}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            selectedGenders.includes(gender.id) ? "bg-[#EEBC3F] border-[#EEBC3F]" : "border-[#0F1A26]/20"
                          }`}
                        >
                          {selectedGenders.includes(gender.id) && (
                            <svg className="w-3 h-3 text-[#0F1A26]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-sm ${selectedGenders.includes(gender.id) ? "text-[#0F1A26] font-medium" : "text-[#0F1A26]/60"}`}>
                          {t(`filters.gender.${gender.id}`)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Collection Filter */}
              {(activeCategory === "all" || activeCategory === "luggage-covers") && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-[#0F1A26] mb-3 tracking-wider uppercase">{t('filters.collection.title')}</h3>
                  <div className="space-y-2">
                    {collections.map((collection) => (
                      <label 
                        key={collection.id} 
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => toggleCollection(collection.id)}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            selectedCollections.includes(collection.id) ? "bg-[#EEBC3F] border-[#EEBC3F]" : "border-[#0F1A26]/20"
                          }`}
                        >
                          {selectedCollections.includes(collection.id) && (
                            <svg className="w-3 h-3 text-[#0F1A26]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-sm ${selectedCollections.includes(collection.id) ? "text-[#0F1A26] font-medium" : "text-[#0F1A26]/60"}`}>
                          {t(`filters.collection.${collection.id}`)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Print Type Filter */}
              {(activeCategory === "all" || activeCategory === "luggage-covers") && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-[#0F1A26] mb-3 tracking-wider uppercase">{t('filters.printType.title')}</h3>
                  <div className="space-y-2">
                    {printTypes.map((printType) => (
                      <label 
                        key={printType.id} 
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => togglePrintType(printType.id)}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            selectedPrintTypes.includes(printType.id) ? "bg-[#EEBC3F] border-[#EEBC3F]" : "border-[#0F1A26]/20"
                          }`}
                        >
                          {selectedPrintTypes.includes(printType.id) && (
                            <svg className="w-3 h-3 text-[#0F1A26]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-sm ${selectedPrintTypes.includes(printType.id) ? "text-[#0F1A26] font-medium" : "text-[#0F1A26]/60"}`}>
                          {t(`filters.printType.${printType.id}`)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Color Filter - For All Products */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-[#0F1A26] mb-3 tracking-wider uppercase">{t('filters.color.title')}</h3>
                <div className="space-y-2">
                  {Array.from(new Set(products.filter(p => p.color).map(p => p.color))).map((color) => (
                    <label 
                      key={color} 
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => toggleColor(color!)}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          selectedColors.includes(color!) ? "bg-[#EEBC3F] border-[#EEBC3F]" : "border-[#0F1A26]/20"
                        }`}
                      >
                        {selectedColors.includes(color!) && (
                          <svg className="w-3 h-3 text-[#0F1A26]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm ${selectedColors.includes(color!) ? "text-[#0F1A26] font-medium" : "text-[#0F1A26]/60"}`}>
                        {color}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full bg-[#0F1A26] text-white rounded-full h-12 font-medium" 
                onClick={() => setMobileFiltersOpen(false)}
              >
                {t('mobile.showProducts', { count: filteredProducts.length })}
              </Button>
            </div>
          </div>
        )}
      </main>

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
