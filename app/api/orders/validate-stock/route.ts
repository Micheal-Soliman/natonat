import { NextResponse } from "next/server";

import {
  validateOrderInventory,
  type InventoryOrderItem,
} from "@/lib/sanity-inventory";

export async function POST(req: Request) {
  let body: { items?: InventoryOrderItem[] };

  try {
    body = (await req.json()) as { items?: InventoryOrderItem[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Order items are required" }, { status: 400 });
  }

  try {
    const result = await validateOrderInventory(body.items);
    return NextResponse.json(result, { status: result.valid ? 200 : 409 });
  } catch (error) {
    console.error("Stock validation failed", error);
    return NextResponse.json({ error: "Stock validation unavailable" }, { status: 503 });
  }
}
