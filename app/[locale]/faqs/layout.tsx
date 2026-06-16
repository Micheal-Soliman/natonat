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
    path: "faqs",
    title: "FAQs",
    description:
      "Answers about natOnat luggage cover sizing, washing, shipping, payment, returns, passport wallets, and travel accessories.",
  });
}

export default function FaqsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
