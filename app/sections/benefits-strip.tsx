import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Shield, Sparkles, Eye, Briefcase } from "lucide-react";

export async function BenefitsStrip() {
  const t = await getTranslations("benefits");

  const benefits = [
    {
      number: t("items.protection.number"),
      icon: Shield,
      title: t("items.protection.title"),
      subtitle: t("items.protection.subtitle"),
      image: "/Artboard-1.jpeg",
    },
    {
      number: t("items.durability.number"),
      icon: Sparkles,
      title: t("items.durability.title"),
      subtitle: t("items.durability.subtitle"),
      image: "/Artboard-2.jpeg",
    },
    {
      number: t("items.recognition.number"),
      icon: Eye,
      title: t("items.recognition.title"),
      subtitle: t("items.recognition.subtitle"),
      image: "/Artboard-3.jpeg",
    },
    {
      number: t("items.ecosystem.number"),
      icon: Briefcase,
      title: t("items.ecosystem.title"),
      subtitle: t("items.ecosystem.subtitle"),
      image: "/Artboard-4.jpeg",
    },
  ];

  return (
    <section className="py-24 bg-[#F5F0EB] overflow-hidden">
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        {/* Section Header - Minimal */}
        <div className="mb-20">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[#EEBC3F] text-xs tracking-[0.3em] uppercase font-medium">{t("sectionLabel")}</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-[#0F1A26] mt-4 tracking-tight">
                {t("title")} <span className="font-medium text-[#EEBC3F]" style={{ fontFamily: "var(--font-arthaus), sans-serif" }}>natOnat</span>
              </h2>
            </div>
            <p className="text-[#0F1A26]/50 text-sm max-w-xs text-right hidden md:block leading-relaxed">
              {t("subtitle")}
            </p>
          </div>
          <div className="h-px bg-gradient-to-r from-[#EEBC3F]/50 via-[#0F1A26]/10 to-transparent mt-8" />
        </div>

        {/* Editorial Grid / Mobile Carousel */}
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 no-scrollbar sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-4 lg:gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group relative w-[88vw] max-w-[390px] shrink-0 snap-start overflow-hidden rounded-2xl bg-white shadow-lg shadow-[#0F1A26]/5 transition-all duration-700 hover:shadow-xl hover:shadow-[#0F1A26]/10 sm:w-[74vw] md:w-auto md:max-w-none"
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {/* Image Layer */}
              <div className="absolute inset-0">
                <Image
                  src={benefit.image}
                  alt={benefit.title}
                  fill
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 22vw"
                  className="w-full h-full object-cover opacity-90 transition-all duration-700 group-hover:opacity-100 group-hover:scale-105"
                  loading="lazy"
                  quality={55}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>

              {/* Content */}
              <div className="relative h-[380px] p-6 flex flex-col justify-between sm:p-8 lg:h-[500px]">
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
        <div className="mt-16 flex items-center justify-center gap-4">
          <div className="h-px w-16 bg-[#0F1A26]/30" />
          <span className="text-[#0F1A26]/70 text-xs tracking-[0.4em] uppercase font-medium">
            {t("footer")}
          </span>
          <div className="h-px w-16 bg-[#0F1A26]/30" />
        </div>
      </div>
    </section>
  );
}
