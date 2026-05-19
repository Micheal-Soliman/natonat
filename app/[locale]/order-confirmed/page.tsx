"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, ShoppingBag } from "lucide-react";
import { useCart } from "@/app/lib/cart-context";

export default function OrderConfirmedPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <OrderConfirmedContent />
    </Suspense>
  );
}

function LoadingState() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F1EBE3] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-lg">
          <p className="text-[#0F1A26]/60 font-medium">Loading order status...</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

function OrderConfirmedContent() {
  const searchParams = useSearchParams();
  const { clearCart, setBuyNowItem } = useCart();

  const orderRef = searchParams.get("order_ref") || "";
  const method = searchParams.get("method") || "";
  const transactionId = searchParams.get("id") || "";
  const amountCents = searchParams.get("amount_cents") || "";

  const successParam = searchParams.get("success");
  const pendingParam = searchParams.get("pending");

  const isCard = method === "card";

  const isSuccess =
    !isCard ||
    successParam === "true" ||
    successParam === "True" ||
    successParam === "1";

  const isPending =
    pendingParam === "true" ||
    pendingParam === "True" ||
    pendingParam === "1";

  const isFailed = isCard && !isSuccess && !isPending;

  const amount = amountCents ? Number(amountCents) / 100 : null;

  useEffect(() => {
    if (isSuccess) {
      clearCart();
      setBuyNowItem(null);
    }
  }, [isSuccess, clearCart, setBuyNowItem]);

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
            {isSuccess
              ? "Order Confirmed"
              : isPending
                ? "Payment Pending"
                : "Payment Failed"}
          </h1>

          <p className="text-[#0F1A26]/60 mb-6 leading-relaxed">
            {isSuccess
              ? "Thank you. Your order has been confirmed successfully."
              : isPending
                ? "Your payment is pending. We will update your order once confirmed."
                : "Your payment was not completed. Please try again."}
          </p>

          <div className="bg-[#F1EBE3] rounded-2xl p-5 mb-6 space-y-3 text-left">
            {orderRef && (
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-[#0F1A26]/50">Order Reference</span>
                <span className="font-semibold text-[#0F1A26] break-all text-right">
                  {orderRef}
                </span>
              </div>
            )}

            {method && (
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-[#0F1A26]/50">Payment Method</span>
                <span className="font-semibold text-[#0F1A26] capitalize">
                  {method}
                </span>
              </div>
            )}

            {transactionId && (
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-[#0F1A26]/50">Transaction ID</span>
                <span className="font-semibold text-[#0F1A26] break-all text-right">
                  {transactionId}
                </span>
              </div>
            )}

            {amount !== null && Number.isFinite(amount) && (
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-[#0F1A26]/50">Amount</span>
                <span className="font-semibold text-[#0F1A26]">
                  EGP {amount}
                </span>
              </div>
            )}
          </div>

          {isSuccess && (
            <div className="mb-6 rounded-2xl bg-green-50 border border-green-100 p-4">
              <p className="text-sm text-green-700 font-medium">
                Your purchase has been tracked successfully.
              </p>
            </div>
          )}

          {isFailed && (
            <div className="mb-6 rounded-2xl bg-red-50 border border-red-100 p-4">
              <p className="text-sm text-red-700 font-medium">
                If money was deducted, please contact support with your order reference.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {isFailed ? (
              <Link href="/checkout" className="flex-1">
                <Button className="w-full bg-[#EEBC3F] text-[#0F1A26] hover:bg-[#0F1A26] hover:text-white rounded-full h-12 font-bold">
                  Try Again
                </Button>
              </Link>
            ) : null}

            <Link href="/shop" className="flex-1">
              <Button className="w-full bg-[#0F1A26] text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26] rounded-full h-12 font-bold">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}