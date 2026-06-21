import Image from "next/image";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { ArrowUpRight, ShieldCheck, Shirt, TicketPercent } from "lucide-react";

export async function FeaturedCollections() {
  const t = await getTranslations('collections');

  const collections = [
    {
      title: t('luggageCovers.title'),
      description: t('luggageCovers.description'),
      badge: t('luggageCovers.badge'),
      cta: t('luggageCovers.cta'),
      href: "/shop?category=luggage-covers",
      image: "/octopus photo/Anara/1.png",
      icon: ShieldCheck,
    },
    {
      title: t('passportWallets.title'),
      description: t('passportWallets.description'),
      badge: t('passportWallets.badge'),
      cta: t('passportWallets.cta'),
      href: "/shop?category=passport-wallets",
      image: "/wallet.png",
      icon: TicketPercent,
    },
    {
      title: t('packOnat.title'),
      description: t('packOnat.description'),
      badge: t('packOnat.badge'),
      cta: t('packOnat.cta'),
      href: "/shop?category=packonat",
      image: "/pack.png",
      icon: Shirt,
    },
  ];
  return (
    <section className="bg-[#F1EBE3] py-14 sm:py-18 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-9 text-center transition-all duration-700 opacity-100 translate-y-0 sm:mb-11">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#EEBC3F]">{t('sectionLabel')}</span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#0F1A26] md:text-4xl lg:text-5xl">
            {t('title')}
          </h2>
        </div>

        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 no-scrollbar sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0">
          {collections.map((collection, index) => (
            <Link
              key={collection.title}
              href={collection.href}
              className="group relative w-[82vw] max-w-[340px] shrink-0 snap-start overflow-hidden rounded-[1.75rem] border border-[#0F1A26]/10 bg-white shadow-lg shadow-[#0F1A26]/5 transition-all duration-500 hover:-translate-y-1 hover:border-[#EEBC3F]/50 hover:shadow-2xl hover:shadow-[#0F1A26]/10 lg:w-auto lg:max-w-none"
              style={{ transitionDelay: `${(index + 1) * 120}ms` }}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[#0F1A26]">
                <Image
                  src={collection.image}
                  alt={collection.title}
                  fill
                  sizes="(max-width: 640px) 82vw, (max-width: 1024px) 45vw, 30vw"
                  className="object-contain p-5 transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  quality={58}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_30%,rgba(238,188,63,0.24),transparent_32%),linear-gradient(180deg,transparent_45%,rgba(15,26,38,0.72)_100%)]" />
                <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-[#EEBC3F] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-[#0F1A26]">
                  <collection.icon className="h-3.5 w-3.5" strokeWidth={2} />
                  {collection.badge}
                </span>
                <span className="absolute bottom-4 right-4 text-5xl font-black leading-none text-white/10">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <div className="p-5">
                <h3 className="text-xl font-black text-[#0F1A26]">{collection.title}</h3>
                <p className="mt-2 min-h-[44px] text-sm font-medium leading-relaxed text-[#0F1A26]/60">
                  {collection.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#0F1A26] px-4 py-2.5 text-sm font-black text-white transition-colors duration-300 group-hover:bg-[#EEBC3F] group-hover:text-[#0F1A26]">
                  {collection.cta}
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
