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
    path: "reviews",
    title: "Customer Reviews",
    description:
      "See real customer reviews and travel photos for natOnat luggage covers, passport wallets, and PackOnat.",
  });
}

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
