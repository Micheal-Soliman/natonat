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
    path: "legal/privacy",
    title: "Privacy Policy",
    description:
      "Read natOnat's privacy policy covering customer data, orders, payments, support, and website usage.",
  });
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
