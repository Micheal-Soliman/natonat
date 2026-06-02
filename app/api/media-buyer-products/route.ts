import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { products } from "@/lib/products";

export const dynamic = "force-dynamic";

function csvEscape(value: any) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  // Escape double quotes by doubling, wrap in quotes if contains comma, quote or newline
  const escaped = s.replace(/"/g, '""');
  if (/[",\n]/.test(s)) return `"${escaped}"`;
  return escaped;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const format = (url.searchParams.get("format") || "json").toLowerCase();

    const filePath = path.join(process.cwd(), "data", "media-buyer-products.json");
    const raw = await readFile(filePath, "utf-8");
    const { slugs } = JSON.parse(raw) as { slugs: string[]; label?: string };

    const matchedProducts = products.filter((product) => slugs.includes(product.slug));

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://example.com").replace(/\/$/, "");

    // Build catalog items. For products with sizePrices create per-size rows.
    const items: any[] = [];

    for (const p of matchedProducts) {
      const base = {
        id: p.slug,
        title: p.name ?? p.slug,
        description: p.description ?? "",
        availability: "in stock",
        condition: "new",
        link: `${siteUrl}/product/${encodeURIComponent(p.slug)}`,
        image_link: p.image ? (p.image.startsWith("http") ? p.image : `${siteUrl}${p.image}`) : "",
        brand: process.env.MEDIA_BUYER_BRAND || "natOnat",
        google_product_category: "",
        fb_product_category: "",
        quantity_to_sell_on_facebook: 100,
        sale_price: "",
        sale_price_effective_date: "",
        item_group_id: p.slug,
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

      // If sizePrices exist, expand into variants with size-specific prices
      if (p.sizePrices) {
        for (const sizeKey of ["s", "m", "l", "xl"]) {
          const sizeData = (p.sizePrices as any)[sizeKey];
          if (!sizeData) continue;
          const sizeLabel = sizeKey.toUpperCase();
          const priceVal = Number(sizeData.price).toFixed(2);
          const originalVal = Number(sizeData.originalPrice || 0).toFixed(2);
          const itemId = `${p.slug}-${sizeKey}`;
          items.push({
            ...base,
            id: itemId,
            title: `${base.title} - ${sizeLabel}`,
            price: `${priceVal} ${process.env.MEDIA_BUYER_CURRENCY || "EGP"}`,
            sale_price: originalVal && Number(originalVal) > Number(priceVal) ? `${priceVal} ${process.env.MEDIA_BUYER_CURRENCY || "EGP"}` : "",
            size: sizeLabel,
            item_group_id: p.slug,
          });
        }
      } else {
        // single row
        const priceVal = p.price != null ? Number(p.price).toFixed(2) : "";
        items.push({
          ...base,
          id: p.slug,
          price: priceVal ? `${priceVal} ${process.env.MEDIA_BUYER_CURRENCY || "EGP"}` : "",
          size: p.size ?? "",
        });
      }
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
