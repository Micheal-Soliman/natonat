"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { ChevronRight, FileText, ShoppingBag, CreditCard, Truck, RotateCcw, Copyright, User, Scale, Gavel, RefreshCw, Mail } from "lucide-react";
import { Loading } from "@/app/components/loading";

export default function TermsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <TermsContent />
    </Suspense>
  );
}

function TermsContent() {
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

  const terms = [
    {
      icon: FileText,
      title: "Agreement to Terms",
      content: "By accessing or using the natOnat website and purchasing our products, you agree to be bound by these Terms & Conditions. If you disagree with any part of these terms, you may not access our website or purchase our products."
    },
    {
      icon: ShoppingBag,
      title: "Products and Pricing",
      content: "All products are subject to availability. We reserve the right to discontinue any product at any time. Prices are subject to change without notice. All prices are listed in Egyptian Pounds (EGP) and include applicable taxes unless otherwise stated."
    },
    {
      icon: CreditCard,
      title: "Orders and Payment",
      content: "By placing an order, you warrant that you are legally capable of entering into binding contracts. We reserve the right to refuse or cancel orders at our discretion. Payment must be received in full before products are shipped."
    },
    {
      icon: Truck,
      title: "Shipping and Delivery",
      content: "Delivery times are estimates and not guaranteed. We are not responsible for delays caused by shipping carriers, customs, or other circumstances beyond our control. Risk of loss and title for items pass to you upon delivery."
    },
    {
      icon: RotateCcw,
      title: "Returns and Refunds",
      content: "Returns are accepted within 30 days of purchase for unused items in original packaging. Refunds will be processed within 5-7 business days after we receive the returned item. Shipping costs for returns are the customer's responsibility unless the item was defective."
    },
    {
      icon: Copyright,
      title: "Intellectual Property",
      content: "All content on this website, including text, graphics, logos, images, and software, is the property of natOnat and protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express permission."
    },
    {
      icon: User,
      title: "User Accounts",
      content: "When you create an account, you must provide accurate and complete information. You are responsible for maintaining the confidentiality of your account password and for all activities that occur under your account."
    },
    {
      icon: Scale,
      title: "Limitation of Liability",
      content: "natOnat shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our products or website. Our total liability shall not exceed the amount you paid for the product giving rise to the liability."
    },
    {
      icon: Gavel,
      title: "Governing Law",
      content: "These terms shall be governed by and construed in accordance with the laws of the Arab Republic of Egypt. Any disputes shall be resolved in the courts of Cairo, Egypt."
    },
    {
      icon: RefreshCw,
      title: "Changes to Terms",
      content: "We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the website. Your continued use of the website after changes constitutes acceptance of the new terms."
    },
  ];

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F1EBE3]">
        {/* Hero - Premium */}
        <div className="bg-[#0F1A26] pt-32 pb-20 md:pt-44 md:pb-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase mb-6 block">
              Legal
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 tracking-tight">
              Terms & <span className="text-[#EEBC3F]">Conditions</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/50 max-w-3xl mx-auto font-light leading-relaxed">
              The rules and guidelines for using our website and services
            </p>
          </div>
        </div>

        <div ref={ref} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Last Updated */}
          <div className={`flex items-center gap-4 mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="w-12 h-12 rounded-2xl bg-[#EEBC3F]/10 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-[#EEBC3F]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm text-[#0F1A26]/50">Last Updated</p>
              <p className="text-lg font-semibold text-[#0F1A26]">March 2024</p>
            </div>
          </div>

          {/* Terms Sections */}
          <div className="space-y-6">
            {terms.map((term, index) => {
              const Icon = term.icon;
              return (
                <section 
                  key={index}
                  className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <div className="bg-white rounded-3xl p-8 md:p-10 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5 hover:shadow-xl transition-shadow">
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-[#EEBC3F]/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-7 h-7 text-[#EEBC3F]" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-3 mb-3">
                          <span className="text-sm font-bold text-[#EEBC3F]">{String(index + 1).padStart(2, '0')}</span>
                          <h2 className="text-xl font-bold text-[#0F1A26]">{term.title}</h2>
                        </div>
                        <p className="text-[#0F1A26]/70 leading-relaxed text-lg">{term.content}</p>
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>

          {/* Contact */}
          <section className={`mt-16 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-gradient-to-br from-[#EEBC3F]/20 via-[#F8F6F3] to-white rounded-3xl p-8 md:p-10 border border-[#EEBC3F]/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#EEBC3F] flex items-center justify-center">
                  <Mail className="w-6 h-6 text-[#0F1A26]" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-bold text-[#0F1A26]">Questions?</h2>
              </div>
              <p className="text-[#0F1A26]/70 mb-6 text-lg">
                If you have any questions about these Terms & Conditions, please contact us:
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="mailto:info@natonat.com" 
                  className="inline-flex items-center gap-3 px-6 py-4 bg-white rounded-2xl border border-[#0F1A26]/10 hover:border-[#EEBC3F] transition-colors"
                >
                  <Mail className="w-5 h-5 text-[#EEBC3F]" />
                  <span className="font-medium text-[#0F1A26]">info@natonat.com</span>
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
