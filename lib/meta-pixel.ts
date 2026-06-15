"use client";

export type MetaPixelParams = Record<string, unknown>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    ttq?: {
      page?: () => void;
      track?: (event: string, params?: Record<string, unknown>) => void;
    };
  }
}

type CommerceContent = {
  id?: string | number;
  content_id?: string | number;
  quantity?: number;
  item_price?: number;
  price?: number;
};

const googleEventNames: Record<string, string> = {
  ViewContent: "view_item",
  AddToCart: "add_to_cart",
  InitiateCheckout: "begin_checkout",
  Purchase: "purchase",
};

const tiktokEventNames: Record<string, string> = {
  ViewContent: "ViewContent",
  AddToCart: "AddToCart",
  InitiateCheckout: "InitiateCheckout",
  Purchase: "CompletePayment",
};

function normalizeContents(params: MetaPixelParams): CommerceContent[] {
  if (Array.isArray(params.contents)) {
    return params.contents as CommerceContent[];
  }

  if (!Array.isArray(params.content_ids)) return [];

  const contentIds = params.content_ids as Array<string | number>;
  const totalValue = Number(params.value || 0);
  const totalQuantity = Number(params.quantity || params.num_items || 1);
  const itemPrice =
    contentIds.length === 1 && totalQuantity > 0
      ? totalValue / totalQuantity
      : undefined;

  return contentIds.map((id) => ({
    id,
    quantity: contentIds.length === 1 ? totalQuantity : 1,
    item_price: itemPrice,
  }));
}

export function trackMetaPixelEvent(event: string, params?: MetaPixelParams) {
  if (typeof window === "undefined") return false;

  const eventParams = params || {};
  const contents = normalizeContents(eventParams);
  const currency = String(eventParams.currency || "EGP");
  const value = Number(eventParams.value || 0);

  window.fbq?.("track", event, eventParams);

  const googleEvent = googleEventNames[event];
  if (googleEvent) {
    window.gtag?.("event", googleEvent, {
      currency,
      value,
      transaction_id:
        eventParams.transaction_id || eventParams.order_id || undefined,
      items: contents.map((content) => ({
        item_id: String(content.id || content.content_id || ""),
        item_name: eventParams.content_name,
        price: Number(content.item_price ?? content.price ?? 0),
        quantity: Number(content.quantity || 1),
      })),
    });
  }

  const tiktokEvent = tiktokEventNames[event];
  if (tiktokEvent) {
    window.ttq?.track?.(tiktokEvent, {
      content_ids:
        eventParams.content_ids ||
        contents.map((content) =>
          String(content.id || content.content_id || "")
        ),
      content_name: eventParams.content_name,
      content_type: eventParams.content_type || "product",
      contents: contents.map((content) => ({
        content_id: String(content.id || content.content_id || ""),
        quantity: Number(content.quantity || 1),
        price: Number(content.item_price ?? content.price ?? 0),
      })),
      value,
      currency,
    });
  }

  return Boolean(window.fbq || window.gtag || window.ttq?.track);
}
