"use client";

import { Suspense, useState, useId } from "react";
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
  const checkoutItems = buyNowItem ? [buyNowItem] : items;
  const checkoutSubtotal = buyNowItem 
    ? buyNowItem.price * buyNowItem.quantity 
    : subtotal;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate order processing
    await new Promise(resolve => setTimeout(() => {
      setIsSubmitting(false);
      setOrderId(generateOrderId());
      setIsSuccess(true);
      clearCart(); // Clear cart after successful order
      setBuyNowItem(null); // Clear buyNowItem after successful order
    }, 1500));
  };

  // Shipping: 75 EGP for Cairo & Alexandria, 100 EGP for other cities, free for orders > 1000
  const getShippingCost = () => {
    if (checkoutSubtotal > 1000) return 0;
    const cityLower = formData.city.toLowerCase();
    const isCairoOrAlex = cityLower.includes('cairo') || 
                          cityLower.includes('القاهرة') || 
                          cityLower.includes('alexandria') || 
                          cityLower.includes('الإسكندرية') ||
                          cityLower.includes('alex');
    return isCairoOrAlex ? 75 : 100;
  };
  const shipping = getShippingCost();
  const total = checkoutSubtotal + shipping;

  if (isSuccess) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-[#F1EBE3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
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

                    {/* Pickup Location Details */}
                    {deliveryMethod === "pickup" && (
                      <div className="mx-4 md:ml-7 p-3 md:p-4 bg-[#EEBC3F]/10 rounded-xl border border-[#EEBC3F]/30 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-[#EEBC3F] flex items-center justify-center">
                            <Store className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-sm font-semibold text-[#0F1A26]">{t('form.delivery.pickupLocation.title')}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-col p-3 bg-white rounded-lg">
                            <span className="text-sm text-[#0F1A26]/60 mb-1">{t('form.delivery.pickupLocation.addressLabel')}</span>
                            <span className="text-sm font-medium text-[#0F1A26]">{t('form.pickupLocation.name')}</span>
                            <span className="text-sm font-medium text-[#0F1A26]">{t('form.pickupLocation.address')}</span>
                          </div>
                        </div>
                        <a 
                          href={t('form.pickupLocation.mapUrl')} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 mt-3 p-2 bg-white rounded-lg text-sm font-medium text-[#0F1A26] hover:bg-[#EEBC3F]/20 transition-colors"
                        >
                          <MapPin className="w-4 h-4 text-[#EEBC3F]" />
                          {t('form.delivery.pickupLocation.viewOnMap')}
                        </a>
                        <p className="text-xs text-[#0F1A26]/60 mt-3 text-center">
                          {t('form.delivery.pickupLocation.instruction')}
                        </p>
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
                          <Building className="w-4 h-4 text-[#0F1A26]/40 absolute left-4 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full px-4 py-3 pl-11 rounded-xl border border-[#0F1A26]/10 focus:border-[#EEBC3F] focus:outline-none transition-colors"
                            placeholder={t('form.shipping.cityPlaceholder')}
                          />
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
                    
                    {/* Credit Card Banks Dropdown */}
                    {paymentMethod === "card" && (
                      <div className="mx-2 p-5 bg-gradient-to-br from-[#F8F6F3] to-white rounded-2xl border border-[#EEBC3F]/20 shadow-sm animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-xl bg-[#EEBC3F] flex items-center justify-center">
                            <Building className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-sm font-semibold text-[#0F1A26]">{t('form.payment.card.selectBank')}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            { key: 'nbe', name: t('form.banks.nbe') },
                            { key: 'cib', name: t('form.banks.cib') },
                            { key: 'qnb', name: t('form.banks.qnb') },
                            { key: 'banqueMisr', name: t('form.banks.banqueMisr') },
                            { key: 'alexBank', name: t('form.banks.alexBank') },
                            { key: 'adib', name: t('form.banks.adib') }
                          ].map((bank) => (
                            <label key={bank.name} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#0F1A26]/5 hover:border-[#EEBC3F]/50 hover:shadow-md cursor-pointer transition-all duration-200 group">
                              <input type="radio" name="bank" className="w-4 h-4 accent-[#EEBC3F]" />
                              <span className="text-sm font-medium text-[#0F1A26] group-hover:text-[#EEBC3F] transition-colors">{bank.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

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
                  {isSubmitting ? t('form.processing') : t('form.completeOrder', { total: total.toString() })}
                </Button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:w-96 order-first lg:order-last">
              <div className="bg-white rounded-2xl p-6 border border-[#0F1A26]/5 lg:sticky lg:top-28">
                <h2 className="text-lg font-semibold text-[#0F1A26] mb-6">{t('summary.title')}</h2>
                
                {/* Items */}
                <div className="space-y-4 mb-6">
                  {checkoutItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/product/${item.slug}`}
                      className="flex gap-3 group cursor-pointer"
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
                    <span className="text-[#0F1A26] font-medium">EGP {checkoutSubtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#0F1A26]/60">{t('summary.shipping')}</span>
                    <span className="text-[#0F1A26] font-medium">
                      {shipping === 0 ? t('summary.free') : `EGP ${shipping}`}
                    </span>
                  </div>
                  <div className="border-t border-[#0F1A26]/10 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-[#0F1A26] font-semibold">{t('summary.total')}</span>
                      <span className="text-[#0F1A26] font-bold text-lg">EGP {total}</span>
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
