"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

export function Hero() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-[#0a0f14]">
      {/* Video Background */}
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50" />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f14] via-transparent to-transparent" />
      </div>

      {/* Main content - minimal */}
      <div className="relative z-10 text-center px-4">
        {/* Small label */}
        <p className={`text-[#EEBC3F] text-xs tracking-[0.3em] uppercase mb-8 transition-all duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
          Premium Travel Gear
        </p>

        {/* Big bold headline with logo-matching font */}
        <h1 
          className={`text-7xl md:text-9xl lg:text-[12rem] font-light leading-none tracking-[0.15em] mb-6 transition-all duration-1000 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} 
          style={{ fontFamily: "'Nexa', 'Montserrat', sans-serif", fontWeight: 300 }}
        >
          <span className="block text-white">nat<span className="text-[#EEBC3F]">O</span>nat</span>
        </h1>

        {/* Tagline */}
        <p className={`text-xl md:text-2xl text-white/40 font-light tracking-wide mb-12 transition-all duration-1000 delay-400 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
          Pack Smart. Travel Bold.
        </p>

        {/* Single CTA */}
        <div className={`transition-all duration-1000 delay-600 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
          <Button
            asChild
            size="lg"
            className="bg-[#EEBC3F] text-[#0a0f14] hover:bg-white rounded-full text-sm font-bold px-12 h-14 transition-all duration-500 hover:scale-105"
          >
            <Link href="/shop">
              Shop Now
            </Link>
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className={`absolute bottom-12 left-1/2 -translate-x-1/2 transition-all duration-1000 delay-1000 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        <ArrowDown className="w-5 h-5 text-white/30 animate-bounce" />
      </div>
    </section>
  );
}
