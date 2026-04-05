"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, MessageCircle, Send, Check, Clock, ArrowRight, Sparkles, Instagram, Facebook } from "lucide-react";
import { Loading } from "@/app/components/loading";

export default function ContactPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ContactContent />
    </Suspense>
  );
}

function ContactContent() {
  const t = useTranslations('contact');
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
        <div className="bg-[#0F1A26] pt-28 pb-16 md:pt-44 md:pb-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase mb-4 md:mb-6 block">
              {t('hero.label')}
            </span>
            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 md:mb-8 tracking-tight">
              {t('hero.title').split(' ')[0]} <span className="text-[#EEBC3F]">{t('hero.title').split(' ').slice(1).join(' ')}</span>
            </h1>
            <p className="text-lg md:text-xl md:text-2xl text-white/50 max-w-3xl mx-auto font-light leading-relaxed">
              {t('hero.subtitle')}
            </p>
          </div>
        </div>

        <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Contact Info Sidebar */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Cards */}
              <div className={`bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.2em] uppercase">{t('info.label')}</span>
                <h2 className="text-2xl font-bold text-[#0F1A26] mt-3 mb-8 tracking-tight">{t('info.title')}</h2>
                
                <div className="space-y-4 md:space-y-6">
                  <a href="mailto:info@natonat.com" className="flex items-start gap-3 md:gap-4 group">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-[#EEBC3F]/10 flex items-center justify-center group-hover:bg-[#EEBC3F] transition-all duration-300">
                      <Mail className="w-5 h-5 md:w-6 md:h-6 text-[#EEBC3F] group-hover:text-[#0F1A26] transition-colors" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0F1A26]">{t('info.email')}</p>
                      <p className="text-[#0F1A26]/60 mt-1">info@natonat.com</p>
                    </div>
                  </a>

                  <a href="https://wa.me/201070004227" target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 md:gap-4 group">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-[#EEBC3F]/10 flex items-center justify-center group-hover:bg-[#EEBC3F] transition-all duration-300">
                      <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-[#EEBC3F] group-hover:text-[#0F1A26] transition-colors" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0F1A26]">{t('info.whatsapp')}</p>
                      <p className="text-[#0F1A26]/60 mt-1" dir="ltr">+20 10 70004227</p>
                    </div>
                  </a>

                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-[#F8F6F3] flex items-center justify-center">
                      <Phone className="w-5 h-5 md:w-6 md:h-6 text-[#0F1A26]/40" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0F1A26]">{t('info.phone')}</p>
                      <p className="text-[#0F1A26]/60 mt-1" dir="ltr">+20 10 70004227</p>
                      <div className="flex items-center gap-1 text-[#EEBC3F] text-xs mt-2">
                        <Clock className="w-3 h-3" />
                        {t('info.hours')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-[#F8F6F3] flex items-center justify-center">
                      <MapPin className="w-5 h-5 md:w-6 md:h-6 text-[#0F1A26]/40" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0F1A26]">{t('info.location')}</p>
                      <p className="text-[#0F1A26]/60 mt-1">{t('info.address')}</p>
                      <p className="text-[#0F1A26]/40 text-xs mt-2">{t('info.onlineFirst')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className={`bg-gradient-to-br from-[#0F1A26] to-[#1a2a3a] rounded-2xl md:rounded-3xl p-6 md:p-8 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.2em] uppercase">{t('help.label')}</span>
                <h2 className="text-xl font-bold text-white mt-3 mb-6 tracking-tight">{t('help.title')}</h2>
                <ul className="space-y-4">
                  {[
                    { href: "/faqs", label: t('help.faq') },
                    { href: "/how-it-works", label: t('help.sizeGuide') },
                    { href: "/legal/shipping", label: t('help.shipping') },
                    { href: "/legal/warranty", label: t('help.returns') },
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

              {/* Social Media Links */}
              <div className={`bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-[#0F1A26]/5 shadow-lg shadow-[#0F1A26]/5 transition-all duration-700 delay-150 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.2em] uppercase">{t('social.label')}</span>
                <h2 className="text-2xl font-bold text-[#0F1A26] mt-3 mb-8 tracking-tight">{t('social.title')}</h2>
                
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                  <a 
                    href="https://www.facebook.com/natOnatofficial" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl bg-[#1877F2]/10 hover:bg-[#1877F2] group transition-all duration-300"
                  >
                    <Facebook className="w-6 h-6 md:w-8 md:h-8 text-[#1877F2] group-hover:text-white transition-colors" strokeWidth={1.5} />
                    <span className="text-xs md:text-sm font-medium text-[#0F1A26]/70 group-hover:text-white transition-colors">{t('social.facebook')}</span>
                  </a>
                  
                  <a 
                    href="https://www.instagram.com/natonatofficial/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#833AB4]/10 via-[#E1306C]/10 to-[#F77737]/10 hover:from-[#833AB4] hover:via-[#E1306C] hover:to-[#F77737] group transition-all duration-300"
                  >
                    <Instagram className="w-6 h-6 md:w-8 md:h-8 text-[#E1306C] group-hover:text-white transition-colors" strokeWidth={1.5} />
                    <span className="text-xs md:text-sm font-medium text-[#0F1A26]/70 group-hover:text-white transition-colors">{t('social.instagram')}</span>
                  </a>
                  
                  <a 
                    href="https://www.tiktok.com/@natonatofficial" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl bg-black/5 hover:bg-black group transition-all duration-300"
                  >
                    <svg className="w-6 h-6 md:w-8 md:h-8 text-[#0F1A26] group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    <span className="text-xs md:text-sm font-medium text-[#0F1A26]/70 group-hover:text-white transition-colors">{t('social.tiktok')}</span>
                  </a>
                </div>
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
                    <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.2em] uppercase">{t('form.label')}</span>
                    <h2 className="text-2xl font-bold text-[#0F1A26] tracking-tight">{t('form.title')}</h2>
                  </div>
                </div>
                <p className="text-[#0F1A26]/50 mb-8">{t('form.subtitle')}</p>

                {submitted ? (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 rounded-full bg-[#EEBC3F]/10 flex items-center justify-center mx-auto mb-6 animate-bounce">
                      <Check className="w-12 h-12 text-[#EEBC3F]" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-bold text-[#0F1A26] mb-3 tracking-tight">{t('form.success.title')}</h3>
                    <p className="text-[#0F1A26]/50">{t('form.success.subtitle')}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-[#0F1A26] mb-3 tracking-[0.1em] uppercase">{t('form.name')} *</label>
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
                          placeholder={t('form.namePlaceholder')}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0F1A26] mb-3 tracking-[0.1em] uppercase">{t('form.email')} *</label>
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
                          placeholder={t('form.emailPlaceholder')}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-[#0F1A26] mb-3 tracking-[0.1em] uppercase">{t('form.orderNumber')}</label>
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
                          placeholder={t('form.orderPlaceholder')}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0F1A26] mb-3 tracking-[0.1em] uppercase">{t('form.subject')} *</label>
                        <select
                          name="subject"
                          required
                          value={formData.subject}
                          onChange={handleChange}
                          className="w-full px-5 py-4 rounded-2xl border-2 border-[#0F1A26]/10 focus:border-[#EEBC3F] outline-none transition-all bg-white text-[#0F1A26]"
                        >
                          <option value="">{t('form.selectSubject')}</option>
                          <option value="order">{t('form.subjects.order')}</option>
                          <option value="product">{t('form.subjects.product')}</option>
                          <option value="size">{t('form.subjects.size')}</option>
                          <option value="return">{t('form.subjects.return')}</option>
                          <option value="wholesale">{t('form.subjects.wholesale')}</option>
                          <option value="other">{t('form.subjects.other')}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0F1A26] mb-3 tracking-[0.1em] uppercase">{t('form.message')} *</label>
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
                        placeholder={t('form.messagePlaceholder')}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-[#0F1A26] text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26] h-14 rounded-2xl font-semibold text-lg transition-all duration-300"
                    >
                      <Send className="w-5 h-5 mr-2" />
                      {t('form.send')}
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
