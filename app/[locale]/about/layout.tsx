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
    path: "about",
    title: "About natOnat",
    description:
      "Learn about natOnat, an Egypt-based travel accessories brand creating practical luggage covers, passport wallets, and packing products.",
  });
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
