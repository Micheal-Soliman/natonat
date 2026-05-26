import Image from "next/image";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { products, getDiscountPercentage } from "@/lib/products";

// Get bundle products from lib/products
const bundles = products.filter((p) => p.category === "bundles").slice(0, 3);

export async function TravelSets() {
  const t = await getTranslations('bundles');

  return (
    <section className="py-20 bg-[#F1EBE3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-[#EEBC3F] text-sm font-semibold uppercase tracking-wider">
            {t('sectionLabel')}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F1A26] mt-2 mb-4">
            {t('title')}
          </h2>
          <p className="text-[#0F1A26]/60 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-stretch">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              className="group bg-white rounded-2xl overflow-hidden border border-[#0F1A26]/10 hover:border-[#EEBC3F] transition-all hover:shadow-xl flex flex-col h-full"
            >
              {/* Bundle Image - Smaller aspect ratio */}
              <Link href={`/product/${bundle.slug}`} className="block">
                <div className="relative overflow-hidden aspect-square">
                  <Image
                    src={bundle.image}
                    alt={bundle.name}
                    fill
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw"
                    className="object-contain transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    quality={55}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 z-10">
                    <span className="text-[#EEBC3F] text-xs font-bold tracking-wider uppercase bg-[#0F1A26]/80 px-3 py-1 rounded-full">
                      {(() => {
                        const discountPercent = getDiscountPercentage(bundle);
                        if (discountPercent) {
                          return `${discountPercent}% OFF`;
                        }
                        const saveAmount = bundle.originalPrice - bundle.price;
                        return saveAmount > 0 ? t('save', { amount: saveAmount }) : '';
                      })()}
                    </span>
                  </div>
                </div>
              </Link>

              <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-base font-bold text-[#0F1A26] mb-2 line-clamp-1">
                  {bundle.name}
                </h3>
                <p className="text-[#0F1A26]/60 text-sm mb-3 line-clamp-2 min-h-[40px]">
                  {bundle.description}
                </p>

                <div className="flex items-baseline gap-2 mb-4">
                  {(() => {
                    const discountPercent = getDiscountPercentage(bundle);
                    if (discountPercent && bundle.price === 0) {
                      return <span className="text-xl font-bold text-[#EEBC3F]">Get {discountPercent}% Discount</span>;
                    }
                    return (
                      <>
                        <span className="text-xl font-bold text-[#0F1A26]">
                          EGP {bundle.price}
                        </span>
                        <span className="text-sm text-[#0F1A26]/40 line-through">
                          EGP {bundle.originalPrice}
                        </span>
                      </>
                    );
                  })()}
                </div>

                <Button
                  asChild
                  className="w-full bg-[#0F1A26] text-[#F1EBE3] hover:bg-[#EEBC3F] hover:text-[#0F1A26] transition-all duration-300 mt-auto h-10 text-sm"
                >
                  <Link href={`/product/${bundle.slug}`}>{t('viewProduct')}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            asChild
            variant="outline"
            className="border-[#0F1A26] text-[#0F1A26] hover:bg-[#0F1A26] hover:text-[#F1EBE3]"
          >
            <Link href="/shop?category=bundles">{t('viewAll')}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
