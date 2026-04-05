"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import NextImage from "next/image";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { Ruler, Package, Check, Shield, Sparkles, Eye, HelpCircle, ArrowRight, Calculator, ChevronDown, ChevronUp, Luggage, Play } from "lucide-react";
import { Loading } from "@/app/components/loading";

const getSteps = (t: (key: string) => string) => [
  { icon: Ruler, key: "measure" },
  { icon: Package, key: "choose" },
  { icon: Check, key: "travel" },
];

const getSizes = (t: (key: string) => string) => [
  { size: "S", height: "18-21\"", cm: "46-53 cm", icon: "/s.png" },
  { size: "M", height: "22-25\"", cm: "56-64 cm", icon: "/m.png" },
  { size: "L", height: "26-29\"", cm: "66-74 cm", icon: "/l.png" },
  { size: "XL", height: "30-32\"", cm: "76-81 cm", icon: "/xl.png" },
];

const getBenefits = (t: (key: string) => string) => [
  { icon: Shield, key: "protection" },
  { icon: Sparkles, key: "care" },
  { icon: Eye, key: "recognition" },
];

const getFaqs = (t: (key: string) => string) => [
  { questionKey: "sizeCover" },
  { questionKey: "hardShell" },
  { questionKey: "dualZippers" },
  { questionKey: "washCover" },
];

// Size Calculator Component
function SizeCalculator({ t }: { t: (key: string) => string }) {
  const [height, setHeight] = useState<number | "">("");
  const [unit, setUnit] = useState<"inches" | "cm">("inches");
  const [result, setResult] = useState<ReturnType<typeof getSizes>[0] | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isOutOfRange, setIsOutOfRange] = useState(false);

  const sizes = getSizes(t);

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
          <h3 className="text-xl font-bold text-[#0F1A26]">{t('calculator.title')}</h3>
          <p className="text-[#0F1A26]/50 text-sm">{t('calculator.subtitle')}</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value ? parseFloat(e.target.value) : "")}
            placeholder={unit === "inches" ? t('calculator.placeholderInches') : t('calculator.placeholderCm')}
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
            {t('calculator.inches')}
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
            {t('calculator.cm')}
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
            {t('calculator.calculating')}
          </span>
        ) : (
          t('calculator.button')
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
              <p className="text-white/60 text-sm">{t('calculator.result')}</p>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-[#EEBC3F]">{result.size}</span>
                <span className="text-white font-medium">{t(`sizes.${result.size.toLowerCase()}.type`)}</span>
              </div>
              <p className="text-white/60 text-sm mt-1">{result.height} / {result.cm}</p>
            </div>
            <Button asChild className="bg-[#EEBC3F] text-[#0F1A26] hover:bg-white rounded-xl">
              <Link href={`/shop?category=luggage-covers&size=${result.size}`}>
                {t('calculator.shop')}
              </Link>
            </Button>
          </div>
        </div>
      )}

      {isOutOfRange && (
        <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm animate-in fade-in">
          {t('calculator.outOfRange')}
        </div>
      )}
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <Suspense fallback={<Loading />}>
      <HowItWorksContent />
    </Suspense>
  );
}

function HowItWorksContent() {
  const t = useTranslations('howItWorks');
  const [isVisible, setIsVisible] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const steps = getSteps(t);
  const sizes = getSizes(t);
  const benefits = getBenefits(t);
  const faqs = getFaqs(t);

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
        <div className="bg-[#0F1A26] pt-28 pb-16 md:pt-40 md:pb-28">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase mb-4 block">
              {t('hero.label')}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 md:mb-6 tracking-tight">
              {t('hero.title')}
            </h1>
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              {t('hero.subtitle')}
            </p>
          </div>
        </div>

        {/* Steps Section */}
        <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 md:-mt-10 relative z-10">
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className={`group bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-lg shadow-[#0F1A26]/5 border border-[#0F1A26]/5 transition-all duration-700 hover:shadow-xl hover:shadow-[#0F1A26]/10 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="flex items-start justify-between mb-4 md:mb-6">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#0F1A26] flex items-center justify-center group-hover:bg-[#EEBC3F] transition-colors duration-300">
                    <step.icon className="w-6 h-6 md:w-7 md:h-7 text-[#EEBC3F] group-hover:text-[#0F1A26] transition-colors" />
                  </div>
                  <span className="text-4xl md:text-5xl font-bold text-[#0F1A26]/5">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-[#0F1A26] mb-2 md:mb-3">{t(`steps.${step.key}.title`)}</h3>
                <p className="text-[#0F1A26]/60 mb-3 md:mb-4 leading-relaxed text-sm md:text-base">{t(`steps.${step.key}.description`)}</p>
                <div className="flex items-center gap-2 text-[#EEBC3F] text-xs md:text-sm font-medium">
                  <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
                  {t(`steps.${step.key}.tip`)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Size Guide + Calculator Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="text-center mb-8 md:mb-12">
            <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase">{t('sizeGuide.label')}</span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#0F1A26] mt-2 md:mt-3">{t('sizeGuide.title')}</h2>
            <p className="text-[#0F1A26]/50 mt-2 md:mt-3 max-w-xl mx-auto text-sm md:text-base">
              {t('sizeGuide.subtitle')}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Size Cards */}
            <div className="grid grid-cols-2 gap-4">
              {sizes.map((item, index) => (
                <div 
                  key={item.size} 
                  className="bg-white rounded-2xl p-4 border border-[#0F1A26]/5 hover:border-[#EEBC3F]/30 hover:shadow-lg transition-all duration-300 group text-center"
                >
                  {/* Size Image */}
                  <div className="w-full h-20 mb-2 flex items-center justify-center">
                    <NextImage 
                      src={item.icon} 
                      alt={`Size ${item.size}`} 
                      width={80} 
                      height={80} 
                      className="object-contain"
                    />
                  </div>
                  
                  {/* Size Label */}
                  <span className="text-[#EEBC3F] font-bold text-2xl">{item.size}</span>
                  
                  {/* Type */}
                  <p className="text-[#0F1A26]/60 text-xs mb-2">{t(`sizes.${item.size.toLowerCase()}.type`)}</p>
                  
                  {/* Measurements - CM highlighted */}
                  <div className="space-y-1">
                    <p className="text-[#EEBC3F] font-bold text-base">
                      {item.cm.split(' ')[0]} <span className="text-[#0F1A26]/60 text-sm font-normal">cm</span>
                    </p>
                    <p className="text-[#0F1A26]/50 text-xs">
                      {item.height} 
                    </p>
                    <p className="text-[#0F1A26]/30 text-[14px]">({t('sizeGuide.heightOnly')})</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculator */}
            <SizeCalculator t={t} />
          </div>
        </div>

        {/* Video/Image Measurement Guide - Enhanced */}
        <div className="bg-white py-12 md:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-12">
              <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase">{t('video.label')}</span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#0F1A26] mt-2 md:mt-3">{t('video.title')}</h2>
              <p className="text-[#0F1A26]/50 mt-2 md:mt-3 max-w-xl mx-auto text-sm md:text-base">
                {t('video.subtitle')}
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
                  <p className="text-white/80 text-xl font-semibold mb-2">{t('video.comingSoon')}</p>
                  <p className="text-white/50 text-sm max-w-md">
                    {t('video.description')}
                  </p>
                </div>
                {/* Measurement Tips Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
                  <div className="flex flex-wrap gap-4 justify-center">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                      <Ruler className="w-4 h-4 text-[#EEBC3F]" />
                      <span className="text-white text-sm">{t('video.tip1')}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                      <Luggage className="w-4 h-4 text-[#EEBC3F]" />
                      <span className="text-white text-sm">{t('video.tip2')}</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* CM to Inches Conversion Table */}
              <div className="p-8 border-t border-white/10">
                <h3 className="text-xl font-bold text-white mb-2 text-center">{t('conversionChart.title')}</h3>
                <p className="text-white/50 text-xs text-center mb-6">{t('sizeGuide.note')}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { size: "S", inches: "18-21\"", cm: "46-53 cm", type: t('sizes.s.type') },
                    { size: "M", inches: "22-25\"", cm: "56-64 cm", type: t('sizes.m.type') },
                    { size: "L", inches: "26-29\"", cm: "66-74 cm", type: t('sizes.l.type') },
                    { size: "XL", inches: "30-32\"", cm: "76-81 cm", type: t('sizes.xl.type') },
                  ].map((item) => (
                    <div key={item.size} className="bg-white/5 rounded-xl p-4 text-center border border-white/10 hover:border-[#EEBC3F]/30 transition-all duration-300">
                      <span className="text-2xl font-bold text-[#EEBC3F]">{item.size}</span>
                      <p className="text-white font-semibold mt-1">{item.inches}</p>
                      <p className="text-[#EEBC3F] text-sm">{item.cm}</p>
                      <p className="text-white/40 text-xs mt-1">{item.type}</p>
                      <p className="text-white/30 text-[14px] mt-2">({t('sizeGuide.heightOnly')})</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="text-center mb-8 md:mb-12">
            <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase">{t('benefits.label')}</span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#0F1A26] mt-2 md:mt-3">{t('benefits.title')}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {benefits.map((benefit, index) => (
              <div 
                key={index} 
                className="text-center group"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#EEBC3F]/20 to-[#EEBC3F]/5 flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:from-[#EEBC3F] group-hover:to-[#EEBC3F] transition-all duration-300">
                  <benefit.icon className="w-8 h-8 md:w-10 md:h-10 text-[#EEBC3F] group-hover:text-[#0F1A26] transition-colors" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-[#0F1A26] mb-2 md:mb-3">{t(`benefits.${benefit.key}.title`)}</h3>
                <p className="text-[#0F1A26]/60 leading-relaxed text-sm md:text-base">{t(`benefits.${benefit.key}.description`)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-white py-12 md:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-12">
              <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase">{t('faq.label')}</span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#0F1A26] mt-2 md:mt-3">{t('faq.title')}</h2>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className="border border-[#0F1A26]/10 rounded-xl md:rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 md:p-6 text-left hover:bg-[#F8F6F3] transition-colors"
                  >
                    <h3 className="font-semibold text-[#0F1A26] text-sm md:text-base pr-4">{t(`faq.questions.${faq.questionKey}.question`)}</h3>
                    {openFaq === index ? (
                      <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-[#EEBC3F] flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-[#0F1A26]/40 flex-shrink-0" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-4 md:px-6 pb-4 md:pb-6 animate-in slide-in-from-top-2 duration-200">
                      <p className="text-[#0F1A26]/60 text-sm md:text-base">{t(`faq.questions.${faq.questionKey}.answer`)}</p>
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
                {t('faq.viewAll')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#0F1A26] py-12 md:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 md:mb-4">{t('cta.title')}</h2>
            <p className="text-white/50 mb-6 md:mb-8 max-w-lg mx-auto text-sm md:text-base">{t('cta.subtitle')}</p>
            <Button 
              asChild 
              className="bg-[#EEBC3F] text-[#0F1A26] hover:bg-white rounded-full px-6 md:px-8 py-4 md:py-6 text-base md:text-lg font-bold"
            >
              <Link href="/shop/luggage-covers" className="inline-flex items-center gap-2">
                {t('cta.button')}
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
