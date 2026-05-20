"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ArrowRight, Ruler, Package, Check, PlayCircle } from "lucide-react";

export function HowItWorks() {
  const t = useTranslations("howItWorks");
  const ts = useTranslations("howItWorks.steps");
  const tg = useTranslations("howItWorks.sizeGuide");
  const tc = useTranslations("howItWorks.calculator");

  const steps = [
    {
      number: ts("1.number"),
      title: ts("1.title"),
      description: ts("1.description"),
      icon: Package,
    },
    {
      number: ts("2.number"),
      title: ts("2.title"),
      description: ts("2.description"),
      icon: Ruler,
    },
    {
      number: ts("3.number"),
      title: ts("3.title"),
      description: ts("3.description"),
      icon: Check,
    },
  ];

  const sizes = [
    { size: "S", cm: "45–53", inch: "18–21", type: tg("sizes.s.type") },
    { size: "M", cm: "55–63", inch: "22–25", type: tg("sizes.m.type") },
    { size: "L", cm: "65–70", inch: "26–28", type: tg("sizes.l.type") },
    { size: "XL", cm: "72–81", inch: "29–32", type: tg("sizes.xl.type") },
  ];

  return (
    <section className="py-20 bg-[#0F1A26]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div>
            <span className="text-[#EEBC3F] text-sm font-semibold uppercase tracking-wider">
              {t("sectionLabel")}
            </span>

            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4">
              {t("title")}
            </h2>

            <p className="text-white/70 mb-8">{t("subtitle")}</p>

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
                {t("seeDetails")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Right - Size Guide + Video */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-white/10">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="text-xl font-bold text-white">{tg("title")}</h3>

              <div className="flex items-center gap-2 text-[#EEBC3F] text-xs font-semibold uppercase tracking-wider">
                <PlayCircle className="w-4 h-4" />
                Size Video
              </div>
            </div>

            {/* Bigger Video */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 mb-4">
              <div className="relative h-[230px] sm:h-[260px] lg:h-[280px]">
                <video
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                >
                  <source src="/size.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>

              <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between gap-3">
                <div>
                  <p className="text-white text-sm font-semibold">
                    How to measure your suitcase
                  </p>
                  <p className="text-white/50 text-xs">
                    Measure height only, excluding wheels.
                  </p>
                </div>

                <span className="shrink-0 text-[#EEBC3F] text-xs font-bold">
                  20 sec
                </span>
              </div>
            </div>

            {/* 4 Small Size Boxes Beside Each Other */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {sizes.map((item) => (
                <div
                  key={item.size}
                  className="bg-white/10 rounded-xl px-2.5 py-3 border border-white/10 hover:border-[#EEBC3F]/40 transition-all duration-300 text-center"
                >
                  <span className="block text-[#EEBC3F] font-bold text-2xl leading-none">
                    {item.size}
                  </span>

                  <p className="text-white font-semibold text-xs mt-2 leading-tight">
                    {item.type}
                  </p>

                  <div className="mt-2">
                    <p className="text-[#EEBC3F] font-bold text-sm leading-tight">
                      {item.cm} {tc("cm")}
                    </p>
                    <p className="text-white/50 text-[11px] leading-tight mt-0.5">
                      {item.inch} {tc("inches")}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/15">
                    <p className="text-white/55 text-[10px] leading-tight">
                      {tg("heightOnly")}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-white/70 text-xs text-center font-medium mt-4">
              {tg("note")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}