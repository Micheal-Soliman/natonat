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
    path: "contact",
    title: "Contact natOnat",
    description:
      "Contact natOnat for orders, sizing help, shipping questions, and support for luggage covers and travel accessories in Egypt.",
  });
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
