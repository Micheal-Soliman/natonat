"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const collections = [
  {
    title: "Luggage Covers",
    description: "Protect your suitcase with style",
    href: "/shop?category=luggage-covers",
    bgColor: "from-[#364353] to-[#0F1A26]",
    accent: "#EEBC3F",
    image: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=800&q=80",
  },
  {
    title: "Passport Wallets",
    description: "Smart organization for your documents",
    href: "/shop?category=passport-wallets",
    bgColor: "from-[#7C4C2B] to-[#4B1F1F]",
    accent: "#D1B897",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
  },
];

export function FeaturedCollections() {
  const [isVisible, setIsVisible] = useState(false);
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

  return (
    <section ref={ref} className="py-24 bg-[#F1EBE3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.2em] uppercase">Collections</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[#0F1A26] mt-4 tracking-tight">
            Shop by Category
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {collections.map((collection, index) => (
            <Link
              key={collection.title}
              href={collection.href}
              className={`group relative overflow-hidden rounded-3xl aspect-[4/3] transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${(index + 1) * 150}ms` }}
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${collection.image})` }}
              />
              
              {/* Overlay gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${collection.bgColor} opacity-80 transition-all duration-700 group-hover:opacity-0`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-all duration-700 group-hover:opacity-0" />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-10">
                <span 
                  className="text-xs font-medium tracking-[0.2em] uppercase mb-3 transition-colors duration-300"
                  style={{ color: collection.accent }}
                >
                  {index === 0 ? 'Essential' : 'Premium Leather'}
                </span>
                <h3 className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-3">
                  {collection.title}
                </h3>
                <p className="text-white/70 mb-6 max-w-xs font-light">
                  {collection.description}
                </p>
                <span className="inline-flex items-center gap-2 text-white font-medium group-hover:gap-3 transition-all duration-300">
                  Explore Collection
                  <ArrowUpRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </span>
              </div>

              {/* Hover border glow */}
              <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-white/20 transition-colors duration-500" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
