"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, MessageCircle, Send, Check, Clock, ArrowRight, Sparkles } from "lucide-react";

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F1EBE3] flex items-center justify-center">
      <div className="text-center">
        <Mail className="w-12 h-12 text-[#EEBC3F] mx-auto mb-4 animate-pulse" />
        <p className="text-[#0F1A26]/60">Loading...</p>
      </div>
    </div>}>
      <ContactContent />
    </Suspense>
  );
}

function ContactContent() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    orderNumber: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F1EBE3]">
        {/* Hero - Premium */}
        <div className="bg-[#0F1A26] pt-32 pb-20 md:pt-44 md:pb-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase mb-6 block">
              Support
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 tracking-tight">
              Contact <span className="text-[#EEBC3F]">Us</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/50 max-w-3xl mx-auto font-light leading-relaxed">
              We're here to help. Reach out through any channel below and we'll get back to you within 24 hours.
            </p>
          </div>
        </div>

        <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Contact Info Sidebar */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Cards */}
              <div className={`bg-white rounded-3xl p-8 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.2em] uppercase">Contact</span>
                <h2 className="text-2xl font-bold text-[#0F1A26] mt-3 mb-8 tracking-tight">Get in Touch</h2>
                
                <div className="space-y-6">
                  <a href="mailto:info@natonat.com" className="flex items-start gap-4 group">
                    <div className="w-14 h-14 rounded-2xl bg-[#EEBC3F]/10 flex items-center justify-center group-hover:bg-[#EEBC3F] transition-all duration-300">
                      <Mail className="w-6 h-6 text-[#EEBC3F] group-hover:text-[#0F1A26] transition-colors" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0F1A26]">Email</p>
                      <p className="text-[#0F1A26]/60 mt-1">info@natonat.com</p>
                    </div>
                  </a>

                  <a href="https://wa.me/201000000061" target="_blank" className="flex items-start gap-4 group">
                    <div className="w-14 h-14 rounded-2xl bg-[#EEBC3F]/10 flex items-center justify-center group-hover:bg-[#EEBC3F] transition-all duration-300">
                      <MessageCircle className="w-6 h-6 text-[#EEBC3F] group-hover:text-[#0F1A26] transition-colors" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0F1A26]">WhatsApp</p>
                      <p className="text-[#0F1A26]/60 mt-1">+20 100 000 0061</p>
                    </div>
                  </a>

                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#F8F6F3] flex items-center justify-center">
                      <Phone className="w-6 h-6 text-[#0F1A26]/40" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0F1A26]">Phone</p>
                      <p className="text-[#0F1A26]/60 mt-1">+20 100 000 0061</p>
                      <div className="flex items-center gap-1 text-[#EEBC3F] text-xs mt-2">
                        <Clock className="w-3 h-3" />
                        Sun-Thu, 9am-5pm EET
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#F8F6F3] flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-[#0F1A26]/40" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0F1A26]">Location</p>
                      <p className="text-[#0F1A26]/60 mt-1">Cairo, Egypt</p>
                      <p className="text-[#0F1A26]/40 text-xs mt-2">Online-first brand</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className={`bg-gradient-to-br from-[#0F1A26] to-[#1a2a3a] rounded-3xl p-8 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.2em] uppercase">Help</span>
                <h2 className="text-xl font-bold text-white mt-3 mb-6 tracking-tight">Quick Links</h2>
                <ul className="space-y-4">
                  {[
                    { href: "/faqs", label: "Frequently Asked Questions" },
                    { href: "/how-it-works", label: "How to Choose Your Size" },
                    { href: "/legal/shipping", label: "Shipping Information" },
                    { href: "/legal/warranty", label: "Returns & Exchanges" },
                  ].map((link, index) => (
                    <li key={index}>
                      <Link 
                        href={link.href} 
                        className="text-white/60 hover:text-[#EEBC3F] transition-colors flex items-center gap-3 group"
                      >
                        <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className={`bg-white rounded-3xl p-8 md:p-12 border border-[#0F1A26]/5 shadow-xl shadow-[#0F1A26]/5 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-[#EEBC3F]/10 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-[#EEBC3F]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.2em] uppercase">Message</span>
                    <h2 className="text-2xl font-bold text-[#0F1A26] tracking-tight">Send us a Message</h2>
                  </div>
                </div>
                <p className="text-[#0F1A26]/50 mb-8">Fill out the form below and we'll get back to you within 24 hours.</p>

                {submitted ? (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 rounded-full bg-[#EEBC3F]/10 flex items-center justify-center mx-auto mb-6 animate-bounce">
                      <Check className="w-12 h-12 text-[#EEBC3F]" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-bold text-[#0F1A26] mb-3 tracking-tight">Message Sent!</h3>
                    <p className="text-[#0F1A26]/50">We'll get back to you as soon as possible.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-[#0F1A26] mb-3 tracking-[0.1em] uppercase">Name *</label>
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('name')}
                          onBlur={() => setFocusedField(null)}
                          className={`w-full px-5 py-4 rounded-2xl border-2 outline-none transition-all bg-white text-[#0F1A26] placeholder:text-[#0F1A26]/30 ${
                            focusedField === 'name' ? 'border-[#EEBC3F]' : 'border-[#0F1A26]/10'
                          }`}
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0F1A26] mb-3 tracking-[0.1em] uppercase">Email *</label>
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField(null)}
                          className={`w-full px-5 py-4 rounded-2xl border-2 outline-none transition-all bg-white text-[#0F1A26] placeholder:text-[#0F1A26]/30 ${
                            focusedField === 'email' ? 'border-[#EEBC3F]' : 'border-[#0F1A26]/10'
                          }`}
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-[#0F1A26] mb-3 tracking-[0.1em] uppercase">Order Number (optional)</label>
                        <input
                          type="text"
                          name="orderNumber"
                          value={formData.orderNumber}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('orderNumber')}
                          onBlur={() => setFocusedField(null)}
                          className={`w-full px-5 py-4 rounded-2xl border-2 outline-none transition-all bg-white text-[#0F1A26] placeholder:text-[#0F1A26]/30 ${
                            focusedField === 'orderNumber' ? 'border-[#EEBC3F]' : 'border-[#0F1A26]/10'
                          }`}
                          placeholder="e.g. NAT-12345"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0F1A26] mb-3 tracking-[0.1em] uppercase">Subject *</label>
                        <select
                          name="subject"
                          required
                          value={formData.subject}
                          onChange={handleChange}
                          className="w-full px-5 py-4 rounded-2xl border-2 border-[#0F1A26]/10 focus:border-[#EEBC3F] outline-none transition-all bg-white text-[#0F1A26]"
                        >
                          <option value="">Select a subject</option>
                          <option value="order">Order Inquiry</option>
                          <option value="product">Product Question</option>
                          <option value="size">Size Help</option>
                          <option value="return">Return/Exchange</option>
                          <option value="wholesale">Wholesale/B2B</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0F1A26] mb-3 tracking-[0.1em] uppercase">Message *</label>
                      <textarea
                        name="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('message')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full px-5 py-4 rounded-2xl border-2 outline-none transition-all resize-none bg-white text-[#0F1A26] placeholder:text-[#0F1A26]/30 ${
                          focusedField === 'message' ? 'border-[#EEBC3F]' : 'border-[#0F1A26]/10'
                        }`}
                        placeholder="How can we help you?"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-[#0F1A26] text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26] h-14 rounded-2xl font-semibold text-lg transition-all duration-300"
                    >
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
