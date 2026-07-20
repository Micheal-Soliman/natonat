"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, ShoppingBag, MessageCircle, Truck } from "lucide-react";
import { useCart } from "@/app/lib/cart-context";
import { trackMetaPixelEvent } from "@/lib/meta-pixel";

export default function OrderConfirmedPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <OrderConfirmedContent />
    </Suspense>
  );
}

function LoadingState() {
  const t = useTranslations("orderConfirmed");

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F1EBE3] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-lg">
          <p className="text-[#0F1A26]/60 font-medium">{t("loading")}</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

function clearSavedRescueDiscountCode() {
  try {
    window.sessionStorage.removeItem("natonat-saved-discount-code");
    window.localStorage.removeItem("natonat-saved-discount-code");
  } catch {
    // Ignore storage errors.
  }
}

function OrderConfirmedContent() {
  const searchParams = useSearchParams();
  const t = useTranslations("orderConfirmed");
  const { clearCart, setBuyNowItem } = useCart();

  const orderRef = searchParams.get("order_ref") || "";
  const methodFromUrl = searchParams.get("method") || "";
  const transactionIdFromUrl = searchParams.get("id") || "";
  const amountCentsFromUrl = searchParams.get("amount_cents") || "";

  type VerificationStatus =
    | "checking"
    | "success"
    | "pending"
    | "failed"
    | "not_found";

  type VerifiedOrder = {
    status?: string;
    payment_status?: string;
    payment_method?: string;
    amount_egp?: number;
    amount_cents?: number;
    payment?: {
      transaction_id?: string | number;
      amount_cents?: number;
    };
    customer?: {
      email?: string;
      phone?: string;
    };
    bosta?: {
      trackingNumber?: string;
      labelUrl?: string;
      guid?: string;
    } | null;
    shipment?: {
      trackingNumber?: string;
      labelUrl?: string;
      guid?: string;
    } | null;
    aramex?: {
      trackingNumber?: string;
      labelUrl?: string;
      guid?: string;
    } | null;
    items?: {
      id?: number;
      name?: string;
      type?: string;
      price_egp?: number;
      price?: number;
      quantity?: number;
      size?: string;
      color?: string;
      image?: string;
      slug?: string;
      isBundle?: boolean;
      bundleSelections?: {
        productName?: string;
        label?: string;
        size?: string;
        color?: string;
        quantity?: number;
        price?: number;
      }[];
    }[];
  };

  type OrderLogApiResponse = {
    success?: boolean;
    order?: VerifiedOrder;
    error?: string;
  };

  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("checking");
  const [verifiedOrder, setVerifiedOrder] = useState<VerifiedOrder | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function verifyOrder() {
      if (!orderRef) {
        setVerificationStatus("not_found");
        return;
      }

      const maxAttempts = methodFromUrl === "card" ? 6 : 1;
      let orderWasFound = false;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const response = await fetch(
            `/api/orders/log?order_ref=${encodeURIComponent(orderRef)}`,
            {
              cache: "no-store",
              signal: controller.signal,
            }
          );

          if (response.ok) {
            const result = (await response.json()) as OrderLogApiResponse;
            const order = result.order;

            if (!order) {
              setVerificationStatus("not_found");
              return;
            }

            const paymentStatus = (order.payment_status || "").toLowerCase();
            const orderStatus = (order.status || "").toLowerCase();
            const paymentMethod = (
              order.payment_method ||
              methodFromUrl
            ).toLowerCase();
            const isCard =
              paymentMethod.includes("card") ||
              paymentMethod.includes("paymob");

            orderWasFound = true;
            setVerifiedOrder(order);

            if (paymentStatus === "paid" || paymentStatus === "success") {
              setVerificationStatus("success");
              return;
            }

            if (
              paymentStatus === "failed" ||
              orderStatus === "failed" ||
              orderStatus === "cancelled"
            ) {
              setVerificationStatus("failed");
              return;
            }

            if (
              !isCard &&
              (paymentMethod === "cod" ||
                ["confirmed", "shipped", "completed"].includes(orderStatus))
            ) {
              setVerificationStatus("success");
              return;
            }
          } else if (response.status !== 404) {
            setVerificationStatus("failed");
            return;
          }
        } catch (error) {
          if (controller.signal.aborted) return;
          console.error("Failed to verify order:", error);
        }

        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 1500));
        }
      }

      setVerificationStatus(orderWasFound ? "pending" : "not_found");
    }

    verifyOrder();
    return () => controller.abort();
  }, [methodFromUrl, orderRef]);

  const isSuccess = verificationStatus === "success";
  const isPending =
    verificationStatus === "checking" || verificationStatus === "pending";
  const isFailed =
    verificationStatus === "failed" || verificationStatus === "not_found";
  const method = verifiedOrder?.payment_method || methodFromUrl;
  const transactionId =
    verifiedOrder?.payment?.transaction_id || transactionIdFromUrl;
  const verifiedAmountCents =
    verifiedOrder?.payment?.amount_cents || verifiedOrder?.amount_cents;
  const amount =
    verifiedOrder?.amount_egp ??
    (verifiedAmountCents
      ? Number(verifiedAmountCents) / 100
      : amountCentsFromUrl
        ? Number(amountCentsFromUrl) / 100
        : null);
  const trackingNumber =
    verifiedOrder?.bosta?.trackingNumber ||
    verifiedOrder?.shipment?.trackingNumber ||
    verifiedOrder?.aramex?.trackingNumber;
  const orderItems = verifiedOrder?.items || [];
  const supportMessage = encodeURIComponent(
    t("messages.supportWhatsapp", { orderRef: orderRef || "" })
  );
  const supportHref = `https://wa.me/201070004227?text=${supportMessage}`;

  useEffect(() => {
    if (verificationStatus === "success") {
      const dedupeKey = orderRef ? `meta-purchase-${orderRef}` : "";
      const wasTracked =
        dedupeKey && window.localStorage.getItem(dedupeKey) === "1";

      if (!wasTracked) {
        const storedPayload = orderRef
          ? window.sessionStorage.getItem(`meta-purchase-payload-${orderRef}`)
          : null;
        let purchasePayload: Record<string, unknown> = {};

        if (storedPayload) {
          try {
            purchasePayload = JSON.parse(storedPayload) as Record<string, unknown>;
          } catch {
            purchasePayload = {};
          }
        }

        trackMetaPixelEvent("Purchase", {
          ...purchasePayload,
          event_id: orderRef ? `Purchase:${orderRef}` : undefined,
          value:
            amount && Number.isFinite(amount)
              ? amount
              : purchasePayload.value || 0,
          currency: "EGP",
          order_id: orderRef,
          transaction_id: transactionId,
          email: verifiedOrder?.customer?.email,
          phone: verifiedOrder?.customer?.phone,
        });

        if (dedupeKey) {
          window.localStorage.setItem(dedupeKey, "1");
        }
        if (orderRef) {
          window.sessionStorage.removeItem(`meta-purchase-payload-${orderRef}`);
        }
      }

      clearCart();
      setBuyNowItem(null);
      clearSavedRescueDiscountCode();
    }
  }, [
    verificationStatus,
    amount,
    orderRef,
    transactionId,
    verifiedOrder?.customer?.email,
    verifiedOrder?.customer?.phone,
    clearCart,
    setBuyNowItem,
  ]);

  return (
    <>
      <Navigation />

      <main className="min-h-screen bg-[#F1EBE3] flex items-center justify-center px-4 py-32">
        <div className="bg-white rounded-3xl p-8 md:p-10 max-w-lg w-full text-center shadow-xl border border-[#0F1A26]/5">
          <div className="mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center bg-[#EEBC3F]/15">
            {isSuccess ? (
              <CheckCircle className="w-11 h-11 text-green-600" />
            ) : isPending ? (
              <Clock className="w-11 h-11 text-[#EEBC3F]" />
            ) : (
              <XCircle className="w-11 h-11 text-red-600" />
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1A26] mb-3">
            {verificationStatus === "checking"
              ? t("status.checkingTitle")
              : isSuccess
                ? t("status.successTitle")
                : isPending
                  ? t("status.pendingTitle")
                  : verificationStatus === "not_found"
                    ? t("status.notFoundTitle")
                    : t("status.failedTitle")}
          </h1>

          <p className="text-[#0F1A26]/60 mb-6 leading-relaxed">
            {verificationStatus === "checking"
              ? t("status.checkingDescription")
              : isSuccess
                ? t("status.successDescription")
                : isPending
                  ? t("status.pendingDescription")
                  : verificationStatus === "not_found"
                    ? t("status.notFoundDescription")
                    : t("status.failedDescription")}
          </p>

          <div className="bg-[#F1EBE3] rounded-2xl p-5 mb-6 space-y-3 text-left">
            {orderRef && (
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-[#0F1A26]/50">
                  {t("labels.orderReference")}
                </span>
                <span className="font-semibold text-[#0F1A26] break-all text-right">
                  {orderRef}
                </span>
              </div>
            )}

            {method && (
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-[#0F1A26]/50">
                  {t("labels.paymentMethod")}
                </span>
                <span className="font-semibold text-[#0F1A26] capitalize">
                  {method}
                </span>
              </div>
            )}

            {transactionId && (
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-[#0F1A26]/50">
                  {t("labels.transactionId")}
                </span>
                <span className="font-semibold text-[#0F1A26] break-all text-right">
                  {transactionId}
                </span>
              </div>
            )}

            {amount !== null && Number.isFinite(amount) && (
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-[#0F1A26]/50">
                  {t("labels.amount")}
                </span>
                <span className="font-semibold text-[#0F1A26]">
                  EGP {amount}
                </span>
              </div>
            )}
          </div>

          {orderItems.length > 0 && (
            <div className="mb-6 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] p-4 text-left">
              <h2 className="mb-3 text-sm font-bold text-[#0F1A26]">
                {t("labels.orderItems")}
              </h2>
              <div className="space-y-3">
                {orderItems.map((item, index) => {
                  const itemPrice = item.price_egp ?? item.price ?? 0;
                  return (
                    <div key={`${item.id || item.name}-${index}`} className="rounded-xl bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#0F1A26]">
                            {item.name || t("labels.product")}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-semibold text-[#0F1A26]/55">
                            {item.type && <span>{item.type}</span>}
                            {item.size && <span>{item.size.toUpperCase()}</span>}
                            {item.color && <span>{item.color}</span>}
                            <span>x{item.quantity || 1}</span>
                          </div>
                        </div>
                        {itemPrice > 0 && (
                          <span className="shrink-0 text-sm font-bold text-[#0F1A26]">
                            EGP {itemPrice * (item.quantity || 1)}
                          </span>
                        )}
                      </div>

                      {item.bundleSelections?.length ? (
                        <div className="mt-2 space-y-1 border-t border-[#0F1A26]/10 pt-2">
                          {item.bundleSelections.map((selection, selectionIndex) => (
                            <div key={`${selection.productName}-${selectionIndex}`} className="flex items-center justify-between gap-2 text-xs text-[#0F1A26]/65">
                              <span className="min-w-0 truncate">
                                {selectionIndex + 1}. {selection.productName || selection.label}
                              </span>
                              <span className="shrink-0 text-right">
                                {[selection.size?.toUpperCase(), selection.color, `x${selection.quantity || 1}`]
                                  .filter(Boolean)
                                  .join(" / ")}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isSuccess && (
            <div className="mb-6 space-y-3">
              <div className="rounded-2xl bg-green-50 border border-green-100 p-4">
                <p className="text-sm text-green-700 font-medium">
                  {t("messages.recorded")}
                </p>
              </div>
              <div className="rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] p-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEBC3F]/15">
                    <Truck className="h-5 w-5 text-[#EEBC3F]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0F1A26]">
                      {t("labels.shippingStatus")}
                    </p>
                    <p className="mt-1 text-sm text-[#0F1A26]/60">
                      {trackingNumber
                        ? t("messages.shipmentCreated")
                        : t("messages.trackingPending")}
                    </p>
                    {trackingNumber && (
                      <p className="mt-2 text-sm font-bold text-[#0F1A26]" dir="ltr">
                        {trackingNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isFailed && (
            <div className="mb-6 rounded-2xl bg-red-50 border border-red-100 p-4">
              <p className="text-sm text-red-700 font-medium">
                {verificationStatus === "not_found"
                  ? t("messages.cannotConfirm")
                  : t("messages.moneyDeducted")}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <a href={supportHref} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] text-white hover:bg-[#128C4A] h-12 font-bold">
                <MessageCircle className="h-4 w-4" />
                {t("actions.whatsappSupport")}
              </Button>
            </a>
            {isFailed ? (
              <Link href="/checkout" className="flex-1">
                <Button className="w-full bg-[#EEBC3F] text-[#0F1A26] hover:bg-[#0F1A26] hover:text-white rounded-full h-12 font-bold">
                  {t("actions.tryAgain")}
                </Button>
              </Link>
            ) : null}

            <Link href="/shop" className="flex-1">
              <Button className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0F1A26] text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26] h-12 font-bold">
                <ShoppingBag className="h-4 w-4" />
                {t("actions.continueShopping")}
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
