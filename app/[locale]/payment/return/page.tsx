"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { useCart } from "@/app/lib/cart-context";

const EXTERNAL_SUCCESS_URL = "https://www.natonat.com/";

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<PaymentLoading />}>
      <PaymentReturnContent />
    </Suspense>
  );
}

function PaymentLoading() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F1EBE3] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-lg">
          <p className="text-[#0F1A26]/60">Checking payment status...</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const { clearCart, setBuyNowItem } = useCart();

  const success = searchParams.get("success");
  const pending = searchParams.get("pending");
  const orderRef = searchParams.get("order_ref") || "";
  const transactionId = searchParams.get("id") || "";

  const isSuccess = success === "true" || success === "True" || success === "1";
  const isPending = pending === "true" || pending === "True" || pending === "1";

  useEffect(() => {
    if (!isSuccess) return;

    clearCart();
    setBuyNowItem(null);

    const redirectUrl = `${EXTERNAL_SUCCESS_URL}?order_ref=${encodeURIComponent(
      orderRef
    )}&transaction_id=${encodeURIComponent(transactionId)}`;

    const timer = window.setTimeout(() => {
      window.location.replace(redirectUrl);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [isSuccess, orderRef, transactionId, clearCart, setBuyNowItem]);

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
              ? "Payment Successful"
              : isPending
                ? "Payment Pending"
                : "Payment Failed"}
          </h1>

          <p className="text-[#0F1A26]/60 mb-6 leading-relaxed">
            {isSuccess
              ? "Payment approved. Redirecting you now..."
              : isPending
                ? "Your payment is pending. We will update your order once confirmed."
                : "Your payment was not completed. Please try again."}
          </p>

          {orderRef && (
            <div className="bg-[#F1EBE3] rounded-2xl p-4 mb-6">
              <p className="text-xs text-[#0F1A26]/50 mb-1">Order Reference</p>
              <p className="text-sm font-bold text-[#0F1A26] break-all">
                {orderRef}
              </p>
            </div>
          )}

          {!isSuccess && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/checkout" className="flex-1">
                <Button className="w-full bg-[#EEBC3F] text-[#0F1A26] hover:bg-[#0F1A26] hover:text-white rounded-full h-12 font-bold">
                  Try Again
                </Button>
              </Link>

              <Link href="/shop" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full border-[#0F1A26]/10 text-[#0F1A26] hover:bg-[#F1EBE3] rounded-full h-12 font-bold"
                >
                  Back to Shop
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}