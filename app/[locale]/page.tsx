import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Navigation } from "@/app/sections/navigation";
import Hero from "@/app/sections/hero";
import { BenefitsStrip } from "@/app/sections/benefits-strip";
import { FeaturedCollections } from "@/app/sections/featured-collections";
import { TravelSets } from "@/app/sections/travel-sets";
import { HowItWorks } from "@/app/sections/how-it-works";
import { ArticlesSection } from "@/app/sections/articles-section";
import { Footer } from "@/app/sections/footer";
import { Loading } from "@/app/components/loading";

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

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <Suspense fallback={<Loading />}>
      <HomeContent locale={locale} />
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

function HomeContent({ locale }: { locale: string }) {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <BenefitsStrip />
        <FeaturedCollections />
        <BestSellers />
        <TravelSets />
        <HowItWorks />
        <ArticlesSection locale={locale} />
        <SocialProof />
      </main>
      <Footer />
    </>
  );
}
