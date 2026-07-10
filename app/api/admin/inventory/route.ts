import { NextResponse } from "next/server";

import { getCatalogProducts } from "@/lib/sanity-products";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return "";
  return auth.slice(7).trim();
}

function isAuthorized(req: Request) {
  const configuredToken = process.env.ADMIN_DASHBOARD_TOKEN;
  if (!configuredToken) {
    return process.env.NODE_ENV !== "production";
  }

  const url = new URL(req.url);
  const providedToken =
    getBearerToken(req) ||
    req.headers.get("x-admin-token") ||
    url.searchParams.get("token") ||
    "";

  return providedToken === configuredToken;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
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
