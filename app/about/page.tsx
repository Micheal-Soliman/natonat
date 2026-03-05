"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Award, Globe, Users, Target, TrendingUp, Check, Star, MapPin, Package, Heart } from "lucide-react";

const milestones = [
  { year: "2019", title: "The Beginning", description: "natOnat launched on Amazon with a simple mission: protect luggage in style." },
  { year: "2020", title: "First 10K Customers", description: "Reached our first milestone of 10,000 happy travelers." },
  { year: "2021", title: "Noon Partnership", description: "Expanded to Noon marketplace, reaching customers across the GCC." },
  { year: "2022", title: "Brand Evolution", description: "Launched our D2C website and began building the natOnat brand identity." },
  { year: "2023", title: "Passport Wallets", description: "Introduced our first complementary product - premium RFID passport wallets." },
  { year: "2024", title: "Full Ecosystem", description: "Launched travel sets and began expanding into a complete travel accessories brand." },
];

const values = [
  { icon: Award, title: "Quality First", description: "We never compromise on materials or craftsmanship. Every product is built to last." },
  { icon: Target, title: "Smart Design", description: "Simple solutions to real travel problems. Our sizing system proves it." },
  { icon: Globe, title: "Accessible Luxury", description: "Premium quality at fair prices. Better value than competitors." },
  { icon: Users, title: "Customer Obsessed", description: "Every decision starts with the traveler in mind." },
];

const stats = [
  { value: "50K+", label: "Happy Travelers", icon: Heart },
  { value: "4.8", label: "Average Rating", icon: Star },
  { value: "3", label: "Marketplaces", icon: Package },
  { value: "5", label: "Years Strong", icon: MapPin },
];

export default function AboutPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const statsObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    if (statsRef.current) statsObserver.observe(statsRef.current);

    return () => {
      observer.disconnect();
      statsObserver.disconnect();
    };
  }, []);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F1EBE3]">
        {/* Hero - Premium */}
        <div className="bg-[#0F1A26] pt-32 pb-20 md:pt-44 md:pb-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase mb-6 block">
              Our Story
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 tracking-tight">
              About <span className="text-[#EEBC3F]">natOnat</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/50 max-w-3xl mx-auto font-light leading-relaxed">
              Born on Amazon in 2019, grown into a complete travel accessories brand trusted by thousands across the Middle East.
            </p>
          </div>
        </div>

        {/* Stats Bar */}
        {/* <div ref={statsRef} className="bg-white border-b border-[#0F1A26]/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className={`text-center transition-all duration-700 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#EEBC3F]/10 flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="w-6 h-6 text-[#EEBC3F]" strokeWidth={1.5} />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-[#0F1A26] mb-1">{stat.value}</div>
                  <div className="text-[#0F1A26]/50 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div> */}

        {/* Brand Story - Two Column */}
        <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
              <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase">The Journey</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0F1A26] mt-4 mb-8 tracking-tight">
                From Amazon Startup to Travel Brand
              </h2>
              <div className="space-y-5 text-[#0F1A26]/70 leading-relaxed text-lg">
                <p>
                  natOnat started with a simple observation: travelers invest in expensive suitcases, then watch them get scratched and dirty at airports. There had to be a better way.
                </p>
                <p>
                  We launched in 2019 on Amazon with a simple mission: create luggage covers that actually work. Covers that fit properly, protect effectively, and look great doing it.
                </p>
                <p>
                  The response was immediate. Travelers loved our simple sizing system, quality materials, and unique designs that made luggage stand out on any carousel.
                </p>
                <p>
                  Today, natOnat is evolving into a complete travel accessories ecosystem. But our mission remains: protect your gear and make every journey easier, safer, and more stylish.
                </p>
              </div>
            </div>
            <div className={`relative transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
              <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-br from-[#EEBC3F]/20 via-[#0F1A26] to-[#0F1A26] p-8 flex flex-col items-center justify-center border border-[#EEBC3F]/20">
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full bg-[#EEBC3F]/20 flex items-center justify-center mx-auto mb-6">
                    <span className="text-6xl font-bold text-[#EEBC3F]">nat</span>
                  </div>
                  <p className="text-white/60 text-lg mb-2">Since 2019</p>
                  <p className="text-white text-2xl font-bold">natOnat</p>
                  <p className="text-[#EEBC3F] text-sm mt-2">Premium Travel Gear</p>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#EEBC3F]/10 rounded-2xl -z-10" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#0F1A26]/5 rounded-2xl -z-10" />
            </div>
          </div>
        </div>

        {/* Values - Grid */}
        <div className="bg-white py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase">Principles</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0F1A26] mt-4 tracking-tight">What We Stand For</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div 
                  key={index} 
                  className={`group bg-[#F8F6F3] rounded-3xl p-8 transition-all duration-700 hover:bg-[#0F1A26] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${300 + index * 100}ms` }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#EEBC3F]/10 flex items-center justify-center mb-6 group-hover:bg-[#EEBC3F] transition-colors duration-300">
                    <value.icon className="w-8 h-8 text-[#EEBC3F] group-hover:text-[#0F1A26] transition-colors" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold text-[#0F1A26] mb-3 tracking-tight group-hover:text-white transition-colors">{value.title}</h3>
                  <p className="text-[#0F1A26]/60 group-hover:text-white/70 transition-colors leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase">Timeline</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0F1A26] mt-4 tracking-tight">Our Journey</h2>
          </div>
          <div className="relative">
            {/* Center line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-[#0F1A26]/10 -translate-x-1/2 hidden md:block" />
            
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div 
                  key={index} 
                  className={`flex flex-col md:flex-row gap-8 items-start transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${500 + index * 100}ms` }}
                >
                  {/* Year - Left on desktop */}
                  <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:text-right' : 'md:order-2'}`}>
                    <div className="flex items-center gap-4 md:justify-end">
                      <span className="text-4xl font-bold text-[#EEBC3F] tracking-tight">{milestone.year}</span>
                      <div className="w-4 h-4 rounded-full bg-[#EEBC3F] flex-shrink-0 hidden md:block" />
                    </div>
                  </div>
                  
                  {/* Content - Right on desktop */}
                  <div className={`md:w-1/2 ${index % 2 === 0 ? '' : 'md:order-1 md:text-right'}`}>
                    <div className="bg-white rounded-2xl p-6 shadow-lg shadow-[#0F1A26]/5 border border-[#0F1A26]/5 hover:shadow-xl transition-shadow">
                      <h3 className="text-xl font-bold text-[#0F1A26] mb-2 tracking-tight">{milestone.title}</h3>
                      <p className="text-[#0F1A26]/60 leading-relaxed">{milestone.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mission */}
        <div className="bg-[#0F1A26] py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase mb-6 block">Purpose</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-8 tracking-tight">Our Mission</h2>
            <p className="text-2xl md:text-3xl text-white/50 mb-12 font-light leading-relaxed max-w-4xl mx-auto">
              "To create a smarter, more stylish travel accessories ecosystem that protects your gear and makes every journey easier — all at a fair price."
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                "Better quality than competitors",
                "Smarter designs",
                "Fair pricing",
                "Customer first"
              ].map((item, index) => (
                <span key={index} className="flex items-center gap-2 text-white/60 bg-white/5 backdrop-blur-sm rounded-full px-6 py-3 border border-white/10">
                  <Check className="w-4 h-4 text-[#EEBC3F]" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="bg-gradient-to-br from-white to-[#F8F6F3] rounded-3xl p-10 md:p-14 shadow-xl shadow-[#0F1A26]/5 border border-[#0F1A26]/5">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#EEBC3F]/10 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-[#EEBC3F]" strokeWidth={1.5} />
              </div>
              <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase">Future</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F1A26] mb-4 tracking-tight">What's Next</h2>
            <p className="text-[#0F1A26]/60 mb-8 leading-relaxed text-lg">
              We're building the future of travel accessories. Here's what's coming:
            </p>
            <div className="grid md:grid-cols-2 gap-4 mb-10">
              {[
                "Garment bags for wrinkle-free travel",
                "Tech organizers and cable management",
                "Packing cubes and organizers",
                "Regional expansion across MENA"
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#0F1A26]/5">
                  <div className="w-2 h-2 rounded-full bg-[#EEBC3F] flex-shrink-0" />
                  <span className="text-[#0F1A26]/70">{item}</span>
                </div>
              ))}
            </div>
            <Button asChild className="bg-[#0F1A26] text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26] rounded-full px-8 h-14 font-semibold text-lg transition-all duration-300">
              <Link href="/contact" className="inline-flex items-center gap-2">
                Partner With Us
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
