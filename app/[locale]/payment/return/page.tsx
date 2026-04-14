"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

function PaymentReturnContent() {
  const searchParams = useSearchParams();

  const success = searchParams.get("success");
  const pending = searchParams.get("pending");
  const canceled = searchParams.get("canceled");

  const status = success
    ? "success"
    : pending
      ? "pending"
      : canceled
        ? "canceled"
        : "unknown";

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F1EBE3]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-3xl font-bold text-[#0F1A26] mb-3">
            {status === "success"
              ? "Payment successful"
              : status === "pending"
                ? "Payment pending"
                : status === "canceled"
                  ? "Payment canceled"
                  : "Payment status"}
          </h1>
          <p className="text-[#0F1A26]/60 mb-10">
            {status === "success"
              ? "Your payment was completed."
              : status === "pending"
                ? "Your payment is still processing."
                : status === "canceled"
                  ? "You canceled the payment."
                  : "You can go back to checkout and try again."}
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link href="/shop">
              <Button className="bg-[#0F1A26] text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26] rounded-full px-8 h-12 font-semibold transition-all duration-300">
                Continue shopping
              </Button>
            </Link>
            <Link href="/checkout">
              <Button variant="outline" className="rounded-full px-8 h-12 font-semibold">
                Back to checkout
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense>
      <PaymentReturnContent />
    </Suspense>
  );
}
