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
    path: "how-it-works",
    title: "Luggage Cover Size Guide",
    description:
      "Find the right natOnat luggage cover size by measuring suitcase height without wheels. Simple sizing for S, M, L, and XL covers.",
  });
}

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
