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
    path: "legal/warranty",
    title: "Warranty & Returns",
    description:
      "Learn about natOnat warranty coverage, returns, exchanges, claim steps, and product care guidance.",
  });
}

export default function WarrantyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
