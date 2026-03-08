"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { Ruler, Package, Check, Shield, Sparkles, Eye, HelpCircle, ArrowRight, Calculator, ChevronDown, ChevronUp, Luggage, Play } from "lucide-react";

const steps = [
  {
    icon: Ruler,
    title: "Measure",
    description: "Simply measure the height of your suitcase from floor to top (excluding wheels).",
    tip: "Just one measurement needed",
  },
  {
    icon: Package,
    title: "Choose",
    description: "Browse our collection of unique patterns. Find your style.",
    tip: "All designs available in all sizes",
  },
  {
    icon: Check,
    title: "Travel",
    description: "Slide the cover on from the top and secure. Takes 30 seconds.",
    tip: "Handles and wheels stay accessible",
  },
];

const sizes = [
  { size: "S", height: "18-21\"", cm: "46-53cm", type: "Carry-on", icon: "✈️" },
  { size: "M", height: "22-25\"", cm: "56-64cm", type: "Standard", icon: "🧳" },
  { size: "L", height: "26-29\"", cm: "66-74cm", type: "Check-in", icon: "🎒" },
  { size: "XL", height: "30-32\"", cm: "76-81cm", type: "Large", icon: "🏔️" },
];

const benefits = [
  {
    icon: Shield,
    title: "Real Protection",
    description: "Protects from scratches, dirt, and rough airport handling. Your luggage arrives pristine.",
  },
  {
    icon: Sparkles,
    title: "Easy Care",
    description: "Machine washable at 30°C. Maintains shape and color wash after wash.",
  },
  {
    icon: Eye,
    title: "Instant Recognition",
    description: "Bold, unique designs make your luggage unmistakable on any baggage claim.",
  },
];

const faqs = [
  {
    question: "Will it fit my suitcase?",
    answer: "Our stretchy covers fit a range of sizes. Just measure height (without wheels) and match to our size chart.",
  },
  {
    question: "Can I use handles and wheels?",
    answer: "Yes! Covers have openings for handles and wheels remain completely free.",
  },
  {
    question: "Machine washable?",
    answer: "Absolutely. Wash at 30°C with similar colors. Do not tumble dry or iron.",
  },
  {
    question: "Airport security?",
    answer: "Usually no need to remove. The thin fabric doesn't obstruct X-ray scanning.",
  },
];

// Size Calculator Component
function SizeCalculator() {
  const [height, setHeight] = useState<number | "">("");
  const [unit, setUnit] = useState<"inches" | "cm">("inches");
  const [result, setResult] = useState<typeof sizes[0] | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isOutOfRange, setIsOutOfRange] = useState(false);

  const calculateSize = () => {
    if (!height || height <= 0) return;
    
    setIsAnimating(true);
    setResult(null);
    setIsOutOfRange(false);
    
    const inches = unit === "cm" ? height / 2.54 : height;
    
    let recommended = null;
    if (inches >= 18 && inches < 22) recommended = sizes[0];
    else if (inches >= 22 && inches < 26) recommended = sizes[1];
    else if (inches >= 26 && inches < 30) recommended = sizes[2];
    else if (inches >= 30 && inches <= 32) recommended = sizes[3];
    
    setTimeout(() => {
      if (!recommended) {
        setIsOutOfRange(true);
      }
      setResult(recommended);
      setIsAnimating(false);
    }, 400);
  };

  return (
    <div className="bg-gradient-to-br from-[#EEBC3F]/20 via-[#F8F6F3] to-white rounded-3xl p-6 md:p-8 border border-[#EEBC3F]/20 shadow-xl shadow-[#EEBC3F]/5">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#EEBC3F] flex items-center justify-center">
          <Calculator className="w-6 h-6 text-[#0F1A26]" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-[#0F1A26]">Size Calculator</h3>
          <p className="text-[#0F1A26]/50 text-sm">Find your perfect fit in seconds</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value ? parseFloat(e.target.value) : "")}
            placeholder={unit === "inches" ? "Enter height in inches" : "Enter height in cm"}
            className="w-full px-5 py-4 rounded-2xl bg-white border-2 border-[#0F1A26]/10 text-[#0F1A26] placeholder:text-[#0F1A26]/30 focus:outline-none focus:border-[#EEBC3F] transition-colors text-lg"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0F1A26]/30 font-medium">
            {unit === "inches" ? "in" : "cm"}
          </span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => {
              setUnit("inches");
              setHeight("");
              setResult(null);
            }}
            className={`px-4 py-4 rounded-2xl font-medium transition-all ${
              unit === "inches" 
                ? "bg-[#0F1A26] text-white" 
                : "bg-white text-[#0F1A26]/60 border border-[#0F1A26]/10"
            }`}
          >
            Inches
          </button>
          <button
            onClick={() => {
              setUnit("cm");
              setHeight("");
              setResult(null);
            }}
            className={`px-4 py-4 rounded-2xl font-medium transition-all ${
              unit === "cm" 
                ? "bg-[#0F1A26] text-white" 
                : "bg-white text-[#0F1A26]/60 border border-[#0F1A26]/10"
            }`}
          >
            CM
          </button>
        </div>
      </div>

      <button
        onClick={calculateSize}
        disabled={!height || isAnimating}
        className="w-full py-4 rounded-2xl bg-[#0F1A26] text-white font-semibold hover:bg-[#EEBC3F] hover:text-[#0F1A26] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAnimating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Calculating...
          </span>
        ) : (
          "Find My Size"
        )}
      </button>

      {/* Result */}
      {result && (
        <div className="mt-6 p-6 rounded-2xl bg-[#0F1A26] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#EEBC3F] flex items-center justify-center text-3xl">
              {result.icon}
            </div>
            <div className="flex-1">
              <p className="text-white/60 text-sm">Recommended Size</p>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-[#EEBC3F]">{result.size}</span>
                <span className="text-white font-medium">{result.type}</span>
              </div>
              <p className="text-white/60 text-sm mt-1">{result.height} / {result.cm}</p>
            </div>
            <Button asChild className="bg-[#EEBC3F] text-[#0F1A26] hover:bg-white rounded-xl">
              <Link href={`/shop?category=luggage-covers&size=${result.size}`}>
                Shop
              </Link>
            </Button>
          </div>
        </div>
      )}

      {isOutOfRange && (
        <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm animate-in fade-in">
          Height out of range. Please measure between 18-32 inches (46-81cm).
        </div>
      )}
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F1EBE3] flex items-center justify-center">
      <div className="text-center">
        <Sparkles className="w-12 h-12 text-[#EEBC3F] mx-auto mb-4 animate-pulse" />
        <p className="text-[#0F1A26]/60">Loading...</p>
      </div>
    </div>}>
      <HowItWorksContent />
    </Suspense>
  );
}

function HowItWorksContent() {
  const [isVisible, setIsVisible] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F1EBE3]">
        {/* Hero - Premium with padding for navbar */}
        <div className="bg-[#0F1A26] pt-32 pb-20 md:pt-40 md:pb-28">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase mb-4 block">
              Simple Process
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              How It <span className="text-[#EEBC3F]">Works</span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              Three simple steps to protect your luggage. 
              Measure once, choose your design, travel with confidence.
            </p>
          </div>
        </div>

        {/* Steps Section */}
        <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className={`group bg-white rounded-3xl p-8 shadow-lg shadow-[#0F1A26]/5 border border-[#0F1A26]/5 transition-all duration-700 hover:shadow-xl hover:shadow-[#0F1A26]/10 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#0F1A26] flex items-center justify-center group-hover:bg-[#EEBC3F] transition-colors duration-300">
                    <step.icon className="w-7 h-7 text-[#EEBC3F] group-hover:text-[#0F1A26] transition-colors" />
                  </div>
                  <span className="text-5xl font-bold text-[#0F1A26]/5">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="text-2xl font-bold text-[#0F1A26] mb-3">{step.title}</h3>
                <p className="text-[#0F1A26]/60 mb-4 leading-relaxed">{step.description}</p>
                <div className="flex items-center gap-2 text-[#EEBC3F] text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  {step.tip}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Size Guide + Calculator Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase">Size Guide</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F1A26] mt-3">Find Your Perfect Fit</h2>
            <p className="text-[#0F1A26]/50 mt-3 max-w-xl mx-auto">
              Our patented sizing system needs just one measurement - height (without wheels).
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Size Cards */}
            <div className="grid grid-cols-2 gap-4">
              {sizes.map((item, index) => (
                <div 
                  key={item.size} 
                  className="bg-white rounded-2xl p-6 border border-[#0F1A26]/5 hover:border-[#EEBC3F]/30 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#F8F6F3] flex items-center justify-center text-2xl group-hover:bg-[#EEBC3F]/10 transition-colors">
                      {item.icon}
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-[#0F1A26]">{item.size}</span>
                      <p className="text-[#0F1A26]/40 text-xs">{item.type}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-[#0F1A26]">{item.height}</p>
                    <p className="text-[#0F1A26]/40 text-sm">{item.cm}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculator */}
            <SizeCalculator />
          </div>
        </div>

        {/* Video/Image Measurement Guide - Enhanced */}
        <div className="bg-white py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase">Video Guide</span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0F1A26] mt-3">Watch How to Measure</h2>
              <p className="text-[#0F1A26]/50 mt-3 max-w-xl mx-auto">
                See exactly how to measure your suitcase with our step-by-step video guide
              </p>
            </div>
            <div className="bg-[#0F1A26] rounded-3xl overflow-hidden">
              {/* Video/Image Placeholder */}
              <div className="aspect-video relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a2a3a] to-[#0F1A26]" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-24 h-24 rounded-full bg-[#EEBC3F]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform cursor-pointer hover:bg-[#EEBC3F]/30">
                    <Play className="w-10 h-10 text-[#EEBC3F] ml-1" />
                  </div>
                  <p className="text-white/80 text-xl font-semibold mb-2">Video Coming Soon</p>
                  <p className="text-white/50 text-sm max-w-md">
                    Watch a demonstration of how to properly measure your suitcase height (excluding wheels)
                  </p>
                </div>
                {/* Measurement Tips Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
                  <div className="flex flex-wrap gap-4 justify-center">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                      <Ruler className="w-4 h-4 text-[#EEBC3F]" />
                      <span className="text-white text-sm">Measure in cm or inches</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                      <Luggage className="w-4 h-4 text-[#EEBC3F]" />
                      <span className="text-white text-sm">Exclude wheels & handles</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* CM to Inches Conversion Table */}
              <div className="p-8 border-t border-white/10">
                <h3 className="text-xl font-bold text-white mb-6 text-center">Size Conversion Chart</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { size: "S", inches: "18-21\"", cm: "46-53 cm", type: "Carry-on" },
                    { size: "M", inches: "22-25\"", cm: "56-64 cm", type: "Medium" },
                    { size: "L", inches: "26-29\"", cm: "66-74 cm", type: "Large" },
                    { size: "XL", inches: "30-32\"", cm: "76-81 cm", type: "Extra Large" },
                  ].map((item) => (
                    <div key={item.size} className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                      <span className="text-2xl font-bold text-[#EEBC3F]">{item.size}</span>
                      <p className="text-white font-semibold mt-1">{item.inches}</p>
                      <p className="text-[#EEBC3F] text-sm">{item.cm}</p>
                      <p className="text-white/40 text-xs mt-1">{item.type}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase">Benefits</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F1A26] mt-3">Why Use Our Covers?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div 
                key={index} 
                className="text-center group"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#EEBC3F]/20 to-[#EEBC3F]/5 flex items-center justify-center mx-auto mb-6 group-hover:from-[#EEBC3F] group-hover:to-[#EEBC3F] transition-all duration-300">
                  <benefit.icon className="w-10 h-10 text-[#EEBC3F] group-hover:text-[#0F1A26] transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-[#0F1A26] mb-3">{benefit.title}</h3>
                <p className="text-[#0F1A26]/60 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-white py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase">FAQ</span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0F1A26] mt-3">Common Questions</h2>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className="border border-[#0F1A26]/10 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-[#F8F6F3] transition-colors"
                  >
                    <h3 className="font-semibold text-[#0F1A26]">{faq.question}</h3>
                    {openFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-[#EEBC3F]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#0F1A26]/40" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-200">
                      <p className="text-[#0F1A26]/60">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link 
                href="/faqs" 
                className="inline-flex items-center gap-2 text-[#EEBC3F] hover:text-[#0F1A26] font-medium transition-colors group"
              >
                View All FAQs
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#0F1A26] py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Travel Smart?</h2>
            <p className="text-white/50 mb-8 max-w-lg mx-auto">Browse our collection and find the perfect cover for your next adventure.</p>
            <Button 
              asChild 
              className="bg-[#EEBC3F] text-[#0F1A26] hover:bg-white rounded-full px-8 py-6 text-lg font-bold"
            >
              <Link href="/shop/luggage-covers" className="inline-flex items-center gap-2">
                Shop Luggage Covers
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
