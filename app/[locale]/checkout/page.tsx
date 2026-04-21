"use client";

import { Suspense, useState, useEffect, useId } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from 'next-intl';
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Truck, Shield, Check, MapPin, Phone, Mail, Building, Newspaper, Store, Package } from "lucide-react";
import { useCart } from "@/app/lib/cart-context";
import { Loading } from "@/app/components/loading";

function generateOrderId() {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
}

function generateOrderRef() {
  return `NAT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const t = useTranslations('checkout');
  const locale = useLocale();
  const { items, subtotal, clearCart, buyNowItem, setBuyNowItem } = useCart();
  
  // Use buyNowItem if exists (direct purchase), otherwise use cart items
  const rawCheckoutItems = buyNowItem ? [buyNowItem] : items;
  
  // Group duplicate items (same id + size + color) and sum quantities
  const checkoutItems = rawCheckoutItems.reduce((acc: typeof rawCheckoutItems, item) => {
    const existing = acc.find(
      (i) => i.id === item.id && i.size === item.size && i.color === item.color
    );
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, []);
  
  const checkoutSubtotal = buyNowItem 
    ? (buyNowItem.price || 0) * (buyNowItem.quantity || 1) 
    : subtotal;
  
  // Debug logging for buyNow issues
  useEffect(() => {
    if (buyNowItem) {
      console.log("[Checkout] Buy Now Item:", buyNowItem);
      console.log("[Checkout] Calculated subtotal:", checkoutSubtotal);
      if (!buyNowItem.price || buyNowItem.price === 0) {
        console.error("[Checkout] ERROR: Buy Now item has no price!", buyNowItem);
      }
    }
  }, [buyNowItem, checkoutSubtotal]);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    phone: "",
    newsletter: false,
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [deliveryMethod, setDeliveryMethod] = useState("delivery");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string>("");
  const [submitError, setSubmitError] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);

    const orderRef = generateOrderRef();

    if (paymentMethod === "card") {
      try {
        const publicKey = process.env.NEXT_PUBLIC_PAYMOB_PUBLIC_KEY;
        const paymobBaseUrl = process.env.NEXT_PUBLIC_PAYMOB_BASE_URL || "https://accept.paymob.com";

        if (!publicKey) {
          throw new Error("NEXT_PUBLIC_PAYMOB_PUBLIC_KEY is not set");
        }

        const origin = window.location.origin;
        const notificationUrl = `${origin}/api/paymob/webhook`;
        const redirectionUrl = `${origin}/${locale}/payment/return`;

        const intentionItems = checkoutItems.map((item) => ({
          name: item.name,
          amount: Math.round(item.price * item.quantity * 100),
          description: item.slug,
          quantity: item.quantity,
        }));

        if (deliveryMethod === "delivery" && shipping > 0) {
          intentionItems.push({
            name: "Shipping",
            amount: Math.round(shipping * 100),
            description: "delivery",
            quantity: 1,
          });
        }

        const amountCents = Math.round(total * 100);
        const itemsSum = intentionItems.reduce((sum, it) => sum + it.amount, 0);
        if (itemsSum !== amountCents) {
          throw new Error("Invalid amount: items sum does not match total");
        }

        const res = await fetch("/api/paymob/intention", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amountCents,
            currency: "EGP",
            items: intentionItems,
            billing_data: {
              apartment: "NA",
              first_name: formData.firstName || "Customer",
              last_name: formData.lastName || "NA",
              street: formData.address || "NA",
              building: "NA",
              phone_number: formData.phone,
              city: formData.city || "NA",
              country: "EG",
              email: formData.email,
              floor: "NA",
              state: "NA",
            },
            extras: {
              locale,
              delivery_method: deliveryMethod,
              order_ref: orderRef,
              customer_email: formData.email,
              customer_phone: formData.phone,
              total_egp: total,
            },
            special_reference: orderRef,
            notification_url: notificationUrl,
            redirection_url: redirectionUrl,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Failed to create intention");
        }

        const clientSecret = data?.client_secret;
        if (!clientSecret) {
          throw new Error("Paymob response missing client_secret");
        }

        const shippingRule = deliveryMethod === "pickup" 
          ? "pickup_free" 
          : checkoutSubtotal > 1000 
            ? "subtotal_over_1000_free" 
            : formData.city === "cairo" || formData.city === "giza" || formData.city === "alexandria" 
              ? "cairo_giza_alex_75" 
              : "other_governorates_100";

        await fetch("/api/orders/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "checkout",
            order_ref: orderRef,
            locale,
            payment_method: "paymob_card",
            status: "created",
            payment_status: "Pending",
            amount_egp: total,
            amount_cents: amountCents,
            shipping_egp: shipping,
            delivery_method: deliveryMethod,
            customer: {
              email: formData.email,
              phone: formData.phone,
              first_name: formData.firstName,
              last_name: formData.lastName,
              city: formData.city,
              address: formData.address,
            },
            items: checkoutItems.map((item) => ({
              id: item.id,
              name: item.name,
              slug: item.slug,
              price_egp: item.price,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              type: item.type,
              image: item.image,
            })),
            paymob: {
              client_secret: clientSecret,
              intention_order_id: data?.intention_order_id,
              id: data?.id,
              special_reference: orderRef,
            },
            extras: {
              shipping_rule: shippingRule,
              city_key: formData.city,
              subtotal_egp: checkoutSubtotal,
              free_shipping_threshold: 1000,
              order_url: `${origin}/${locale}/orders/${orderRef}`,
            },
            created_at: new Date().toISOString(),
          }),
        });

        const checkoutUrl = `${paymobBaseUrl}/unifiedcheckout/?publicKey=${encodeURIComponent(publicKey)}&clientSecret=${encodeURIComponent(clientSecret)}`;
        window.location.href = checkoutUrl;
        return;
      } catch (err) {
        setIsSubmitting(false);
        setSubmitError(err instanceof Error ? err.message : "Payment initialization failed");
        return;
      }
    }

    // Simulate order processing
    await new Promise(resolve => setTimeout(() => {
      setIsSubmitting(false);
      setOrderId(generateOrderId());
      setIsSuccess(true);
      clearCart(); // Clear cart after successful order
      setBuyNowItem(null); // Clear buyNowItem after successful order
    }, 1500));

    const shippingRuleCOD = deliveryMethod === "pickup" 
      ? "pickup_free" 
      : checkoutSubtotal > 1000 
        ? "subtotal_over_1000_free" 
        : formData.city === "cairo" || formData.city === "giza" || formData.city === "alexandria" 
          ? "cairo_giza_alex_75" 
          : "other_governorates_100";

    try {
      await fetch("/api/orders/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "checkout",
          order_ref: orderRef,
          locale,
          payment_method: paymentMethod,
          status: "confirmed",
          payment_status: paymentMethod === "cod" ? "Cash on Delivery" : "Confirmed",
          amount_egp: total,
          amount_cents: Math.round(total * 100),
          shipping_egp: shipping,
          delivery_method: deliveryMethod,
          customer: {
            email: formData.email,
            phone: formData.phone,
            first_name: formData.firstName,
            last_name: formData.lastName,
            city: formData.city,
            address: formData.address,
          },
          items: checkoutItems.map((item) => ({
            id: item.id,
            name: item.name,
            slug: item.slug,
            price_egp: item.price,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            type: item.type,
            image: item.image,
          })),
          extras: {
            shipping_rule: shippingRuleCOD,
            city_key: formData.city,
            subtotal_egp: checkoutSubtotal,
            free_shipping_threshold: 1000,
            bank_name: paymentMethod === "card" ? "Eligible Banks: NBE, CIB, Banque Misr" : null,
          },
          created_at: new Date().toISOString(),
        }),
      });
    } catch {
      // ignore logging failures
    }
  };

  // Shipping: 75 EGP for Cairo, Giza & Alexandria, 100 EGP for other cities, free for orders > 1000, pickup = 0
  const getShippingCost = () => {
    if (deliveryMethod === "pickup") return 0;
    if (checkoutSubtotal > 1000) return 0;
    const cityKey = (formData.city || "").toLowerCase();
    const isCairoGizaAlex = cityKey === "cairo" || cityKey === "giza" || cityKey === "alexandria";
    return isCairoGizaAlex ? 75 : 100;
  };
  const shipping = getShippingCost();
  const total = checkoutSubtotal + shipping;

  if (isSuccess) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-[#F1EBE3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-40">
            <div className="max-w-md mx-auto text-center">
              <div className="w-20 h-20 rounded-full bg-[#EEBC3F]/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-[#EEBC3F]" />
              </div>
              <h1 className="text-3xl font-bold text-[#0F1A26] mb-2">{t('success.title')}</h1>
              <p className="text-[#0F1A26]/60 mb-6">
                {t('success.subtitle')}
              </p>
              <div className="bg-white rounded-2xl p-6 border border-[#0F1A26]/5 mb-6">
                <p className="text-sm text-[#0F1A26]/60 mb-1">{t('success.orderNumber')}</p>
                <p className="text-lg font-semibold text-[#0F1A26]">#NAT-{orderId}</p>
              </div>
              <Link href="/shop">
                <Button className="bg-[#0F1A26] text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26] rounded-full px-8 h-12 font-semibold transition-all duration-300">
                  {t('success.continueShopping')}
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F1EBE3]">
        {/* Header - Clean */}
        <div className="bg-[#0F1A26] pt-28 pb-16 md:pt-40 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight">
              {t('header.title').split(' ')[0]}<span className="text-[#EEBC3F]">{t('header.title').split(' ')[1] || ''}</span>
            </h1>
            <p className="text-white/50 mt-4 max-w-xl mx-auto font-light text-base md:text-lg">
              {t('header.subtitle')}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link 
            href="/cart" 
            className="text-sm text-[#EEBC3F] hover:text-[#0F1A26] font-medium flex items-center gap-2 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToCart')}
          </Link>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Checkout Form */}
            <div className="flex-1">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact */}
                <div className="bg-white rounded-2xl p-6 border border-[#0F1A26]/5">
                  <h2 className="text-lg font-semibold text-[#0F1A26] mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-[#EEBC3F]" />
                    {t('form.contact.title')}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-[#0F1A26]/60 mb-1 block">{t('form.contact.email')}</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-[#0F1A26]/10 focus:border-[#EEBC3F] focus:outline-none transition-colors"
                        placeholder="your@email.com"
                      />
                    </div>
                    {/* Newsletter Subscribe */}
                    <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-[#EEBC3F]/20 cursor-pointer transition-all hover:bg-[#EEBC3F]/5 hover:border-[#EEBC3F]/40">
                      <input
                        type="checkbox"
                        checked={formData.newsletter}
                        onChange={(e) => setFormData({ ...formData, newsletter: e.target.checked })}
                        className="w-5 h-5 accent-[#EEBC3F] rounded"
                      />
                      <div className="flex items-center gap-2">
                        <Newspaper className="w-4 h-4 text-[#EEBC3F]" />
                        <span className="text-sm font-medium text-[#0F1A26]">{t('form.contact.newsletter')}</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Delivery Method */}
                <div className="bg-white rounded-2xl p-6 border border-[#0F1A26]/5">
                  <h2 className="text-lg font-semibold text-[#0F1A26] mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#EEBC3F]" />
                    {t('form.delivery.title')}
                  </h2>
                  <div className="space-y-3">
                    <label 
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        deliveryMethod === "delivery" 
                          ? "border-[#EEBC3F] bg-[#EEBC3F]/5" 
                          : "border-[#0F1A26]/10"
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery"
                        value="delivery"
                        checked={deliveryMethod === "delivery"}
                        onChange={(e) => setDeliveryMethod(e.target.value)}
                        className="w-4 h-4 accent-[#EEBC3F]"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-[#0F1A26]">{t('form.delivery.deliveryOption.title')}</span>
                        <p className="text-xs text-[#0F1A26]/50">{t('form.delivery.deliveryOption.subtitle')}</p>
                      </div>
                    </label>
                    <label 
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        deliveryMethod === "pickup" 
                          ? "border-[#EEBC3F] bg-[#EEBC3F]/5" 
                          : "border-[#0F1A26]/10"
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery"
                        value="pickup"
                        checked={deliveryMethod === "pickup"}
                        onChange={(e) => setDeliveryMethod(e.target.value)}
                        className="w-4 h-4 accent-[#EEBC3F]"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-[#0F1A26]">{t('form.delivery.pickupOption.title')}</span>
                        <p className="text-xs text-[#0F1A26]/50">{t('form.delivery.pickupOption.subtitle')}</p>
                      </div>
                    </label>

                    {/* Pickup Customer Details */}
                    {deliveryMethod === "pickup" && (
                      <div className="mx-4 md:ml-7 p-4 md:p-5 bg-[#EEBC3F]/10 rounded-xl border border-[#EEBC3F]/30 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-full bg-[#EEBC3F] flex items-center justify-center">
                            <Store className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-sm font-semibold text-[#0F1A26]">{t('form.delivery.pickupLocation.title')}</p>
                        </div>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm text-[#0F1A26]/60 mb-1 block">{t('form.shipping.firstName')}</label>
                              <input
                                type="text"
                                required
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-lg border border-[#0F1A26]/10 focus:border-[#EEBC3F] focus:outline-none transition-colors text-sm"
                                placeholder={t('form.shipping.firstNamePlaceholder')}
                              />
                            </div>
                            <div>
                              <label className="text-sm text-[#0F1A26]/60 mb-1 block">{t('form.shipping.lastName')}</label>
                              <input
                                type="text"
                                required
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-lg border border-[#0F1A26]/10 focus:border-[#EEBC3F] focus:outline-none transition-colors text-sm"
                                placeholder={t('form.shipping.lastNamePlaceholder')}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm text-[#0F1A26]/60 mb-1 block">{t('form.shipping.phone')}</label>
                            <div className="relative">
                              <Phone className="w-4 h-4 text-[#0F1A26]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3 py-2.5 pl-10 rounded-lg border border-[#0F1A26]/10 focus:border-[#EEBC3F] focus:outline-none transition-colors text-sm"
                                placeholder={t('form.shipping.phonePlaceholder')}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col p-3 bg-white rounded-lg mt-3">
                            <span className="text-sm text-[#0F1A26]/60 mb-1">{t('form.delivery.pickupLocation.addressLabel')}</span>
                            <span className="text-sm font-medium text-[#0F1A26]">{t('form.pickupLocation.name')}</span>
                            <span className="text-sm font-medium text-[#0F1A26]">{t('form.pickupLocation.address')}</span>
                          </div>
                          <a 
                            href={t('form.pickupLocation.mapUrl')} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 p-2 bg-white rounded-lg text-sm font-medium text-[#0F1A26] hover:bg-[#EEBC3F]/20 transition-colors"
                          >
                            <MapPin className="w-4 h-4 text-[#EEBC3F]" />
                            {t('form.delivery.pickupLocation.viewOnMap')}
                          </a>
                          <p className="text-xs text-[#0F1A26]/60 text-center">
                            {t('form.delivery.pickupLocation.instruction')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping - only show when delivery is selected */}
                {deliveryMethod === "delivery" && (
                  <div className="bg-white rounded-2xl p-6 border border-[#0F1A26]/5">
                    <h2 className="text-lg font-semibold text-[#0F1A26] mb-4 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-[#EEBC3F]" />
                      {t('form.shipping.title')}
                    </h2>
                    <p className="text-sm text-[#EEBC3F] mb-4 font-medium">
                      {t('form.shipping.egyptOnly')}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-[#0F1A26]/60 mb-1 block">{t('form.shipping.firstName')}</label>
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-[#0F1A26]/10 focus:border-[#EEBC3F] focus:outline-none transition-colors"
                          placeholder={t('form.shipping.firstNamePlaceholder')}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-[#0F1A26]/60 mb-1 block">{t('form.shipping.lastName')}</label>
                        <input
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-[#0F1A26]/10 focus:border-[#EEBC3F] focus:outline-none transition-colors"
                          placeholder={t('form.shipping.lastNamePlaceholder')}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm text-[#0F1A26]/60 mb-1 block">{t('form.shipping.address')}</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <MapPin className="w-4 h-4 text-[#0F1A26]/40 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              required
                              value={formData.address}
                              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                              className="w-full px-4 py-3 pl-11 rounded-xl border border-[#0F1A26]/10 focus:border-[#EEBC3F] focus:outline-none transition-colors"
                              placeholder={t('form.shipping.addressPlaceholder')}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                  (position) => {
                                    setFormData({ 
                                      ...formData, 
                                      address: `Lat: ${position.coords.latitude.toFixed(6)}, Lng: ${position.coords.longitude.toFixed(6)}` 
                                    });
                                  },
                                  (error) => {
                                    console.error('Error getting location:', error);
                                    alert(t('form.location.error'));
                                  }
                                );
                              } else {
                                alert(t('form.location.notSupported'));
                              }
                            }}
                            className="px-4 py-3 rounded-xl border-2 border-[#EEBC3F]/30 bg-[#EEBC3F]/5 hover:bg-[#EEBC3F]/10 hover:border-[#EEBC3F] transition-all flex items-center gap-2 whitespace-nowrap"
                          >
                            <MapPin className="w-4 h-4 text-[#EEBC3F]" />
                            <span className="text-sm font-medium text-[#0F1A26]">{t('form.location.detect')}</span>
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-[#0F1A26]/60 mb-1 block">{t('form.shipping.city')}</label>
                        <div className="relative">
                          <Building className="w-4 h-4 text-[#0F1A26]/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <select
                            required
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full px-4 py-3 pl-11 rounded-xl border border-[#0F1A26]/10 focus:border-[#EEBC3F] focus:outline-none transition-colors bg-white text-[#0F1A26] font-medium appearance-none"
                          >
                            <option value="" className="text-[#0F1A26]">{t('form.shipping.cityPlaceholder')}</option>
                            <option value="cairo" className="text-[#0F1A26]">القاهرة</option>
                            <option value="alexandria" className="text-[#0F1A26]">الإسكندرية</option>
                            <option value="giza" className="text-[#0F1A26]">الجيزة</option>
                            <option value="qalyubia" className="text-[#0F1A26]">القليوبية</option>
                            <option value="port_said" className="text-[#0F1A26]">بورسعيد</option>
                            <option value="suez" className="text-[#0F1A26]">السويس</option>
                            <option value="luxor" className="text-[#0F1A26]">الأقصر</option>
                            <option value="aswan" className="text-[#0F1A26]">أسوان</option>
                            <option value="asyut" className="text-[#0F1A26]">أسيوط</option>
                            <option value="beheira" className="text-[#0F1A26]">البحيرة</option>
                            <option value="beni_suef" className="text-[#0F1A26]">بني سويف</option>
                            <option value="dakahlia" className="text-[#0F1A26]">الدقهلية</option>
                            <option value="damietta" className="text-[#0F1A26]">دمياط</option>
                            <option value="faiyum" className="text-[#0F1A26]">الفيوم</option>
                            <option value="gharbia" className="text-[#0F1A26]">الغربية</option>
                            <option value="ismailia" className="text-[#0F1A26]">الإسماعيلية</option>
                            <option value="kafr_el_sheikh" className="text-[#0F1A26]">كفر الشيخ</option>
                            <option value="matrouh" className="text-[#0F1A26]">مطروح</option>
                            <option value="minya" className="text-[#0F1A26]">المنيا</option>
                            <option value="monufia" className="text-[#0F1A26]">المنوفية</option>
                            <option value="new_valley" className="text-[#0F1A26]">الوادي الجديد</option>
                            <option value="north_sinai" className="text-[#0F1A26]">شمال سيناء</option>
                            <option value="qena" className="text-[#0F1A26]">قنا</option>
                            <option value="red_sea" className="text-[#0F1A26]">البحر الأحمر</option>
                            <option value="sharqia" className="text-[#0F1A26]">الشرقية</option>
                            <option value="sohag" className="text-[#0F1A26]">سوهاج</option>
                            <option value="south_sinai" className="text-[#0F1A26]">جنوب سيناء</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-[#0F1A26]/60 mb-1 block">{t('form.shipping.phone')}</label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-[#0F1A26]/40 absolute left-4 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-3 pl-11 rounded-xl border border-[#0F1A26]/10 focus:border-[#EEBC3F] focus:outline-none transition-colors"
                            placeholder={t('form.shipping.phonePlaceholder')}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment */}
                <div className="bg-white rounded-2xl p-6 border border-[#0F1A26]/5">
                  <h2 className="text-lg font-semibold text-[#0F1A26] mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#EEBC3F]" />
                    {t('form.payment.title')}
                  </h2>
                  <div className="space-y-3">
                    <label 
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === "cod" 
                          ? "border-[#EEBC3F] bg-[#EEBC3F]/5" 
                          : "border-[#0F1A26]/10"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 accent-[#EEBC3F]"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-[#0F1A26]">{t('form.payment.cod.title')}</span>
                        <p className="text-xs text-[#0F1A26]/50">{t('form.payment.cod.subtitle')}</p>
                      </div>
                    </label>
                    <label 
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === "card" 
                          ? "border-[#EEBC3F] bg-[#EEBC3F]/5" 
                          : "border-[#0F1A26]/10"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="card"
                        checked={paymentMethod === "card"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 accent-[#EEBC3F]"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-[#0F1A26]">{t('form.payment.card.title')}</span>
                        <p className="text-xs text-[#0F1A26]/50">{t('form.payment.card.subtitle')}</p>
                      </div>
                    </label>

                    <label 
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === "instapay" 
                          ? "border-[#EEBC3F] bg-[#EEBC3F]/5" 
                          : "border-[#0F1A26]/10"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="instapay"
                        checked={paymentMethod === "instapay"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 accent-[#EEBC3F]"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-[#0F1A26]">{t('form.payment.instapay.title')}</span>
                        <p className="text-xs text-[#0F1A26]/50">{t('form.payment.instapay.subtitle')}</p>
                      </div>
                    </label>

                    {/* InstaPay Account Details Dropdown */}
                    {paymentMethod === "instapay" && (
                      <div className="mx-4 md:ml-7 p-3 md:p-4 bg-[#EEBC3F]/10 rounded-xl border border-[#EEBC3F]/30 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-[#EEBC3F] flex items-center justify-center">
                            <span className="text-white text-sm font-bold">i</span>
                          </div>
                          <p className="text-sm font-semibold text-[#0F1A26]">{t('form.payment.instapay.transferDetails')}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                            <span className="text-sm text-[#0F1A26]/60">{t('form.payment.instapay.accountName')}</span>
                            <span className="text-sm font-medium text-[#0F1A26]">{t('form.instapayAccount.name')}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                            <span className="text-sm text-[#0F1A26]/60">{t('form.payment.instapay.accountNumber')}</span>
                            <span className="text-sm font-medium text-[#0F1A26] dir-ltr">{t('form.instapayAccount.number')}</span>
                          </div>
                        </div>
                        <p className="text-xs text-[#0F1A26]/60 mt-3 text-center">
                          {t('form.payment.instapay.instruction')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#EEBC3F] text-[#0F1A26] hover:bg-[#0F1A26] hover:text-white rounded-full h-14 font-bold text-base transition-all duration-300 disabled:opacity-50"
                >
                  {isSubmitting 
                    ? t('form.processing') 
                    : mounted 
                      ? deliveryMethod === "delivery" && !formData.city
                        ? `${t('form.completeOrder', { total: checkoutSubtotal.toString() })} (${t('form.selectCity')})`
                        : t('form.completeOrder', { total: total.toString() })
                      : t('form.completeOrder', { total: "--" })
                  }
                </Button>

                {submitError ? (
                  <p className="text-sm text-red-600 mt-3">{submitError}</p>
                ) : null}
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:w-96 order-first lg:order-last">
              <div className="bg-white rounded-2xl p-6 border border-[#0F1A26]/5 lg:sticky lg:top-28">
                <h2 className="text-lg font-semibold text-[#0F1A26] mb-2">{t('summary.title')}</h2>
                {buyNowItem ? (
                  <p className="text-xs text-[#EEBC3F] font-medium mb-4">{t('summary.buyNowMode') || '🛒 Buy Now - Quick Purchase'}</p>
                ) : (
                  <p className="text-xs text-[#0F1A26]/60 mb-4">{t('summary.cartMode') || '🛍️ From Cart'}</p>
                )}
                
                {/* Items */}
                <div className="space-y-4 mb-6">
                  {!mounted ? (
                    <div className="flex gap-3">
                      <div className="w-24 h-24 rounded-lg bg-[#F8F6F3] flex-shrink-0 animate-pulse" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="h-4 bg-[#F8F6F3] rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-[#F8F6F3] rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  ) : checkoutItems.map((item, index) => (
                    <Link
                      key={`${item.id}-${item.size || 'no-size'}-${item.color || 'no-color'}-${index}`}
                      href={`/product/${item.slug}`}
                      className="flex gap-3 group cursor-pointer"
                      prefetch={false}
                    >
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-[#F8F6F3] flex-shrink-0 relative">
                        <Image 
                          src={item.image} 
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-[#0F1A26] truncate group-hover:text-[#EEBC3F] transition-colors">{item.name}</h4>
                        {/* Show size for covers, color for passport wallets */}
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {item.size && (
                            <span className="text-[10px] bg-[#EEBC3F]/10 text-[#0F1A26]/70 px-1.5 py-0.5 rounded">
                              {t('summary.size') || 'Size'}: {item.size.toUpperCase()}
                            </span>
                          )}
                          {item.color && (
                            <span className="text-[10px] bg-[#EEBC3F]/10 text-[#0F1A26]/70 px-1.5 py-0.5 rounded capitalize">
                              {t('summary.color') || 'Color'}: {item.color}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#0F1A26]/50 mt-0.5">{t('summary.qty', { quantity: item.quantity })}</p>
                      </div>
                      <span className="text-sm font-medium text-[#0F1A26]">
                        EGP {item.price * item.quantity}
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="border-t border-[#0F1A26]/10 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#0F1A26]/60">{t('summary.subtotal')}</span>
                    <span className="text-[#0F1A26] font-medium">
                      EGP {mounted ? checkoutSubtotal : "--"}
                    </span>
                  </div>
                  {deliveryMethod === "delivery" && formData.city ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#0F1A26]/60">{t('summary.shipping')}</span>
                      <span className="text-[#0F1A26] font-medium">
                        {shipping === 0 
                          ? `${t('summary.free')} ${t('summary.freeShippingOver1000') || '(Order > 1000 EGP)'}` 
                          : `EGP ${shipping}`
                        }
                      </span>
                    </div>
                  ) : deliveryMethod === "delivery" ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#0F1A26]/60">{t('summary.shipping')}</span>
                      <span className="text-[#0F1A26]/50 font-medium text-xs">{t('summary.selectCityForShipping')}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#0F1A26]/60">{t('summary.shipping')}</span>
                      <span className="text-[#0F1A26] font-medium">{t('summary.free')}</span>
                    </div>
                  )}
                  <div className="border-t border-[#0F1A26]/10 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-[#0F1A26] font-semibold">{t('summary.total')}</span>
                      <span className="text-[#0F1A26] font-bold text-lg">
                        EGP {mounted 
                          ? (deliveryMethod === "delivery" && !formData.city ? checkoutSubtotal : total) 
                          : "--"
                        }
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
