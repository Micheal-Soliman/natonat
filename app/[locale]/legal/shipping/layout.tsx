import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return createPageMetadata({
    locale,
    path: "legal/shipping",
    title: "Shipping Policy",
    description:
      "Read natOnat shipping information for delivery coverage, timelines, tracking, fees, and order handling in Egypt.",
  });
}

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
