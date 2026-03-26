"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { ChevronRight, Shield, Lock, Eye, Users, Cookie, FileCheck, Mail, Phone } from "lucide-react";
import { Loading } from "@/app/components/loading";

export default function PrivacyPolicyPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PrivacyContent />
    </Suspense>
  );
}

function PrivacyContent() {
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
              Privacy <span className="text-[#EEBC3F]">Policy</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/50 max-w-3xl mx-auto font-light leading-relaxed">
              How we collect, use, and protect your personal information
            </p>
          </div>
        </div>

        <div ref={ref} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Last Updated */}
          <div className={`flex items-center gap-4 mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="w-12 h-12 rounded-2xl bg-[#EEBC3F]/10 flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-[#EEBC3F]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm text-[#0F1A26]/50">Last Updated</p>
              <p className="text-lg font-semibold text-[#0F1A26]">March 2024</p>
            </div>
          </div>

          {/* Introduction */}
          <section className={`mb-16 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-white rounded-3xl p-8 md:p-10 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[#EEBC3F]" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-bold text-[#0F1A26]">Introduction</h2>
              </div>
              <p className="text-[#0F1A26]/70 leading-relaxed text-lg">
                natOnat respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you visit our website or make a purchase. By using our services, you agree to the practices described in this policy.
              </p>
            </div>
          </section>

          {/* Information We Collect */}
          <section className={`mb-16 transition-all duration-700 delay-150 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-white rounded-3xl p-8 md:p-10 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-[#EEBC3F]" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-bold text-[#0F1A26]">Information We Collect</h2>
              </div>
              <p className="text-[#0F1A26]/70 mb-6 text-lg">We collect the following types of information:</p>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: "Personal Information", desc: "Name, email, phone number, shipping and billing addresses" },
                  { title: "Payment Information", desc: "We don't store credit card details. Payments processed securely through partners." },
                  { title: "Order Information", desc: "Products purchased, order history, and preferences" },
                  { title: "Technical Data", desc: "IP address, browser type, device information, and cookies" },
                ].map((item, index) => (
                  <div key={index} className="bg-[#F8F6F3] rounded-2xl p-5">
                    <h3 className="font-semibold text-[#0F1A26] mb-2">{item.title}</h3>
                    <p className="text-[#0F1A26]/60 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className={`mb-16 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-white rounded-3xl p-8 md:p-10 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-[#EEBC3F]" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-bold text-[#0F1A26]">How We Use Your Information</h2>
              </div>
              <div className="space-y-4">
                {[
                  "Process and fulfill your orders",
                  "Communicate about your order status",
                  "Provide customer support",
                  "Send promotional emails (with your consent)",
                  "Improve our website and products",
                  "Comply with legal obligations",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#EEBC3F]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#EEBC3F] font-bold text-sm">{index + 1}</span>
                    </div>
                    <span className="text-[#0F1A26]/70">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Data Sharing */}
          <section className={`mb-16 transition-all duration-700 delay-250 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-gradient-to-br from-[#0F1A26] to-[#1a2a3a] rounded-3xl p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#EEBC3F]/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#EEBC3F]" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-bold text-white">Data Sharing</h2>
              </div>
              <p className="text-white/60 mb-6 text-lg">
                We do not sell your personal information. We only share your data with:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <h3 className="font-semibold text-white mb-2">Service Providers</h3>
                  <p className="text-white/60 text-sm">Shipping companies, payment processors, and IT services who help us operate our business.</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <h3 className="font-semibold text-white mb-2">Legal Requirements</h3>
                  <p className="text-white/60 text-sm">When required by law or to protect our rights and safety.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section className={`mb-16 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-white rounded-3xl p-8 md:p-10 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-[#EEBC3F]" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-bold text-[#0F1A26]">Your Rights</h2>
              </div>
              <p className="text-[#0F1A26]/70 mb-6 text-lg">You have the right to:</p>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: "Access", desc: "Request a copy of your personal data" },
                  { title: "Correction", desc: "Correct inaccurate or incomplete data" },
                  { title: "Deletion", desc: "Request deletion of your data" },
                  { title: "Opt-out", desc: "Unsubscribe from marketing communications" },
                  { title: "Portability", desc: "Request your data in a portable format" },
                  { title: "Restriction", desc: "Limit how we use your data" },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#EEBC3F] mt-2 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-[#0F1A26]">{item.title}</h3>
                      <p className="text-[#0F1A26]/60 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Cookies & Security */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <section className={`transition-all duration-700 delay-350 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="bg-white rounded-3xl p-8 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center">
                    <Cookie className="w-6 h-6 text-[#EEBC3F]" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-xl font-bold text-[#0F1A26]">Cookies</h2>
                </div>
                <p className="text-[#0F1A26]/70 leading-relaxed">
                  We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookies through your browser settings at any time.
                </p>
              </div>
            </section>

            <section className={`transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="bg-white rounded-3xl p-8 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#EEBC3F]/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-[#EEBC3F]" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-xl font-bold text-[#0F1A26]">Security</h2>
                </div>
                <p className="text-[#0F1A26]/70 leading-relaxed">
                  We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.
                </p>
              </div>
            </section>
          </div>

          {/* Contact */}
          <section className={`transition-all duration-700 delay-450 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-gradient-to-br from-[#EEBC3F]/20 via-[#F8F6F3] to-white rounded-3xl p-8 md:p-10 border border-[#EEBC3F]/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#EEBC3F] flex items-center justify-center">
                  <Mail className="w-6 h-6 text-[#0F1A26]" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-bold text-[#0F1A26]">Contact Us</h2>
              </div>
              <p className="text-[#0F1A26]/70 mb-6 text-lg">
                If you have any questions about this privacy policy or our data practices, please contact us:
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
