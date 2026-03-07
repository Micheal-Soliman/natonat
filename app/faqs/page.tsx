"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, HelpCircle, MessageCircle, ArrowUpRight, Search, Sparkles, Shield, Package, Truck, RotateCcw } from "lucide-react";

const categories = [
  { id: "all", label: "All Questions", icon: Sparkles },
  { id: "covers", label: "Luggage Covers", icon: Shield },
  { id: "wallets", label: "Passport Wallets", icon: Package },
  { id: "orders", label: "Orders & Shipping", icon: Truck },
  { id: "returns", label: "Returns & Warranty", icon: RotateCcw },
];

const faqs = [
  // Luggage Covers
  {
    category: "covers",
    question: "How do I choose the right size cover?",
    answer: "Simply measure your suitcase height from the floor to the top (excluding wheels). S = 18-21 inches, M = 22-25 inches, L = 26-29 inches, XL = 30-32 inches. Our stretchy fabric accommodates different widths and depths.",
  },
  {
    category: "covers",
    question: "Will the cover fit hard-shell and soft-shell suitcases?",
    answer: "Yes! Our covers are designed with stretchy spandex fabric that adapts to both hard-shell and soft-shell luggage. The elastic bottom ensures a snug fit on any suitcase type.",
  },
  {
    category: "covers",
    question: "Can I wash the luggage cover?",
    answer: "Yes, all our covers are machine washable at 30°C (86°F). Use a gentle cycle with similar colors. Do not tumble dry, iron, or bleach. Air dry for best results.",
  },
  {
    category: "covers",
    question: "Will airport security ask me to remove the cover?",
    answer: "In most cases, no. The cover is thin and doesn't obstruct X-ray scanning. However, security officers reserve the right to ask for removal if they need to inspect the contents more closely.",
  },
  {
    category: "covers",
    question: "Do I still have access to handles and wheels?",
    answer: "Absolutely! Our covers are designed with openings for top and side handles, and the wheels remain completely free so you can roll your suitcase normally.",
  },
  // Passport Wallets
  {
    category: "wallets",
    question: "What is RFID protection?",
    answer: "RFID (Radio-Frequency Identification) protection blocks unauthorized wireless scanning of your cards and passport. This prevents electronic pickpocketing in crowded places like airports and tourist areas.",
  },
  {
    category: "wallets",
    question: "How many cards can the wallet hold?",
    answer: "Depending on the model, our wallets hold between 3-6 credit cards, plus your passport, boarding passes, cash, and even a SIM card. Check individual product descriptions for exact capacity.",
  },
  {
    category: "wallets",
    question: "Is the leather genuine?",
    answer: "Yes, all our passport wallets use full-grain genuine leather that develops a beautiful patina over time. We source high-quality leather that is both durable and elegant.",
  },
  {
    category: "wallets",
    question: "Will the wallet fit in my pocket?",
    answer: "Our wallets are designed to be compact yet functional. They fit comfortably in most jacket pockets, handbags, and carry-on bags while holding all your essential travel documents.",
  },
  // Orders & Shipping
  {
    category: "orders",
    question: "Where do you ship to?",
    answer: "We ship across Egypt and to most countries in the Middle East. For international orders outside our primary regions, please contact us for shipping options.",
  },
  {
    category: "orders",
    question: "How long does shipping take?",
    answer: "Egypt: 2-4 business days. GCC countries: 5-7 business days. International: 7-14 business days depending on destination. Express shipping available at checkout.",
  },
  {
    category: "orders",
    question: "How can I track my order?",
    answer: "Once your order ships, you'll receive an email with a tracking number. You can also track your order through your account on our website or contact us for assistance.",
  },
  {
    category: "orders",
    question: "Do you offer free shipping?",
    answer: "Yes! We offer free standard shipping on all orders over EGP 500 within Egypt. For orders below this amount, shipping fees are calculated at checkout based on your location.",
  },
  // Returns & Warranty
  {
    category: "returns",
    question: "What is your return policy?",
    answer: "We offer a 30-day return policy for unused items in original packaging. If you're not satisfied with your purchase, contact us to initiate a return. Refunds are processed within 5-7 business days after we receive the item.",
  },
  {
    category: "returns",
    question: "Do you offer exchanges?",
    answer: "Yes, we offer free size exchanges within 30 days. If your cover doesn't fit, contact us and we'll send you the correct size with free return shipping for the original item.",
  },
  {
    category: "returns",
    question: "What does the warranty cover?",
    answer: "All natOnat products come with a 6-month warranty against manufacturing defects. This covers stitching, elastic, zippers, and material defects. Normal wear and tear is not covered.",
  },
  {
    category: "returns",
    question: "What if my item arrives damaged?",
    answer: "If your item arrives damaged, please contact us within 48 hours with photos of the damage. We'll arrange a free replacement or full refund, including return shipping costs.",
  },
];

export default function FAQsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F1EBE3] flex items-center justify-center">
      <div className="text-center">
        <HelpCircle className="w-12 h-12 text-[#EEBC3F] mx-auto mb-4 animate-pulse" />
        <p className="text-[#0F1A26]/60">Loading...</p>
      </div>
    </div>}>
      <FAQsContent />
    </Suspense>
  );
}

function FAQsContent() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [openItems, setOpenItems] = useState<number[]>([]);
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

  const filteredFaqs = activeCategory === "all"
    ? faqs
    : faqs.filter((faq) => faq.category === activeCategory);

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F1EBE3]">
        {/* Hero - Premium */}
        <div className="bg-[#0F1A26] pt-32 pb-20 md:pt-44 md:pb-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase mb-6 block">
              Help Center
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 tracking-tight">
              <span className="text-[#EEBC3F]">FA</span>Qs
            </h1>
            <p className="text-xl md:text-2xl text-white/50 max-w-3xl mx-auto font-light leading-relaxed">
              Find answers to common questions about our products and services
            </p>
          </div>
        </div>

        <div ref={ref} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Category Filter - Card Style */}
          <div className={`grid grid-cols-2 md:grid-cols-5 gap-3 mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {categories.map((cat, index) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`p-5 rounded-2xl text-center transition-all duration-300 group ${
                    activeCategory === cat.id
                      ? "bg-[#0F1A26] text-white shadow-xl shadow-[#0F1A26]/20"
                      : "bg-white text-[#0F1A26] hover:bg-[#EEBC3F]/10 border border-[#0F1A26]/5"
                  }`}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 transition-colors ${activeCategory === cat.id ? 'text-[#EEBC3F]' : 'text-[#0F1A26]/40 group-hover:text-[#EEBC3F]'}`} strokeWidth={1.5} />
                  <span className="text-sm font-medium">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* FAQ Accordion - Premium Style */}
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className={`bg-white rounded-3xl border border-[#0F1A26]/5 overflow-hidden transition-all duration-500 hover:shadow-lg hover:shadow-[#0F1A26]/5 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${index * 75}ms` }}
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full flex items-center justify-between p-6 md:p-8 text-left group"
                >
                  <span className="font-semibold text-lg text-[#0F1A26] pr-4 tracking-tight group-hover:text-[#EEBC3F] transition-colors duration-300">{faq.question}</span>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${openItems.includes(index) ? 'bg-[#EEBC3F]' : 'bg-[#F8F6F3] group-hover:bg-[#EEBC3F]/10'}`}>
                    {openItems.includes(index) ? (
                      <ChevronUp className={`w-5 h-5 ${openItems.includes(index) ? 'text-[#0F1A26]' : 'text-[#EEBC3F]'}`} />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#0F1A26]/40 group-hover:text-[#EEBC3F]" />
                    )}
                  </div>
                </button>
                {openItems.includes(index) && (
                  <div className="px-6 md:px-8 pb-6 md:pb-8 animate-in slide-in-from-top-2 duration-200">
                    <div className="pt-4 border-t border-[#0F1A26]/5">
                      <p className="text-[#0F1A26]/60 leading-relaxed text-lg">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-[#F8F6F3] flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-[#0F1A26]/30" strokeWidth={1.5} />
              </div>
              <p className="text-[#0F1A26]/50 text-xl">No questions found in this category.</p>
              <button 
                onClick={() => setActiveCategory("all")}
                className="mt-4 text-[#EEBC3F] font-medium hover:underline"
              >
                View all questions
              </button>
            </div>
          )}

          {/* Contact CTA - Premium Card */}
          <div className={`mt-20 bg-gradient-to-br from-[#0F1A26] via-[#1a2a3a] to-[#0F1A26] rounded-3xl p-10 md:p-16 text-center border border-white/5 shadow-2xl transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="w-20 h-20 rounded-2xl bg-[#EEBC3F]/10 flex items-center justify-center mx-auto mb-8">
              <HelpCircle className="w-10 h-10 text-[#EEBC3F]" strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Still have questions?</h2>
            <p className="text-white/50 mb-10 max-w-lg mx-auto text-lg font-light">Can't find the answer you're looking for? Reach out to our team and we'll help you out.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-[#EEBC3F] text-[#0F1A26] hover:bg-white rounded-full px-10 h-14 font-semibold text-lg transition-all duration-300">
                <Link href="/contact" className="inline-flex items-center gap-2">
                  Contact Support
                  <ArrowUpRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-full px-10 h-14 font-medium text-lg transition-all duration-300">
                <Link href="https://wa.me/201000000061" target="_blank" className="inline-flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
