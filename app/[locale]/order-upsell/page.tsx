import Image from "next/image";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Footer } from "@/app/sections/footer";
import { Navigation } from "@/app/sections/navigation";
import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/lib/sanity-site-settings";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

type SiteSettings = Awaited<ReturnType<typeof getSiteSettings>>;
type UpsellProduct = NonNullable<SiteSettings["checkoutUpsell"]["product"]>;

type OrderUpsellPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    order_ref?: string;
    method?: string;
    success?: string;
    amount_egp?: string;
  }>;
};

function egp(value: number) {
  return `EGP ${Math.max(0, Math.round(value)).toLocaleString("en-US")}`;
}

function getSizedPrice(product: UpsellProduct, selectedSize?: string) {
  const key = selectedSize?.toLowerCase() as keyof NonNullable<UpsellProduct["sizePrices"]> | undefined;
  const sizePrice = key ? product.sizePrices?.[key]?.price : undefined;

  return Number(sizePrice || product.price || 0);
}

function appendQuery(path: string, params: Record<string, string | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });

  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export default async function OrderUpsellPage({
  params,
  searchParams,
}: OrderUpsellPageProps) {
  const [{ locale }, query, settings] = await Promise.all([
    params,
    searchParams,
    getSiteSettings(),
  ]);

  const { checkoutUpsell } = settings;
  const orderRef = query.order_ref || "";
  const paymentMethod = query.method || "";
  const successHref = appendQuery("/order-confirmed", {
    order_ref: orderRef,
    method: paymentMethod,
    success: query.success || "true",
  });

  const allowedMethods = checkoutUpsell.showForPaymentMethods || [];
  const amountEgp = Number(query.amount_egp || 0);
  const passesPaymentMethod =
    allowedMethods.length === 0 || !paymentMethod || allowedMethods.includes(paymentMethod);
  const passesMinimum =
    !checkoutUpsell.minimumSubtotalEgp || amountEgp === 0 || amountEgp >= checkoutUpsell.minimumSubtotalEgp;

  if (!checkoutUpsell.enabled || !checkoutUpsell.product?.slug || !passesPaymentMethod || !passesMinimum) {
    redirect(`/${locale}${successHref}`);
  }

  const product = checkoutUpsell.product;
  const imageUrl = checkoutUpsell.imageUrl || product.imageUrl || "/placeholder.svg";
  const basePrice = getSizedPrice(product, checkoutUpsell.selectedSize);
  const discountPercent = checkoutUpsell.discountPercent || 0;
  const productHref = appendQuery(`/product/${product.slug}`, {
    upsell_order_ref: orderRef,
    upsell: "checkout",
    upsell_discount_percent: discountPercent ? String(discountPercent) : undefined,
    size: checkoutUpsell.selectedSize,
    color: checkoutUpsell.selectedColor,
    return_to: successHref,
  });
  const isArabic = locale === "ar";
  const features = product.features?.filter(Boolean).slice(0, 3) || [];

  return (
    <>
      <Navigation />
      <main
        className="min-h-screen bg-[#F1EBE3] px-4 py-10 md:py-16"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <section className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-5xl items-center justify-center">
          <div className="relative w-full overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-[#0F1A26]/15">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#EEBC3F] via-[#E31E24] to-[#0F1A26]" />
            <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="relative min-h-[280px] bg-[#0F1A26] p-8 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(238,188,63,0.22),transparent_35%),radial-gradient(circle_at_70%_80%,rgba(227,30,36,0.22),transparent_32%)]" />
                <div className="relative flex h-full flex-col">
                  <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-[#EEBC3F] ring-1 ring-white/15">
                    <Sparkles className="h-4 w-4" />
                    {checkoutUpsell.badge}
                  </div>
                  <div className="relative mt-auto aspect-square max-h-[360px] w-full overflow-hidden rounded-[1.5rem] bg-white/10">
                    <Image
                      src={imageUrl}
                      alt={product.name || checkoutUpsell.title}
                      fill
                      sizes="(min-width: 1024px) 420px, 90vw"
                      className="object-contain p-8"
                      priority
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 lg:p-10">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#F1EBE3] px-4 py-2 text-sm font-bold text-[#0F1A26]">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  {isArabic ? "\u0642\u0628\u0644 \u0635\u0641\u062d\u0629 \u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0637\u0644\u0628" : "Before the success page"}
                </div>

                <h1 className="text-3xl font-black leading-tight text-[#0F1A26] sm:text-4xl">
                  {checkoutUpsell.title}
                </h1>
                <p className="mt-4 text-base font-medium leading-7 text-[#0F1A26]/70">
                  {checkoutUpsell.description}
                </p>

                <div className="mt-6 rounded-3xl border border-[#0F1A26]/10 bg-[#F8F6F3] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#E31E24]">
                        {checkoutUpsell.discountLabel}
                      </p>
                      <h2 className="mt-2 text-2xl font-black text-[#0F1A26]">
                        {product.name}
                      </h2>
                      {product.type && (
                        <p className="mt-1 text-sm font-semibold text-[#0F1A26]/55">
                          {product.type}
                        </p>
                      )}
                    </div>

                    <div className="text-end">
                      <p className="text-sm font-bold text-[#0F1A26]/45">
                        {isArabic ? "\u0633\u0639\u0631 \u0627\u0644\u0645\u0646\u062a\u062c" : "Product price"}
                      </p>
                      <p className="text-3xl font-black text-[#E31E24]">
                        {egp(basePrice)}
                      </p>
                      {discountPercent > 0 && (
                        <p className="mt-1 text-sm font-extrabold text-green-600">
                          {isArabic ? `\u0647\u064a\u0646\u062a \u062e\u0635\u0645 ${discountPercent}%` : `${discountPercent}% hint`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#0F1A26]/70">
                    {discountPercent > 0 && (
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-green-100 text-base font-black text-green-700">
                        {discountPercent}%
                      </span>
                    )}
                    <span>{checkoutUpsell.hint}</span>
                  </div>

                  {features.length > 0 && (
                    <div className="mt-5 grid gap-2">
                      {features.map((feature) => (
                        <div key={feature} className="flex items-start gap-2 text-sm font-semibold text-[#0F1A26]/70">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <Button
                    asChild
                    className="h-14 rounded-2xl bg-[#E31E24] text-base font-black text-white shadow-lg shadow-[#E31E24]/25 hover:bg-[#C9161C]"
                  >
                    <Link href={productHref}>
                      {checkoutUpsell.ctaLabel}
                      <ArrowRight className={`h-5 w-5 ${isArabic ? "rotate-180" : ""}`} />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="h-14 rounded-2xl border-[#0F1A26]/20 bg-white text-base font-black"
                  >
                    <Link href={successHref}>
                      {checkoutUpsell.declineLabel}
                    </Link>
                  </Button>
                </div>

                <p className="mt-4 text-center text-xs font-semibold text-[#0F1A26]/45">
                  {isArabic
                    ? "\u0627\u062e\u062a\u064a\u0627\u0631\u0643 \u0645\u0634 \u0647\u064a\u0623\u062b\u0631 \u0639\u0644\u0649 \u0627\u0644\u0623\u0648\u0631\u062f\u0631 \u0627\u0644\u0623\u0633\u0627\u0633\u064a \u2014 \u062a\u0642\u062f\u0631 \u062a\u0643\u0645\u0644 \u0639\u0627\u062f\u064a."
                    : "Your original order is already safe \u2014 you can continue either way."}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
