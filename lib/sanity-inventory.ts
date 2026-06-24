import crypto from "crypto";
import { createClient } from "next-sanity";
import { revalidateTag } from "next/cache";

import { apiVersion, dataset, projectId } from "@/sanity/env";

export type InventoryOrderSelection = {
  productId?: number;
  size?: string;
  quantity?: number;
};

export type InventoryOrderItem = {
  id?: number;
  size?: string;
  quantity?: number;
  isBundle?: boolean;
  bundleSelections?: InventoryOrderSelection[];
};

type InventoryProduct = {
  _id: string;
  _rev: string;
  legacyId: number;
  name?: string;
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock";
  stockQuantity?: number;
  sizeStock?: Partial<
    Record<
      "s" | "m" | "l" | "xl",
      { status?: "in_stock" | "low_stock" | "out_of_stock"; quantity?: number }
    >
  >;
};

type InventoryLine = {
  productId: number;
  size?: "s" | "m" | "l" | "xl";
  quantity: number;
};

export type InventoryAdjustmentResult = {
  status: "adjusted" | "already_adjusted" | "skipped";
  adjustedProducts?: number;
  reason?: string;
};

function positiveQuantity(value: unknown) {
  const quantity = Number(value ?? 1);
  return Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
}

function normalizeSize(size?: string): InventoryLine["size"] {
  const value = size?.trim().toLowerCase();
  return value === "s" || value === "m" || value === "l" || value === "xl"
    ? value
    : undefined;
}

function flattenInventoryLines(items: InventoryOrderItem[]) {
  const lines: InventoryLine[] = [];

  for (const item of items) {
    const itemQuantity = positiveQuantity(item.quantity);

    if (typeof item.id === "number") {
      lines.push({
        productId: item.id,
        size: normalizeSize(item.size),
        quantity: itemQuantity,
      });
    }

    if (item.isBundle && item.bundleSelections?.length) {
      for (const selection of item.bundleSelections) {
        if (typeof selection.productId !== "number") continue;
        lines.push({
          productId: selection.productId,
          size: normalizeSize(selection.size),
          quantity: itemQuantity * positiveQuantity(selection.quantity),
        });
      }
    }
  }

  const totals = new Map<string, InventoryLine>();
  for (const line of lines) {
    const key = `${line.productId}:${line.size || "product"}`;
    const existing = totals.get(key);
    totals.set(key, { ...line, quantity: (existing?.quantity || 0) + line.quantity });
  }

  return [...totals.values()];
}

function isDuplicateMutationError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const statusCode = (error as { statusCode?: number }).statusCode;
  const message = (error as { message?: string }).message || "";
  return statusCode === 409 || /already exists|document.*exists|conflict/i.test(message);
}

export type InventoryValidationIssue = {
  productId: number;
  productName?: string;
  size?: string;
  requested: number;
  available: number;
};

export async function validateOrderInventory(items: InventoryOrderItem[]) {
  const lines = flattenInventoryLines(items);
  if (!lines.length) return { valid: true, issues: [] as InventoryValidationIssue[] };

  const client = createClient({ projectId, dataset, apiVersion, useCdn: false });
  const productIds = [...new Set(lines.map((line) => line.productId))];
  const products = await client.fetch<InventoryProduct[]>(
    `*[_type == "product" && legacyId in $productIds]{_id, _rev, legacyId, name, stockStatus, stockQuantity, sizeStock}`,
    { productIds },
  );
  const productByLegacyId = new Map(products.map((product) => [product.legacyId, product]));
  const issues: InventoryValidationIssue[] = [];

  for (const line of lines) {
    const product = productByLegacyId.get(line.productId);
    if (!product) continue;

    const sizeInventory = line.size ? product.sizeStock?.[line.size] : undefined;
    const status = sizeInventory?.status || product.stockStatus || "in_stock";
    const trackedQuantity = typeof sizeInventory?.quantity === "number"
      ? sizeInventory.quantity
      : product.stockQuantity;
    const available = status === "out_of_stock"
      ? 0
      : typeof trackedQuantity === "number"
        ? Math.max(0, trackedQuantity)
        : Number.POSITIVE_INFINITY;

    if (line.quantity > available) {
      issues.push({
        productId: line.productId,
        productName: product.name,
        size: line.size,
        requested: line.quantity,
        available,
      });
    }
  }

  return { valid: issues.length === 0, issues };
}

export async function adjustInventoryForConfirmedOrder(
  orderRef: string,
  items: InventoryOrderItem[],
  attempt = 0,
): Promise<InventoryAdjustmentResult> {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) {
    return { status: "skipped", reason: "SANITY_API_WRITE_TOKEN is not set" };
  }

  const lines = flattenInventoryLines(items);
  if (!lines.length) return { status: "skipped", reason: "Order has no inventory items" };

  const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });
  const markerId = `inventoryAdjustment.${crypto.createHash("sha256").update(orderRef).digest("hex")}`;
  const existingMarker = await client.fetch<string | null>(`*[_id == $id][0]._id`, { id: markerId });
  if (existingMarker) return { status: "already_adjusted" };

  const productIds = [...new Set(lines.map((line) => line.productId))];
  const products = await client.fetch<InventoryProduct[]>(
    `*[_type == "product" && legacyId in $productIds]{_id, _rev, legacyId, stockStatus, stockQuantity, sizeStock}`,
    { productIds },
  );
  const productByLegacyId = new Map(products.map((product) => [product.legacyId, product]));
  const patches = new Map<string, Record<string, number | string>>();

  for (const line of lines) {
    const product = productByLegacyId.get(line.productId);
    if (!product) continue;

    const set = patches.get(product._id) || {};
    const sizeInventory = line.size ? product.sizeStock?.[line.size] : undefined;

    if (line.size && typeof sizeInventory?.quantity === "number") {
      const current = typeof set[`sizeStock.${line.size}.quantity`] === "number"
        ? Number(set[`sizeStock.${line.size}.quantity`])
        : sizeInventory.quantity;
      const remaining = Math.max(0, current - line.quantity);
      set[`sizeStock.${line.size}.quantity`] = remaining;
      set[`sizeStock.${line.size}.status`] = remaining === 0 ? "out_of_stock" : "low_stock";
    } else if (typeof product.stockQuantity === "number") {
      const current = typeof set.stockQuantity === "number"
        ? Number(set.stockQuantity)
        : product.stockQuantity;
      const remaining = Math.max(0, current - line.quantity);
      set.stockQuantity = remaining;
      set.stockStatus = remaining === 0 ? "out_of_stock" : "low_stock";
    }

    if (Object.keys(set).length) patches.set(product._id, set);
  }

  if (!patches.size) {
    return { status: "skipped", reason: "No selected product or size has a tracked quantity" };
  }

  let transaction = client.transaction().create({
    _id: markerId,
    _type: "inventoryAdjustment",
    orderRef,
    createdAt: new Date().toISOString(),
    lines,
  });

  for (const [productId, set] of patches) {
    const product = products.find((candidate) => candidate._id === productId);
    if (!product) continue;
    transaction = transaction.patch(productId, (patch) => patch.ifRevisionId(product._rev).set(set));
  }

  try {
    await transaction.commit({ visibility: "sync" });
    revalidateTag("products", "max");
    return { status: "adjusted", adjustedProducts: patches.size };
  } catch (error) {
    const markerAfterError = await client.fetch<string | null>(
      `*[_id == $id][0]._id`,
      { id: markerId },
    );
    if (markerAfterError) return { status: "already_adjusted" };
    if (isDuplicateMutationError(error) && attempt < 2) {
      return adjustInventoryForConfirmedOrder(orderRef, items, attempt + 1);
    }
    throw error;
  }
}
