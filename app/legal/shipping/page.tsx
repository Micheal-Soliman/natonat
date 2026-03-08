"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { ChevronRight, Truck, Clock, Package, RotateCcw, AlertCircle, MapPin, Phone, Mail } from "lucide-react";
import { Loading } from "@/app/components/loading";

export default function ShippingPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ShippingContent />
    </Suspense>
  );
}

function ShippingContent() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const shippingRates = [
    { region: "Cairo & Giza", standard: "Free (500+ EGP)", express: "60 EGP", time: "1-2 business days" },
    { region: "Alexandria", standard: "Free (500+ EGP)", express: "80 EGP", time: "2-3 business days" },
    { region: "Other Egypt Governorates", standard: "50 EGP", express: "100 EGP", time: "3-5 business days" },
  ];

  const returnSteps = [
    "Contact us at info@natonat.com or WhatsApp +20 100 000 0061 to initiate a return",
    "Pack the item securely in its original packaging with all tags attached",
    "Ship the package to our return address (provided in return instructions)",
    "Once received and inspected, your refund will be processed"
  ];

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F1EBE3]">
        {/* Hero - Premium */}
        <div className="bg-[#0F1A26] pt-32 pb-20 md:pt-44 md:pb-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase mb-6 block">
              Customer Service
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 tracking-tight">
              Shipping & <span className="text-[#EEBC3F]">Returns</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/50 max-w-3xl mx-auto font-light leading-relaxed">
              Everything you need to know about delivery and returns
            </p>
          </div>
        </div>

        <div ref={ref} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Shipping Section */}
          <section className={`mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#EEBC3F]/10 flex items-center justify-center">
                <Truck className="w-7 h-7 text-[#EEBC3F]" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-[#0F1A26]">Shipping Information</h2>
                <p className="text-[#0F1A26]/60">Fast delivery across Egypt</p>
              </div>
            </div>

            {/* Shipping Table */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5 mb-8 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#0F1A26]/10">
                      <th className="text-left py-4 font-bold text-[#0F1A26]">Region</th>
                      <th className="text-left py-4 font-bold text-[#0F1A26]">Standard</th>
                      <th className="text-left py-4 font-bold text-[#0F1A26]">Express</th>
                      <th className="text-left py-4 font-bold text-[#0F1A26]">Delivery Time</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#0F1A26]/70">
                    {shippingRates.map((rate, index) => (
                      <tr key={index} className="border-b border-[#0F1A26]/5 last:border-0">
                        <td className="py-4 font-medium">{rate.region}</td>
                        <td className="py-4">{rate.standard}</td>
                        <td className="py-4">{rate.express}</td>
                        <td className="py-4">{rate.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Clock, title: "Processing Time", desc: "Orders are processed within 1-2 business days. Orders placed on weekends or holidays will be processed the next business day." },
                { icon: Package, title: "Order Tracking", desc: "Once your order ships, you'll receive an email with a tracking number. You can track your shipment through the courier's website." },
                { icon: AlertCircle, title: "Delays", desc: "Delivery times are estimates. Delays may occur during peak seasons, holidays, or due to customs processing for international orders." },
              ].map((card, index) => (
                <div 
                  key={index}
                  className={`bg-white rounded-3xl p-6 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${(index + 1) * 100}ms` }}
                >
                  <card.icon className="w-10 h-10 text-[#EEBC3F] mb-4" strokeWidth={1.5} />
                  <h3 className="font-bold text-[#0F1A26] mb-2">{card.title}</h3>
                  <p className="text-[#0F1A26]/60 text-sm leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Returns Section */}
          <section className={`transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#EEBC3F]/10 flex items-center justify-center">
                <RotateCcw className="w-7 h-7 text-[#EEBC3F]" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-[#0F1A26]">Returns & Exchanges</h2>
                <p className="text-[#0F1A26]/60">Easy 30-day return policy</p>
              </div>
            </div>

            {/* Return Policy */}
            <div className="bg-white rounded-3xl p-8 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5 mb-6">
              <h3 className="font-bold text-[#0F1A26] mb-6 text-xl">Return Policy</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  "Returns accepted within 30 days of delivery",
                  "Items must be unused and in original packaging",
                  "Free size exchanges within 30 days",
                  "Refunds processed within 5-7 business days"
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#EEBC3F]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#EEBC3F] text-xs font-bold">✓</span>
                    </div>
                    <span className="text-[#0F1A26]/70">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* How to Return */}
            <div className="bg-gradient-to-br from-[#0F1A26] to-[#1a2a3a] rounded-3xl p-8 mb-6">
              <h3 className="font-bold text-white mb-6 text-xl">How to Return</h3>
              <div className="space-y-4">
                {returnSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#EEBC3F]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#EEBC3F] font-bold">{index + 1}</span>
                    </div>
                    <p className="text-white/70 pt-2">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Non-Returnable */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl p-8 border border-red-100">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-500" strokeWidth={1.5} />
                <h3 className="font-bold text-[#0F1A26]">Non-Returnable Items</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  "Items that have been used or washed",
                  "Items without original packaging",
                  "Items damaged due to improper use",
                  "Gift cards and promotional items"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <span className="text-[#0F1A26]/60 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Contact CTA */}
          <section className={`mt-16 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-gradient-to-br from-[#EEBC3F]/20 via-[#F8F6F3] to-white rounded-3xl p-8 md:p-10 border border-[#EEBC3F]/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#EEBC3F] flex items-center justify-center">
                  <Mail className="w-6 h-6 text-[#0F1A26]" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-bold text-[#0F1A26]">Questions?</h2>
              </div>
              <p className="text-[#0F1A26]/70 mb-6">
                Need help with shipping or returns? Contact our support team.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="mailto:info@natonat.com" 
                  className="inline-flex items-center gap-3 px-6 py-4 bg-white rounded-2xl border border-[#0F1A26]/10 hover:border-[#EEBC3F] transition-colors"
                >
                  <Mail className="w-5 h-5 text-[#EEBC3F]" />
                  <span className="font-medium text-[#0F1A26]">info@natonat.com</span>
                </a>
                <a 
                  href="tel:+201000000061" 
                  className="inline-flex items-center gap-3 px-6 py-4 bg-white rounded-2xl border border-[#0F1A26]/10 hover:border-[#EEBC3F] transition-colors"
                >
                  <Phone className="w-5 h-5 text-[#EEBC3F]" />
                  <span className="font-medium text-[#0F1A26]">+20 100 000 0061</span>
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
