"use client";

import { useEffect, useRef, useState } from "react";
import { Shield, Sparkles, Eye, Briefcase } from "lucide-react";

export function BenefitsStrip() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const benefits = [
    {
      number: "01",
      icon: Shield,
      title: "Protection",
      subtitle: "From scratches & dirt",
      image: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=800&q=80",
    },
    {
      number: "02",
      icon: Sparkles,
      title: "Durability",
      subtitle: "Stretchy & washable",
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
    },
    {
      number: "03",
      icon: Eye,
      title: "Recognition",
      subtitle: "Easy to spot",
      image: "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800&q=80",
    },
    {
      number: "04",
      icon: Briefcase,
      title: "Ecosystem",
      subtitle: "Complete travel set",
      image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80",
    },
  ];

  return (
    <section ref={ref} className="py-24 bg-[#F5F0EB] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - Minimal */}
        <div className={`mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[#EEBC3F] text-xs tracking-[0.3em] uppercase font-medium">Features</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-[#0F1A26] mt-4 tracking-tight">
                Why <span className="font-medium italic text-[#EEBC3F]">natOnat</span>
              </h2>
            </div>
            <p className="text-[#0F1A26]/50 text-sm max-w-xs text-right hidden md:block leading-relaxed">
              Premium travel essentials crafted for the modern journey
            </p>
          </div>
          <div className="h-px bg-gradient-to-r from-[#EEBC3F]/50 via-[#0F1A26]/10 to-transparent mt-8" />
        </div>

        {/* Editorial Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className={`group relative bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-700 shadow-lg shadow-[#0F1A26]/5 hover:shadow-xl hover:shadow-[#0F1A26]/10 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {/* Image Layer */}
              <div className="absolute inset-0">
                <img
                  src={benefit.image}
                  alt={benefit.title}
                  className="w-full h-full object-cover opacity-90 transition-all duration-700 group-hover:opacity-100 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>

              {/* Content */}
              <div className="relative h-[400px] lg:h-[500px] p-8 flex flex-col justify-between">
                {/* Top - Number */}
                <div className="flex items-start justify-between">
                  <span className="text-[#EEBC3F]/30 text-7xl font-light tracking-tighter">
                    {benefit.number}
                  </span>
                  <benefit.icon className="w-5 h-5 text-white/20" strokeWidth={1} />
                </div>

                {/* Bottom - Text */}
                <div className="space-y-3">
                  <div className="h-px w-12 bg-[#EEBC3F]/50 transition-all duration-500 group-hover:w-20" />
                  <h3 className="text-white text-2xl lg:text-3xl font-light tracking-tight">
                    {benefit.title}
                  </h3>
                  <p className="text-white/50 text-sm tracking-wide font-light">
                    {benefit.subtitle}
                  </p>
                </div>
              </div>

              {/* Hover Overlay Line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#EEBC3F] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </div>
          ))}
        </div>

        {/* Bottom Tagline */}
        <div className={`mt-16 flex items-center justify-center gap-4 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="h-px w-16 bg-[#0F1A26]/20" />
          <span className="text-[#0F1A26]/40 text-xs tracking-[0.4em] uppercase font-light">
            Est. 2024 — Cairo
          </span>
          <div className="h-px w-16 bg-[#0F1A26]/20" />
        </div>
      </div>
    </section>
  );
}
