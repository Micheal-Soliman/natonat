import { Suspense } from "react";
import { Navigation } from "@/app/sections/navigation";
import { Hero } from "@/app/sections/hero";
import { BenefitsStrip } from "@/app/sections/benefits-strip";
import { FeaturedCollections } from "@/app/sections/featured-collections";
import { BestSellers } from "@/app/sections/best-sellers";
import { TravelSets } from "@/app/sections/travel-sets";
import { HowItWorks } from "@/app/sections/how-it-works";
import { SocialProof } from "@/app/sections/social-proof";
import { ArticlesSection } from "@/app/sections/articles-section";
import { Footer } from "@/app/sections/footer";
import { Loading } from "@/app/components/loading";

export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
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
        <ArticlesSection />
        <SocialProof />
      </main>
      <Footer />
    </>
  );
}
