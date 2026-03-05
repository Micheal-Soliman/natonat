"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Ruler, Package, Check } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Choose Your Design",
    description: "Browse our collection of unique, eye-catching patterns",
    icon: Package,
  },
  {
    number: "02",
    title: "Pick Your Size",
    description: "Simply measure your suitcase height (without wheels)",
    icon: Ruler,
  },
  {
    number: "03",
    title: "Slide On & Travel",
    description: "Stretch, secure, and enjoy protected luggage",
    icon: Check,
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 bg-[#0F1A26]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div>
            <span className="text-[#EEBC3F] text-sm font-semibold uppercase tracking-wider">
              Simple & Easy
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4">
              How natOnat Works
            </h2>
            <p className="text-white/70 mb-8">
              Our patented sizing system makes finding the perfect cover incredibly simple. No more measuring width, depth, and height - just one measurement and you're done.
            </p>

            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#EEBC3F]/20 flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-[#EEBC3F]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[#EEBC3F] text-xs font-bold">
                        {step.number}
                      </span>
                      <h3 className="text-white font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-white/60 text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              asChild
              className="mt-8 bg-[#EEBC3F] text-[#0F1A26] hover:bg-[#EEBC3F]/90"
            >
              <Link href="/how-it-works">
                See Full Details
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Right - Size Guide Card */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6">
              Size Guide
            </h3>
            <div className="space-y-4">
              {[
                { size: "S", height: "18-21 inches", type: "Carry-on" },
                { size: "M", height: "22-25 inches", type: "Medium" },
                { size: "L", height: "26-29 inches", type: "Large" },
                { size: "XL", height: "30-32 inches", type: "Extra Large" },
              ].map((item) => (
                <div
                  key={item.size}
                  className="flex items-center justify-between py-3 border-b border-white/10 last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-lg bg-[#EEBC3F]/20 flex items-center justify-center text-[#EEBC3F] font-bold">
                      {item.size}
                    </span>
                    <div>
                      <p className="text-white font-medium">{item.type}</p>
                      <p className="text-white/50 text-sm">{item.height}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-white/50 text-xs mt-6">
              * Measure suitcase height only, excluding wheels
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
