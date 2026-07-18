import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";
import { getCatalogProducts } from "@/lib/sanity-products";

type ManualOrderBody = {
  orderKind?: "catalog" | "special";
  productSlug?: string;
  productSize?: string;
  items?: Array<{
    orderKind?: "catalog" | "special";
    productSlug?: string;
    productSize?: string;
    title?: string;
    quantity?: number;
    unitPrice?: number;
    total?: number;
    specialProductBrief?: string;
  }>;
  customerName?: string;
  phone?: string;
  email?: string;
  city?: string;
  governorate?: string;
  address?: string;
  notes?: string;
  specialProductBrief?: string;
  title?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  deliveryMethod?: string;
  createBostaShipment?: boolean;
  createAramexShipment?: boolean;
  codAmount?: number;
};

const ALLOWED_PAYMENT_METHODS = new Set(["custom_bulk", "cod", "paymob_card", "instapay", "bank_transfer"]);
const ALLOWED_PAYMENT_STATUSES = new Set([
  "Paid",
  "Cash on Delivery",
  "Pending",
  "Pending InstaPay Approval",
  "Refunded",
]);
const ALLOWED_DELIVERY_METHODS = new Set(["custom", "delivery", "pickup"]);

function getAppOrigin(req: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_ORIGIN;
  if (configured) return configured.replace(/\/$/, "");

  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const next = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(next) ? next : 0;
  }
  return 0;
}

type CatalogProduct = Awaited<ReturnType<typeof getCatalogProducts>>[number];

function getProductSizePrice(product: CatalogProduct, size: string) {
  const sizeKey = size.toLowerCase() as keyof NonNullable<CatalogProduct["sizePrices"]>;
  const sizePrice = product.sizePrices?.[sizeKey];
  if (sizePrice?.price) return sizePrice.price;
  return product.price || 0;
}

function getProductSizeStock(product: CatalogProduct, size: string) {
  const sizeKey = size.toLowerCase() as keyof NonNullable<CatalogProduct["sizeStock"]>;
  return product.sizeStock?.[sizeKey];
}

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as ManualOrderBody;
  const title = String(body.title || "").trim();
  const quantity = Math.max(1, Math.round(toNumber(body.quantity) || 1));
  const unitPrice = toNumber(body.unitPrice);
  const total = toNumber(body.total) || quantity * unitPrice;
  const shouldCreateShipment = Boolean(body.createBostaShipment || body.createAramexShipment);
  const orderKind = body.orderKind === "catalog" ? "catalog" : "special";
  const productSlug = String(body.productSlug || "").trim();
  const productSize = String(body.productSize || "").trim();
  const phone = String(body.phone || "").trim();
  const city = String(body.city || "").trim();
  const address = String(body.address || "").trim();
  const requestedPaymentMethod = String(body.paymentMethod || (shouldCreateShipment ? "cod" : "custom_bulk"));
  const requestedPaymentStatus = String(body.paymentStatus || "Paid");
  const requestedDeliveryMethod = String(body.deliveryMethod || (shouldCreateShipment ? "delivery" : "custom"));

  if (!title || total <= 0) {
    return NextResponse.json(
      { error: "Missing custom order title or total" },
      { status: 400 },
    );
  }

  if (!ALLOWED_PAYMENT_METHODS.has(requestedPaymentMethod)) {
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  }

  if (!ALLOWED_PAYMENT_STATUSES.has(requestedPaymentStatus)) {
    return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
  }

  if (!ALLOWED_DELIVERY_METHODS.has(requestedDeliveryMethod)) {
    return NextResponse.json({ error: "Invalid delivery method" }, { status: 400 });
  }

  if (shouldCreateShipment && (!phone || !city || !address)) {
    return NextResponse.json(
      { error: "Missing phone, city, or address for Bosta shipment" },
      { status: 400 },
    );
  }

  if (Array.isArray(body.items) && body.items.length > 0) {
    const catalogProducts = await getCatalogProducts({ live: true });
    const builtItems = body.items.map((input, index) => {
      const itemKind = input.orderKind === "catalog" ? "catalog" : input.orderKind === "special" ? "special" : orderKind;
      const itemTitle = String(input.title || "").trim();
      const itemSlug = String(input.productSlug || "").trim();
      const itemSize = String(input.productSize || "").trim();
      const selectedProduct = itemKind === "catalog" && itemSlug
        ? catalogProducts.find((product) => product.slug === itemSlug)
        : null;
      if (itemKind === "catalog" && !itemSlug) throw new Error(`Select a product for item ${index + 1}`);
      if (itemKind === "catalog" && !selectedProduct) throw new Error(`Selected product was not found for item ${index + 1}`);
      const itemQuantity = Math.max(1, Math.round(toNumber(input.quantity) || 1));
      const catalogUnitPrice = selectedProduct ? getProductSizePrice(selectedProduct, itemSize) : 0;
      const itemUnitPrice = toNumber(input.unitPrice) || catalogUnitPrice;
      const itemTotal = toNumber(input.total) || itemQuantity * itemUnitPrice;
      if ((!itemTitle && !selectedProduct) || itemTotal <= 0) throw new Error(`Missing title or total for item ${index + 1}`);

      if (selectedProduct) {
        const sizeStock = itemSize ? getProductSizeStock(selectedProduct, itemSize) : null;
        if (
          selectedProduct.stockStatus === "out_of_stock" ||
          sizeStock?.status === "out_of_stock" ||
          sizeStock?.quantity === 0
        ) {
          throw new Error(`Selected product or size is out of stock for item ${index + 1}`);
        }
      }

      return {
        id: selectedProduct?.id,
        slug: selectedProduct?.slug || itemSlug || undefined,
        name: selectedProduct?.name || itemTitle,
        size: itemSize || undefined,
        quantity: itemQuantity,
        unit_price_egp: itemUnitPrice,
        line_total_egp: itemTotal,
        price: itemUnitPrice,
        type: selectedProduct?.type || "special_custom_product",
        isCustomOrder: !selectedProduct,
        isSpecialProduct: itemKind === "special",
        special_product_brief: input.specialProductBrief || body.specialProductBrief || "",
        catalog_source: itemKind === "special" ? "admin_special_order" : "admin_catalog_order",
        selected_from_catalog: Boolean(selectedProduct),
      };
    });

    const multiTotal = toNumber(body.total) || builtItems.reduce((sum, item) => sum + item.line_total_egp, 0);
    const multiQuantity = builtItems.reduce((sum, item) => sum + item.quantity, 0);
    const hasSpecial = builtItems.some((item) => item.isSpecialProduct || item.isCustomOrder);
    const hasCatalog = builtItems.some((item) => item.selected_from_catalog);
    const source = hasSpecial ? (hasCatalog ? "admin_mixed_manual_order" : "admin_special_order") : "admin_catalog_order";
    const timestamp = new Date().toISOString();
    const orderRef = `CUSTOM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const appOrigin = getAppOrigin(req);
    const paymentMethod = requestedPaymentMethod;
    const isCod = String(paymentMethod).toLowerCase().includes("cod") || String(paymentMethod).toLowerCase().includes("cash");
    const order = {
      source,
      order_ref: orderRef,
      status: shouldCreateShipment ? "created" : "confirmed",
      payment_status: requestedPaymentStatus,
      payment_method: paymentMethod,
      delivery_method: shouldCreateShipment ? "delivery" : requestedDeliveryMethod,
      created_at: timestamp,
      updated_at: timestamp,
      amount_egp: multiTotal,
      shipping_egp: 0,
      discount_egp: 0,
      amount_cents: Math.round(multiTotal * 100),
      customer: {
        first_name: body.customerName || "Custom order",
        last_name: "",
        phone,
        email: body.email || "",
        city,
        governorate: body.governorate || "",
        address,
      },
      items: builtItems,
      extras: {
        is_custom_order: hasSpecial,
        exclude_from_stock_consumption: hasSpecial,
        exclude_from_catalog_product_sales: hasSpecial,
        custom_order_note: body.notes || "",
        special_product_brief: body.specialProductBrief || "",
        manual_order_kind: hasSpecial && hasCatalog ? "mixed" : hasSpecial ? "special" : "catalog",
        custom_order_quantity: multiQuantity,
        created_from_admin_manual_order: true,
        selected_catalog_products: builtItems.filter((item) => item.selected_from_catalog).map((item) => ({
          id: item.id,
          slug: item.slug,
          name: item.name,
          size: item.size || null,
          quantity: item.quantity,
        })),
        bosta_created_from_manual_order: shouldCreateShipment,
      },
      admin_audit: [
        {
          action: "admin_custom_order_created",
          timestamp,
          source: "admin_dashboard",
          note: body.notes || "Admin added manual multi-item order.",
        },
      ],
    };

    const logRes = await fetch(`${appOrigin}/api/orders/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-secret": process.env.BOSTA_INTERNAL_API_SECRET || "",
      },
      body: JSON.stringify(order),
      cache: "no-store",
    });
    const logData = await logRes.json().catch(() => null);
    if (!logRes.ok) {
      return NextResponse.json({ error: "Failed to save custom order", details: logData }, { status: 502 });
    }

    if (!shouldCreateShipment) {
      return NextResponse.json({ success: true, order_ref: orderRef, order });
    }

    const shipmentRes = await fetch(`${appOrigin}/api/bosta/shipment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderRef,
        customer: order.customer,
        items: builtItems.map((item) => ({
          name: item.name,
          title: item.name,
          slug: item.slug,
          type: item.type,
          size: item.size,
          quantity: item.quantity,
        })),
        totalValue: multiTotal,
        cod: isCod,
        codAmount: isCod ? toNumber(body.codAmount) || multiTotal : 0,
      }),
      cache: "no-store",
    });
    const shipmentData = await shipmentRes.json().catch(() => null);
    if (!shipmentRes.ok || !shipmentData?.success) {
      await fetch(`${appOrigin}/api/orders/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...order,
          source: `${source}_bosta_failed`,
          status: "confirmed",
          bosta: { error: shipmentData?.details || shipmentData?.error || "Bosta shipment failed" },
          updated_at: new Date().toISOString(),
        }),
        cache: "no-store",
      });
      return NextResponse.json({
        error: "Custom order saved, but Bosta shipment failed",
        order_ref: orderRef,
        details: shipmentData?.details || shipmentData?.error || "Bosta shipment failed",
      }, { status: 502 });
    }

    const shippedOrder = {
      ...order,
      source: `${source}_bosta_created`,
      status: "shipped",
      bosta: {
        provider: shipmentData.provider,
        trackingNumber: shipmentData.trackingNumber,
        trackingLink: shipmentData.trackingLink,
        labelUrl: shipmentData.labelUrl,
        guid: shipmentData.guid,
        status: "Record created",
        adminCreatedAt: new Date().toISOString(),
        error: "",
      },
      shipment: {
        provider: "bosta",
        trackingNumber: shipmentData.trackingNumber,
        trackingLink: shipmentData.trackingLink,
      },
      updated_at: new Date().toISOString(),
    };

    const shipmentLogRes = await fetch(`${appOrigin}/api/orders/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(shippedOrder),
      cache: "no-store",
    });
    const shipmentLogData = await shipmentLogRes.json().catch(() => null);
    if (!shipmentLogRes.ok) {
      return NextResponse.json({
        error: "Bosta shipment created, but failed to update dashboard order",
        order_ref: orderRef,
        trackingNumber: shipmentData.trackingNumber,
        details: shipmentLogData,
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      order_ref: orderRef,
      trackingNumber: shipmentData.trackingNumber,
      trackingLink: shipmentData.trackingLink,
      order: shippedOrder,
    });
  }

  const catalogProducts = orderKind === "catalog" && productSlug ? await getCatalogProducts({ live: true }) : [];
  const selectedProduct = orderKind === "catalog" && productSlug
    ? catalogProducts.find((product) => product.slug === productSlug)
    : null;

  if (orderKind === "catalog" && productSlug && !selectedProduct) {
    return NextResponse.json({ error: "Selected product was not found in catalog" }, { status: 400 });
  }

  if (orderKind === "catalog" && !productSlug) {
    return NextResponse.json({ error: "Select a catalog product or switch to Special custom product" }, { status: 400 });
  }

  if (selectedProduct) {
    const sizeStock = productSize ? getProductSizeStock(selectedProduct, productSize) : null;
    if (
      selectedProduct.stockStatus === "out_of_stock" ||
      sizeStock?.status === "out_of_stock" ||
      sizeStock?.quantity === 0
    ) {
      return NextResponse.json({ error: "Selected product or size is out of stock" }, { status: 409 });
    }
  }

  const timestamp = new Date().toISOString();
  const orderRef = `CUSTOM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const appOrigin = getAppOrigin(req);
  const paymentMethod = requestedPaymentMethod;
  const isCod = String(paymentMethod).toLowerCase().includes("cod") || String(paymentMethod).toLowerCase().includes("cash");
  const catalogUnitPrice = selectedProduct ? getProductSizePrice(selectedProduct, productSize) : 0;
  const finalUnitPrice = unitPrice || catalogUnitPrice || Math.round(total / quantity);
  const item = {
    id: selectedProduct?.id,
    slug: selectedProduct?.slug,
    name: selectedProduct?.name || title,
    size: productSize || undefined,
    quantity,
    unit_price_egp: finalUnitPrice,
    line_total_egp: total,
    price: finalUnitPrice,
    type: selectedProduct?.type || "special_custom_product",
    isCustomOrder: !selectedProduct,
    isSpecialProduct: orderKind === "special",
    special_product_brief: body.specialProductBrief || "",
    catalog_source: orderKind === "special" ? "admin_special_order" : "admin_catalog_order",
    selected_from_catalog: Boolean(selectedProduct),
  };

  const order = {
    source: orderKind === "special" ? "admin_special_order" : "admin_catalog_order",
    order_ref: orderRef,
    status: shouldCreateShipment ? "created" : "confirmed",
    payment_status: requestedPaymentStatus,
    payment_method: paymentMethod,
    delivery_method: shouldCreateShipment ? "delivery" : requestedDeliveryMethod,
    created_at: timestamp,
    updated_at: timestamp,
    amount_egp: total,
    shipping_egp: 0,
    discount_egp: 0,
    amount_cents: Math.round(total * 100),
    customer: {
      first_name: body.customerName || "Custom order",
      last_name: "",
      phone,
      email: body.email || "",
      city,
      governorate: body.governorate || "",
      address,
    },
    items: [item],
    extras: {
      is_custom_order: !selectedProduct,
      exclude_from_stock_consumption: !selectedProduct,
      exclude_from_catalog_product_sales: !selectedProduct,
      custom_order_note: body.notes || "",
      special_product_brief: body.specialProductBrief || "",
      manual_order_kind: orderKind,
      special_product_explanation:
        orderKind === "special"
          ? "Special product manufactured for this customer. It does not exist on the website catalog and is excluded from stock/product ranking."
          : "Catalog product order created manually from admin dashboard.",
      custom_order_quantity: quantity,
      created_from_admin_manual_order: true,
      selected_catalog_product: selectedProduct
        ? {
            id: selectedProduct.id,
            slug: selectedProduct.slug,
            name: selectedProduct.name,
            size: productSize || null,
          }
        : null,
      bosta_created_from_manual_order: shouldCreateShipment,
    },
    admin_audit: [
      {
        action: "admin_custom_order_created",
        timestamp,
        source: "admin_dashboard",
        note: body.notes || "Admin added custom/bulk order for finance tracking.",
      },
    ],
  };

  const logRes = await fetch(`${appOrigin}/api/orders/log`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-secret": process.env.BOSTA_INTERNAL_API_SECRET || "",
    },
    body: JSON.stringify(order),
    cache: "no-store",
  });

  const logData = await logRes.json().catch(() => null);
  if (!logRes.ok) {
    return NextResponse.json(
      { error: "Failed to save custom order", details: logData },
      { status: 502 },
    );
  }

  if (!shouldCreateShipment) {
    return NextResponse.json({
      success: true,
      order_ref: orderRef,
      order,
    });
  }

  const shipmentRes = await fetch(`${appOrigin}/api/bosta/shipment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderRef,
      customer: order.customer,
      items: [{ name: item.name, quantity }],
      totalValue: total,
      cod: isCod,
      codAmount: isCod ? toNumber(body.codAmount) || total : 0,
    }),
    cache: "no-store",
  });

  const shipmentData = await shipmentRes.json().catch(() => null);
  if (!shipmentRes.ok || !shipmentData?.success) {
    await fetch(`${appOrigin}/api/orders/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...order,
        source: orderKind === "special" ? "admin_special_order_bosta_failed" : "admin_catalog_order_bosta_failed",
        status: "confirmed",
        bosta: {
          error: shipmentData?.details || shipmentData?.error || "Bosta shipment failed",
        },
        updated_at: new Date().toISOString(),
      }),
      cache: "no-store",
    });

    return NextResponse.json(
      {
        error: "Custom order saved, but Bosta shipment failed",
        order_ref: orderRef,
        details: shipmentData?.details || shipmentData?.error || "Bosta shipment failed",
      },
      { status: 502 },
    );
  }

  const shippedOrder = {
    ...order,
    source: orderKind === "special" ? "admin_special_order_bosta_created" : "admin_catalog_order_bosta_created",
    status: "shipped",
    bosta: {
      provider: shipmentData.provider,
      trackingNumber: shipmentData.trackingNumber,
      trackingLink: shipmentData.trackingLink,
      labelUrl: shipmentData.labelUrl,
      guid: shipmentData.guid,
      status: "Record created",
      adminCreatedAt: new Date().toISOString(),
      error: "",
    },
    shipment: {
      provider: "bosta",
      trackingNumber: shipmentData.trackingNumber,
      trackingLink: shipmentData.trackingLink,
    },
    updated_at: new Date().toISOString(),
  };

  const shipmentLogRes = await fetch(`${appOrigin}/api/orders/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(shippedOrder),
    cache: "no-store",
  });

  const shipmentLogData = await shipmentLogRes.json().catch(() => null);
  if (!shipmentLogRes.ok) {
    return NextResponse.json(
      {
        error: "Bosta shipment created, but failed to update dashboard order",
        order_ref: orderRef,
        trackingNumber: shipmentData.trackingNumber,
        details: shipmentLogData,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    order_ref: orderRef,
    trackingNumber: shipmentData.trackingNumber,
    order: shippedOrder,
  });
}
