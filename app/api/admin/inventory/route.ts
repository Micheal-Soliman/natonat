import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";
import { getCatalogProducts } from "@/lib/sanity-products";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await getCatalogProducts({ live: true });
  const inventory = products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    type: product.type,
    category: product.category,
    stockStatus: product.stockStatus || "in_stock",
    stockQuantity: product.stockQuantity ?? null,
    sizeStock: product.sizeStock || {},
    sizePrices: product.sizePrices || null,
    price: product.price,
    originalPrice: product.originalPrice,
    costPrice: product.costPrice ?? null,
    packagingCost: product.packagingCost ?? null,
    image: product.image,
  }));

  return NextResponse.json({
    success: true,
    inventory,
    total: inventory.length,
    source: "sanity",
    fetchedAt: new Date().toISOString(),
  });
}
