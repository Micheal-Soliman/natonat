"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { ArrowRight, Ruler, Package, Check } from "lucide-react";

export function HowItWorks() {
  const t = useTranslations('howItWorks');
  const ts = useTranslations('howItWorks.steps');
  const tg = useTranslations('howItWorks.sizeGuide');

  const steps = [
    {
      number: ts('1.number'),
      title: ts('1.title'),
      description: ts('1.description'),
      icon: Package,
    },
    {
      number: ts('2.number'),
      title: ts('2.title'),
      description: ts('2.description'),
      icon: Ruler,
    },
    {
      number: ts('3.number'),
      title: ts('3.title'),
      description: ts('3.description'),
      icon: Check,
    },
  ];
  return (
    <section className="py-20 bg-[#0F1A26]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div>
            <span className="text-[#EEBC3F] text-sm font-semibold uppercase tracking-wider">
              {t('sectionLabel')}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4">
              {t('title')}
            </h2>
            <p className="text-white/70 mb-8">
              {t('subtitle')}
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
                {t('seeDetails')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Right - Size Guide Card */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6">
              {tg('title')}
            </h3>
            <div className="space-y-4">
              {[
                { size: tg('sizes.s.label'), height: tg('sizes.s.range'), type: tg('sizes.s.type') },
                { size: tg('sizes.m.label'), height: tg('sizes.m.range'), type: tg('sizes.m.type') },
                { size: tg('sizes.l.label'), height: tg('sizes.l.range'), type: tg('sizes.l.type') },
                { size: tg('sizes.xl.label'), height: tg('sizes.xl.range'), type: tg('sizes.xl.type') },
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
              {tg('note')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
