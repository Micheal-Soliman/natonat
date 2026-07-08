import { Suspense } from "react";
import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { Navigation } from "@/app/sections/navigation";
import Hero from "@/app/sections/hero";
import { BenefitsStrip } from "@/app/sections/benefits-strip";
import { FeaturedCollections } from "@/app/sections/featured-collections";
import { HowItWorks } from "@/app/sections/how-it-works";
import { ArticlesSection } from "@/app/sections/articles-section";
import { Footer } from "@/app/sections/footer";
import { Loading } from "@/app/components/loading";
import { FlashSaleModal } from "@/app/components/flash-sale-modal";
import { FlashSaleSection } from "@/app/sections/flash-sale-carousel-section";
import { createPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/sanity-site-settings";

const BestSellers = dynamic(
  () => import("@/app/sections/best-sellers").then((mod) => mod.BestSellers),
  {
    loading: () => <SectionPlaceholder />,
  }
);

const SocialProof = dynamic(
  () => import("@/app/sections/social-proof").then((mod) => mod.SocialProof),
  {
    loading: () => <SectionPlaceholder />,
  }
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isArabic = locale === "ar";

  return createPageMetadata({
    locale,
    title: isArabic
      ? "نات أونات | مستلزمات سفر في مصر"
      : "natOnat | Travel Accessories in Egypt",
    description: isArabic
      ? "تسوق أغلفة شنط السفر، محافظ الباسبور، وباك أونات من نات أونات داخل مصر."
      : "Shop natOnat luggage covers, passport wallets, and PackOnat organizers in Egypt. Protect your luggage and travel smarter.",
  });
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const settings = await getSiteSettings();

  return (
    <Suspense fallback={<Loading />}>
      <HomeContent
        locale={locale}
        flashSale={settings.flashSale}
        flashSaleSection={settings.flashSaleSection}
      />
    </Suspense>
  );
}

function SectionPlaceholder() {
  return (
    <div className="py-20 bg-[#F1EBE3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-96 rounded-3xl bg-white/80 animate-pulse" />
      </div>
    </div>
  );
}

function HomeContent({
  locale,
  flashSale,
  flashSaleSection,
}: {
  locale: string;
  flashSale: Awaited<ReturnType<typeof getSiteSettings>>["flashSale"];
  flashSaleSection: Awaited<ReturnType<typeof getSiteSettings>>["flashSaleSection"];
}) {
  return (
    <>
      <FlashSaleModal settings={flashSale} />
      <Navigation />
      <main>
        <Hero />
        <BenefitsStrip />
        <FlashSaleSection settings={flashSaleSection} />
        <FeaturedCollections />
        <BestSellers />
        <HowItWorks />
        <ArticlesSection locale={locale} />
        <SocialProof />
      </main>
      <Footer />
    </>
  );
}
