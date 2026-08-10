import { NextResponse } from "next/server";
import { getCatalogProducts } from "@/lib/sanity-products";
import { isProductOutOfStock } from "@/lib/product-stock";

export const dynamic = "force-dynamic";

type CatalogItem = {
  id: string;
  title: string;
  description: string;
  availability: string;
  condition: string;
  link: string;
  image_link: string;
  brand: string;
  google_product_category: string;
  fb_product_category: string;
  quantity_to_sell_on_facebook: number;
  sale_price: string;
  sale_price_effective_date: string;
  item_group_id: string;
  gender: string;
  color: string;
  age_group: string;
  material: string;
  pattern: string;
  shipping: string;
  shipping_weight: string;
  offer_disclaimer: string;
  offer_disclaimer_url: string;
  video: string[];
  gtin: string;
  product_tags: string[];
  style: string[];
  price?: string;
  size?: string;
};

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  // Escape double quotes by doubling, wrap in quotes if contains comma, quote or newline
  const escaped = s.replace(/"/g, '""');
  if (/[",\n]/.test(s)) return `"${escaped}"`;
  return escaped;
}

function getFeedPrices(currentValue: unknown, originalValue: unknown) {
  const currency = process.env.MEDIA_BUYER_CURRENCY || "EGP";
  const currentPrice = Number(currentValue);
  const originalPrice = Number(originalValue);

  if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
    return { price: "", salePrice: "" };
  }

  const hasDiscount = Number.isFinite(originalPrice) && originalPrice > currentPrice;
  return {
    price: `${(hasDiscount ? originalPrice : currentPrice).toFixed(2)} ${currency}`,
    salePrice: hasDiscount ? `${currentPrice.toFixed(2)} ${currency}` : "",
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const format = (url.searchParams.get("format") || "json").toLowerCase();

    // Sanity is the live source of truth. Keeping a separate slug allow-list
    // caused newly published products to disappear from the media catalog.
    const matchedProducts = await getCatalogProducts();

    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.natonat.com";
    const siteOrigin = new URL(configuredSiteUrl).origin;

    // Keep one catalog row per product. Sizes remain selectable on the product
    // page instead of appearing as separate products in ad catalogs.
    const items: CatalogItem[] = [];

    for (const p of matchedProducts) {
      const sizeStocks = Object.values(p.sizeStock || {}).filter(Boolean);
      const knownSizeQuantities = sizeStocks
        .map((stock) => stock?.quantity)
        .filter((quantity): quantity is number => typeof quantity === "number");
      const totalSizeQuantity = knownSizeQuantities.reduce((total, quantity) => total + Math.max(0, quantity), 0);
      const hasSizeQuantityData = knownSizeQuantities.length > 0;
      const availableQuantity = hasSizeQuantityData ? totalSizeQuantity : p.stockQuantity ?? 100;
      const isUnavailable = isProductOutOfStock(p) || availableQuantity === 0;
      const defaultSizePrice = p.sizePrices?.m || p.sizePrices?.s || p.sizePrices?.l || p.sizePrices?.xl;
      const prices = getFeedPrices(
        p.price ?? defaultSizePrice?.price,
        p.originalPrice ?? defaultSizePrice?.originalPrice,
      );

      if (!prices.price) continue;

      const base = {
        id: p.slug,
        title: p.name ?? p.slug,
        description: p.description ?? "",
        availability: isUnavailable ? "out of stock" : "in stock",
        condition: "new",
        link: `${siteOrigin}/en/product/${encodeURIComponent(p.slug.trim())}`,
        image_link: p.image ? (p.image.startsWith("http") ? p.image : `${siteOrigin}${p.image}`) : "",
        brand: process.env.MEDIA_BUYER_BRAND || "natOnat",
        google_product_category: "",
        fb_product_category: "",
        quantity_to_sell_on_facebook: isUnavailable ? 0 : availableQuantity,
        sale_price: prices.salePrice,
        sale_price_effective_date: "",
        item_group_id: "",
        gender: Array.isArray(p.gender) ? p.gender.join("|") : p.gender ?? "",
        color: p.color ?? "",
        age_group: "adult",
        material: "",
        pattern: p.theme ?? "",
        shipping: "EG::Standard:0.00 EGP",
        shipping_weight: "",
        offer_disclaimer: "",
        offer_disclaimer_url: "",
        video: [],
        gtin: "",
        product_tags: [p.tag ?? "", p.collection ?? ""].filter(Boolean),
        style: [p.theme ?? ""].filter(Boolean),
      };

      items.push({
        ...base,
        price: prices.price,
        size: "",
      });
    }

    if (format === "csv") {
      // CSV headers aligned with Facebook catalog
      const headers = [
        "id",
        "title",
        "description",
        "availability",
        "condition",
        "price",
        "link",
        "image_link",
        "brand",
        "google_product_category",
        "fb_product_category",
        "quantity_to_sell_on_facebook",
        "sale_price",
        "sale_price_effective_date",
        "item_group_id",
        "gender",
        "color",
        "size",
        "age_group",
        "material",
        "pattern",
        "shipping",
        "shipping_weight",
        "offer_disclaimer",
        "offer_disclaimer_url",
        "video[0].url",
        "video[0].tag[0]",
        "gtin",
        "product_tags[0]",
        "product_tags[1]",
        "style[0]",
      ];

      const rows: string[] = [headers.join(",")];
      for (const it of items) {
        const product_tags_0 = it.product_tags && it.product_tags[0] ? it.product_tags[0] : "";
        const product_tags_1 = it.product_tags && it.product_tags[1] ? it.product_tags[1] : "";
        const style0 = it.style && it.style[0] ? it.style[0] : "";

        const values = [
          it.id,
          it.title,
          it.description,
          it.availability,
          it.condition,
          it.price,
          it.link,
          it.image_link,
          it.brand,
          it.google_product_category,
          it.fb_product_category,
          it.quantity_to_sell_on_facebook,
          it.sale_price,
          it.sale_price_effective_date,
          it.item_group_id,
          it.gender,
          it.color,
          it.size,
          it.age_group,
          it.material,
          it.pattern,
          it.shipping,
          it.shipping_weight,
          it.offer_disclaimer,
          it.offer_disclaimer_url,
          "",
          "",
          it.gtin,
          product_tags_0,
          product_tags_1,
          style0,
        ];

        rows.push(values.map(csvEscape).join(","));
      }

      const csv = rows.join("\n");
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=media-buyer-products.csv",
        },
      });
    }

    // Default: return JSON in facebook-catalog-like structure
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error("[Media Buyer Products API]", error);
    return NextResponse.json(
      {
        label: "Media Buyer Product Set",
        products: [],
        count: 0,
        error: "Unable to load media buyer product list.",
      },
      { status: 500 }
    );
  }
}
