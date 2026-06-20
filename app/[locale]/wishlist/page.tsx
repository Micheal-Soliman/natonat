"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ArrowLeft, Heart, Package, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/app/lib/cart-context";
import { useWishlist } from "@/app/lib/wishlist-context";
import { useCatalogProducts } from "@/app/lib/catalog-context";
import { useSizeGuideSizes } from "@/app/lib/site-settings-context";
import { useToast } from "@/app/components/toast-provider";
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { getStockLabel, isProductOutOfStock } from "@/lib/product-stock";
import type { Product } from "@/lib/products";

type QuickSelection = {
  size?: string;
  color?: string;
};

type SizeOption = ReturnType<typeof useSizeGuideSizes>[number];

function getProductCategories(product: Product) {
  return Array.isArray(product.category) ? product.category : [product.category];
}

function isBundleProduct(product: Product) {
  return getProductCategories(product).includes("bundles");
}

function getSizeOptions(product: Product, sizes: SizeOption[]) {
  if (product.sizePrices) {
    return sizes.filter((size) => product.sizePrices?.[size.id as keyof NonNullable<Product["sizePrices"]>]);
  }

  if (!product.size) return [];
  return sizes.filter((size) => size.id === product.size?.toLowerCase());
}

export default function WishlistPage() {
  const t = useTranslations("wishlist");
  const stockT = useTranslations("stock");
  const router = useRouter();
  const products = useCatalogProducts();
  const sizes = useSizeGuideSizes();
  const { addToCart, setBuyNowItem } = useCart();
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { showToast } = useToast();
  const [quickSelections, setQuickSelections] = useState<Record<number, QuickSelection>>({});
  const stockLabels = {
    inStock: stockT("inStock"),
    lowStock: stockT("lowStock"),
    outOfStock: stockT("outOfStock"),
  };

  const wishlistProducts = useMemo(
    () =>
      items
        .map((item) => products.find((product) => product.id === item.id))
        .filter(Boolean) as Product[],
    [items, products]
  );

  const copy = {
    add: t("actions.addToCart"),
    buy: t("actions.buyNow"),
    customize: t("actions.customizeBundle"),
    size: t("item.size"),
    color: t("item.color"),
    removed: t("toast.removed"),
    added: t("toast.added"),
    checkout: t("actions.checkout"),
    keepShopping: t("actions.keepShopping"),
    fromCms: t("item.updatedFromCatalog"),
  };

  const getQuickSelection = (product: Product) => {
    const sizeOptions = getSizeOptions(product, sizes);
    const colorOptions = product.colors || [];
    const saved = quickSelections[product.id] || {};

    return {
      size: saved.size || sizeOptions[0]?.id || product.size?.toLowerCase(),
      color: saved.color || colorOptions[0]?.id || product.color,
    };
  };

  const updateQuickSelection = (productId: number, selection: QuickSelection) => {
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

  const handleQuickAdd = (product: Product) => {
    if (isProductOutOfStock(product)) return;
    addToCart(getQuickCartItem(product), { openCart: false });
    showToast({
      title: copy.added,
      description: product.name,
      action: {
        label: copy.checkout,
        onClick: () => router.push("/checkout"),
      },
      cancel: {
        label: copy.keepShopping,
        onClick: () => {},
      },
    });
  };

  const handleQuickBuy = (product: Product) => {
    if (isProductOutOfStock(product)) return;
    setBuyNowItem(getQuickCartItem(product));
    router.push("/checkout");
  };

  const handleRemove = (id: number) => {
    removeFromWishlist(id);
    showToast({ title: copy.removed });
  };

  if (items.length === 0) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-[#F1EBE3] pt-24">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm sm:h-32 sm:w-32">
              <Heart className="h-11 w-11 text-[#0F1A26]/20 sm:h-14 sm:w-14" strokeWidth={1.5} />
            </div>
            <h1 className="mb-4 text-3xl font-bold tracking-tight text-[#0F1A26] sm:text-4xl">
              {t("empty.title")}
            </h1>
            <p className="mx-auto mb-8 max-w-md text-base text-[#0F1A26]/60 sm:text-lg">
              {t("empty.subtitle")}
            </p>
            <Link href="/shop">
              <Button className="h-12 rounded-full bg-[#0F1A26] px-8 font-bold text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26]">
                <ShoppingBag className="mr-2 h-5 w-5" />
                {t("continueShopping")}
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F1EBE3] pt-24">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#EEBC3F]">
                {t("label")}
              </span>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0F1A26] sm:text-4xl">
                {t("titleCount", { count: wishlistProducts.length || items.length })}
              </h1>
              <p className="mt-2 text-sm font-medium text-[#0F1A26]/50">{copy.fromCms}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/shop"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-[#0F1A26]/10 bg-white px-5 text-sm font-bold text-[#0F1A26] transition hover:border-[#EEBC3F] hover:text-[#EEBC3F]"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("continueShopping")}
              </Link>
              <button
                type="button"
                onClick={clearWishlist}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-red-100 bg-white px-5 text-sm font-bold text-red-500 transition hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                {t("clearAll")}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wishlistProducts.map((product) => {
              const sizeOptions = getSizeOptions(product, sizes);
              const colorOptions = product.colors || [];
              const selection = getQuickSelection(product);
              const selectedColor = colorOptions.find((color) => color.id === selection.color);
              const previewImage = selectedColor?.image || product.image;
              const bundle = isBundleProduct(product);
              const unavailable = isProductOutOfStock(product);

              return (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-3xl border border-[#0F1A26]/8 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <Link href={`/product/${product.slug}`} className="relative block aspect-[4/5] bg-[#F8F6F3]">
                    <Image
                      src={previewImage}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      quality={60}
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#0F1A26] shadow-sm">
                      {getStockLabel(product, stockLabels)}
                    </span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleRemove(product.id);
                      }}
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-500 shadow-sm transition hover:bg-red-50"
                      aria-label={t("clearAll")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </Link>

                  <div className="p-4">
                    <Link href={`/product/${product.slug}`}>
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#EEBC3F]">
                        {product.type}
                      </span>
                      <h3 className="mt-1 line-clamp-1 text-lg font-bold text-[#0F1A26] transition hover:text-[#EEBC3F]">
                        {product.name}
                      </h3>
                    </Link>

                    {!bundle && (sizeOptions.length > 1 || colorOptions.length > 1) && (
                      <div className="mt-4 grid gap-2">
                        {sizeOptions.length > 1 && (
                          <label>
                            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#0F1A26]/45">
                              {copy.size}
                            </span>
                            <select
                              value={selection.size || ""}
                              onChange={(event) => updateQuickSelection(product.id, { size: event.target.value })}
                              className="h-10 w-full rounded-xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-3 text-xs font-bold text-[#0F1A26] outline-none focus:border-[#EEBC3F]"
                            >
                              {sizeOptions.map((size) => (
                                <option key={size.id} value={size.id}>
                                  {size.label} - {size.range}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}

                        {colorOptions.length > 1 && (
                          <label>
                            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#0F1A26]/45">
                              {copy.color}
                            </span>
                            <select
                              value={selection.color || ""}
                              onChange={(event) => updateQuickSelection(product.id, { color: event.target.value })}
                              className="h-10 w-full rounded-xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-3 text-xs font-bold text-[#0F1A26] outline-none focus:border-[#EEBC3F]"
                            >
                              {colorOptions.map((color) => (
                                <option key={color.id} value={color.id}>
                                  {color.name}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        {product.originalPrice > product.price && (
                          <p className="text-xs text-[#0F1A26]/35 line-through">EGP {product.originalPrice}</p>
                        )}
                        <p className="text-xl font-black text-[#0F1A26]">EGP {product.price}</p>
                      </div>
                      {bundle ? (
                        <Link href={`/product/${product.slug}`} className="shrink-0">
                          <Button className="h-11 rounded-full bg-[#EEBC3F] px-4 text-xs font-black text-[#0F1A26] hover:bg-[#0F1A26] hover:text-white">
                            <Package className="mr-1.5 h-4 w-4" />
                            {copy.customize}
                          </Button>
                        </Link>
                      ) : (
                        <div className="grid shrink-0 grid-cols-2 gap-2">
                          <Button
                            type="button"
                            onClick={() => handleQuickAdd(product)}
                            disabled={unavailable}
                            className="h-11 rounded-full bg-[#0F1A26] px-3 text-xs font-black text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {copy.add}
                          </Button>
                          <Button
                            type="button"
                            onClick={() => handleQuickBuy(product)}
                            disabled={unavailable}
                            className="h-11 rounded-full bg-[#EEBC3F] px-3 text-xs font-black text-[#0F1A26] hover:bg-[#0F1A26] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {copy.buy}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
