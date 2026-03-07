import { Suspense } from "react";
import { Navigation } from "./sections/navigation";
import { Hero } from "./sections/hero";
import { BenefitsStrip } from "./sections/benefits-strip";
import { FeaturedCollections } from "./sections/featured-collections";
import { BestSellers } from "./sections/best-sellers";
import { TravelSets } from "./sections/travel-sets";
import { HowItWorks } from "./sections/how-it-works";
import { SocialProof } from "./sections/social-proof";
import { Footer } from "./sections/footer";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0f14] flex items-center justify-center">
      <div className="text-center">
        <Sparkles className="w-12 h-12 text-[#EEBC3F] mx-auto mb-4 animate-pulse" />
        <p className="text-white/60">Loading...</p>
      </div>
    </div>}>
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
        
        {/* Spacer between Hero and Benefits */}
        <div className="h-8 md:h-12 bg-[#0a0f14]" />
        
        <BenefitsStrip />
        <FeaturedCollections />
        <BestSellers />
        <TravelSets />
        <HowItWorks />
        <SocialProof />
      </main>
      <Footer />
    </>
  );
}
