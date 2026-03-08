"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Truck, Shield, Check, MapPin, Phone, Mail, Building, Newspaper } from "lucide-react";
import { useCart } from "@/app/lib/cart-context";
import { Loading } from "@/app/components/loading";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const { items, subtotal, clearCart } = useCart();
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setOrderComplete(true);
    clearCart(); // Clear cart after successful order
  };

  const shipping = subtotal > 1000 ? 0 : 50;
  const total = subtotal + shipping;

  if (orderComplete) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-[#F1EBE3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="max-w-md mx-auto text-center">
              <div className="w-20 h-20 rounded-full bg-[#EEBC3F]/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-[#EEBC3F]" />
              </div>
              <h1 className="text-3xl font-bold text-[#0F1A26] mb-2">Order Confirmed!</h1>
              <p className="text-[#0F1A26]/60 mb-6">
                Thank you for your order. We'll send you a confirmation email shortly.
              </p>
              <div className="bg-white rounded-2xl p-6 border border-[#0F1A26]/5 mb-6">
                <p className="text-sm text-[#0F1A26]/60 mb-1">Order Number</p>
                <p className="text-lg font-semibold text-[#0F1A26]">#NAT-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
              </div>
              <Link href="/shop">
                <Button className="bg-[#0F1A26] text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26] rounded-full px-8 h-12 font-semibold transition-all duration-300">
                  Continue Shopping
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
        <div className="bg-[#0F1A26] pt-32 pb-16 md:pt-40 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight">
              Check<span className="text-[#EEBC3F]">out</span>
            </h1>
            <p className="text-white/50 mt-4 max-w-xl mx-auto font-light text-lg">
              Complete your order and we'll ship it right away
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link 
            href="/cart" 
            className="text-sm text-[#EEBC3F] hover:text-[#0F1A26] font-medium flex items-center gap-2 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </Link>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Checkout Form */}
            <div className="flex-1">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact */}
                <div className="bg-white rounded-2xl p-6 border border-[#0F1A26]/5">
                  <h2 className="text-lg font-semibold text-[#0F1A26] mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-[#EEBC3F]" />
                    Contact Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-[#0F1A26]/60 mb-1 block">Email</label>
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
                        <span className="text-sm font-medium text-[#0F1A26]">Subscribe to our newsletter for exclusive offers & updates</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Shipping */}
                <div className="bg-white rounded-2xl p-6 border border-[#0F1A26]/5">
                  <h2 className="text-lg font-semibold text-[#0F1A26] mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-[#EEBC3F]" />
                    Shipping Address
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-[#0F1A26]/60 mb-1 block">First Name</label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-[#0F1A26]/10 focus:border-[#EEBC3F] focus:outline-none transition-colors"
                        placeholder="First"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[#0F1A26]/60 mb-1 block">Last Name</label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-[#0F1A26]/10 focus:border-[#EEBC3F] focus:outline-none transition-colors"
                        placeholder="Last"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm text-[#0F1A26]/60 mb-1 block">Address</label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-[#0F1A26]/40 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full px-4 py-3 pl-11 rounded-xl border border-[#0F1A26]/10 focus:border-[#EEBC3F] focus:outline-none transition-colors"
                          placeholder="Street address"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-[#0F1A26]/60 mb-1 block">City</label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-[#0F1A26]/40 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full px-4 py-3 pl-11 rounded-xl border border-[#0F1A26]/10 focus:border-[#EEBC3F] focus:outline-none transition-colors"
                          placeholder="City"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-[#0F1A26]/60 mb-1 block">Phone</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-[#0F1A26]/40 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 pl-11 rounded-xl border border-[#0F1A26]/10 focus:border-[#EEBC3F] focus:outline-none transition-colors"
                          placeholder="01xxxxxxxxx"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div className="bg-white rounded-2xl p-6 border border-[#0F1A26]/5">
                  <h2 className="text-lg font-semibold text-[#0F1A26] mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#EEBC3F]" />
                    Payment Method
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
                        <span className="font-medium text-[#0F1A26]">Cash on Delivery</span>
                        <p className="text-xs text-[#0F1A26]/50">Pay when you receive your order</p>
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
                        <span className="font-medium text-[#0F1A26]">Credit/Debit Card</span>
                        <p className="text-xs text-[#0F1A26]/50">Pay securely with your card</p>
                      </div>
                    </label>
                  </div>
                </div>

                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#EEBC3F] text-[#0F1A26] hover:bg-[#0F1A26] hover:text-white rounded-full h-14 font-bold text-base transition-all duration-300 disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : `Complete Order - EGP ${total}`}
                </Button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:w-96">
              <div className="bg-white rounded-2xl p-6 border border-[#0F1A26]/5 sticky top-28">
                <h2 className="text-lg font-semibold text-[#0F1A26] mb-6">Order Summary</h2>
                
                {/* Items */}
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#F8F6F3] flex-shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-[#0F1A26] truncate">{item.name}</h4>
                        <p className="text-xs text-[#0F1A26]/50">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-medium text-[#0F1A26]">
                        EGP {item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#0F1A26]/10 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#0F1A26]/60">Subtotal</span>
                    <span className="text-[#0F1A26] font-medium">EGP {subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#0F1A26]/60">Shipping</span>
                    <span className="text-[#0F1A26] font-medium">
                      {shipping === 0 ? "Free" : `EGP ${shipping}`}
                    </span>
                  </div>
                  <div className="border-t border-[#0F1A26]/10 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-[#0F1A26] font-semibold">Total</span>
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
