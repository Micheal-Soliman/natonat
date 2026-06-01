import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { products } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "media-buyer-products.json");
    const raw = await readFile(filePath, "utf-8");
    const { slugs, label } = JSON.parse(raw) as { slugs: string[]; label?: string };

    const matchedProducts = products.filter((product) => slugs.includes(product.slug));

    return NextResponse.json({
      products: matchedProducts,
    });
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
