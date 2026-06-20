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
    path: "legal/terms",
    title: "Terms & Conditions",
    description:
      "Read natOnat terms and conditions for product orders, payments, delivery, returns, warranties, and website use.",
  });
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
