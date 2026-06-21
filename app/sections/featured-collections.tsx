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
    <section className="bg-[#F1EBE3] py-12 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center transition-all duration-700 opacity-100 translate-y-0 sm:mb-10">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#EEBC3F]">{t('sectionLabel')}</span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0F1A26] md:text-4xl">
            {t('title')}
          </h2>
        </div>

        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 no-scrollbar sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0">
          {collections.map((collection, index) => (
            <Link
              key={collection.title}
              href={collection.href}
              className="group relative w-[82vw] max-w-[350px] shrink-0 snap-start overflow-hidden rounded-[1.5rem] border border-[#0F1A26]/10 bg-white shadow-[0_18px_55px_rgba(15,26,38,0.08)] transition-all duration-500 hover:-translate-y-1 hover:border-[#EEBC3F]/60 hover:shadow-[0_24px_70px_rgba(15,26,38,0.14)] lg:w-auto lg:max-w-none"
              style={{ transitionDelay: `${(index + 1) * 120}ms` }}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-[#EEBC3F]" />

              <div className="relative grid min-h-[360px] grid-rows-[1fr_auto] bg-[#F8F6F2]">
                <div className="relative mx-4 mt-4 overflow-hidden rounded-[1.2rem] bg-[#0F1A26]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_30%,rgba(238,188,63,0.28),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.1),transparent_42%)]" />
                  <Image
                    src={collection.image}
                    alt={collection.title}
                    fill
                    sizes="(max-width: 640px) 82vw, (max-width: 1024px) 45vw, 30vw"
                    className="object-contain p-5 transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                    quality={60}
                  />
                  <span className="absolute left-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-black text-[#0F1A26] shadow-lg shadow-black/10">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full bg-[#EEBC3F] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-[#0F1A26] shadow-lg shadow-black/10">
                    <collection.icon className="h-3.5 w-3.5" strokeWidth={2} />
                    {collection.badge}
                  </span>
                </div>

                <div className="relative px-5 pb-5 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black leading-tight text-[#0F1A26]">
                        {collection.title}
                      </h3>
                      <p className="mt-2 min-h-[42px] text-sm font-medium leading-relaxed text-[#0F1A26]/60">
                        {collection.description}
                      </p>
                    </div>

                    <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#0F1A26]/10 bg-white text-[#0F1A26] transition-all duration-300 group-hover:border-[#EEBC3F] group-hover:bg-[#EEBC3F]">
                      <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>

                  <span className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#0F1A26] px-4 py-3 text-sm font-black text-white transition-colors duration-300 group-hover:bg-[#EEBC3F] group-hover:text-[#0F1A26]">
                    {collection.cta}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
