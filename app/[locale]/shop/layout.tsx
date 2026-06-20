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
    path: "shop",
    title: "Shop Luggage Covers, Passport Wallets & Travel Sets",
    description:
      "Shop natOnat travel accessories in Egypt, including washable luggage covers, RFID passport wallets, PackOnat organizers, and bundle offers.",
  });
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
