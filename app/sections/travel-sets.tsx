import Image from "next/image";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { getDiscountPercentage } from "@/lib/products";
import { getCatalogProducts } from "@/lib/sanity-products";
import { BundleQuickCustomizer } from "@/app/components/bundle-quick-customizer";
import { WishlistToggleButton } from "@/app/components/wishlist-toggle-button";

export async function TravelSets() {
  const [t, products] = await Promise.all([
    getTranslations('bundles'),
    getCatalogProducts(),
  ]);
  const bundles = products
    .filter((product) =>
      Array.isArray(product.category)
        ? product.category.includes("bundles")
        : product.category === "bundles"
    )
    .slice(0, 3);

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

        <div className="-mx-4 flex snap-x items-stretch gap-4 overflow-x-auto px-4 pb-3 no-scrollbar sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              className="group flex h-full w-[86vw] max-w-[350px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[#0F1A26]/10 bg-white transition-all hover:border-[#EEBC3F] hover:shadow-xl md:w-auto md:max-w-none"
            >
              {/* Bundle Image - Smaller aspect ratio */}
              <div className="relative">
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
                <WishlistToggleButton product={bundle} className="absolute right-3 top-3" />
              </div>

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
                      return <span className="text-xl font-bold text-[#EEBC3F]">{t('discountPercent', { percent: discountPercent })}</span>;
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

                <div className="mt-auto">
                  <BundleQuickCustomizer product={bundle} products={products} variant="light" />
                </div>
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
