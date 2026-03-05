"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { ChevronRight, Shield, Check, AlertTriangle, Clock, Package, Sparkles, Mail, ArrowRight } from "lucide-react";

export default function WarrantyPage() {
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

  const claimSteps = [
    { title: "Contact Us", desc: "Email info@natonat.com or WhatsApp +20 100 000 0061 with your order number and description of the issue." },
    { title: "Provide Evidence", desc: "Send clear photos showing the defect. For manufacturing issues, we may request the item be returned for inspection." },
    { title: "Resolution", desc: "Once approved, we'll send a replacement or issue a refund. We cover shipping costs for warranty replacements." }
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
              <span className="text-[#EEBC3F]">6-Month</span> Warranty
            </h1>
            <p className="text-xl md:text-2xl text-white/50 max-w-3xl mx-auto font-light leading-relaxed">
              Our commitment to quality and your satisfaction
            </p>
          </div>
        </div>

        <div ref={ref} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Warranty Badge */}
          <div className={`flex justify-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-4 bg-gradient-to-r from-[#EEBC3F]/20 to-[#EEBC3F]/5 rounded-3xl p-6 border border-[#EEBC3F]/20">
              <div className="w-16 h-16 rounded-2xl bg-[#EEBC3F] flex items-center justify-center">
                <Shield className="w-8 h-8 text-[#0F1A26]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-[#0F1A26]/50">Limited Warranty</p>
                <p className="text-2xl font-bold text-[#0F1A26]">6 Months</p>
              </div>
            </div>
          </div>

          {/* Coverage */}
          <section className={`mb-16 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#EEBC3F]" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-bold text-[#0F1A26]">What's Covered</h2>
            </div>
            <div className="bg-white rounded-3xl p-8 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5">
              <p className="text-[#0F1A26]/70 mb-6 text-lg">
                All natOnat products come with a <strong className="text-[#0F1A26]">6-month limited warranty</strong> against manufacturing defects from the date of purchase.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
                  <h3 className="font-bold text-[#0F1A26] mb-4 flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" strokeWidth={2} />
                    Covered Defects
                  </h3>
                  <ul className="space-y-3 text-[#0F1A26]/70">
                    {["Broken or failed stitching", "Elastic failure or breakage", "Zipper defects", "Material defects (holes, tears)", "Hardware defects (buckles, clips)"].map((item, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                  <h3 className="font-bold text-[#0F1A26] mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" strokeWidth={2} />
                    Not Covered
                  </h3>
                  <ul className="space-y-3 text-[#0F1A26]/70">
                    {["Normal wear and tear", "Damage from misuse or abuse", "Accidental damage", "Color fading from sun exposure", "Damage from improper washing", "Damage from airline handling"].map((item, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Product Specific */}
          <section className={`mb-16 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-[#EEBC3F]" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-bold text-[#0F1A26]">Product-Specific Warranty</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5">
                <h3 className="font-bold text-[#0F1A26] mb-4 text-lg">Luggage Covers</h3>
                <ul className="space-y-2 text-[#0F1A26]/70">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EEBC3F]" />
                    Elastic band and bottom closure: 6 months
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EEBC3F]" />
                    Fabric integrity: 6 months
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EEBC3F]" />
                    Print quality: 6 months (against fading or peeling)
                  </li>
                </ul>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5">
                <h3 className="font-bold text-[#0F1A26] mb-4 text-lg">Passport Wallets</h3>
                <ul className="space-y-2 text-[#0F1A26]/70">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EEBC3F]" />
                    Leather and stitching: 6 months
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EEBC3F]" />
                    RFID blocking function: 6 months
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EEBC3F]" />
                    Zippers and hardware: 6 months
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* How to Claim */}
          <section className={`mb-16 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#EEBC3F]" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-bold text-[#0F1A26]">How to Make a Warranty Claim</h2>
            </div>
            <div className="bg-gradient-to-br from-[#0F1A26] to-[#1a2a3a] rounded-3xl p-8">
              <div className="space-y-6">
                {claimSteps.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#EEBC3F]/20 flex items-center justify-center">
                      <span className="text-[#EEBC3F] font-bold text-lg">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white mb-1">{step.title}</h3>
                      <p className="text-white/70">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Important Notes */}
          <section className={`mb-16 transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-white rounded-3xl p-8 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-[#EEBC3F]" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-bold text-[#0F1A26]">Important Notes</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-[#EEBC3F]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F1A26] mb-1">Warranty Period</h3>
                    <p className="text-[#0F1A26]/60 text-sm">Warranty claims must be made within 6 months of purchase date. Keep your order confirmation as proof of purchase.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-[#EEBC3F]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F1A26] mb-1">Airline Damage</h3>
                    <p className="text-[#0F1A26]/60 text-sm">Our warranty does not cover damage caused by airline baggage handling. For such damage, please contact the airline directly.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className={`transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-gradient-to-br from-[#EEBC3F]/20 via-[#F8F6F3] to-white rounded-3xl p-8 md:p-10 border border-[#EEBC3F]/20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#EEBC3F] flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-[#0F1A26]" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-bold text-[#0F1A26] mb-3">Need to Make a Claim?</h2>
              <p className="text-[#0F1A26]/70 mb-6 max-w-lg mx-auto">
                Have a warranty question or need to make a claim? Our support team is here to help.
              </p>
              <Link 
                href="/contact" 
                className="inline-flex items-center gap-2 bg-[#0F1A26] text-white px-8 py-4 rounded-full font-semibold hover:bg-[#EEBC3F] hover:text-[#0F1A26] transition-all duration-300"
              >
                Contact Support
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
