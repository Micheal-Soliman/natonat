"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Instagram, Facebook, MessageCircle, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    shop: [
      { label: t('links.shop.luggageCovers'), href: "/shop?category=luggage-covers" },
      { label: t('links.shop.passportWallets'), href: "/shop?category=passport-wallets" },
      { label: t('links.shop.packOnat'), href: "/shop?category=packonat" },
      { label: t('links.shop.allProducts'), href: "/shop" },
    ],
    company: [
      { label: t('links.company.about'), href: "/about" },
      { label: t('links.company.sizeGuide'), href: "/how-it-works" },
      { label: t('links.company.faqs'), href: "/faqs" },
      { label: t('links.company.contact'), href: "/contact" },
    ],
    legal: [
      { label: t('links.legal.privacy'), href: "/legal/privacy" },
      { label: t('links.legal.terms'), href: "/legal/terms" },
      { label: t('links.legal.shipping'), href: "/legal/shipping" },
      { label: t('links.legal.warranty'), href: "/legal/warranty" },
      { label: t('links.legal.promise'), href: "/promise" },
    ],
  };

  return (
    <footer className="bg-[#0F1A26] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer - Desktop: 1 row, Mobile: stacked */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block">
              <Image
                src="/logo-after.png"
                alt="natOnat"
                width={120}
                height={32}
                className="h-6 sm:h-8 w-auto object-contain"
              />
            </Link>
            <p className="text-white/60 mt-3 sm:mt-4 mb-4 sm:mb-6 max-w-sm text-xs sm:text-sm">
              {t('tagline')}
            </p>
            {/* Contact info */}
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <a
                href="mailto:info@natonat.com"
                className="flex items-center gap-2 text-white/60 hover:text-[#EEBC3F] transition-colors text-xs sm:text-sm"
              >
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{t('contact.email')}</span>
              </a>
              <a
                href={`tel:${t('contact.phone').replace(/\s/g, '')}`}
                className="flex items-center gap-2 text-white/60 hover:text-[#EEBC3F] transition-colors text-xs sm:text-sm"
              >
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span dir="ltr">{t('contact.phone')}</span>
              </a>
              <div className="flex items-center gap-2 text-white/60 text-xs sm:text-sm">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{t('contact.location')}</span>
              </div>
            </div>
          </div>

          {/* Shop links */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-white uppercase tracking-wider mb-3 sm:mb-4">
              {t('links.shop.title')}
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-[#EEBC3F] text-xs sm:text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-white uppercase tracking-wider mb-3 sm:mb-4">
              {t('links.company.title')}
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-[#EEBC3F] text-xs sm:text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-white uppercase tracking-wider mb-3 sm:mb-4">
              {t('links.legal.title')}
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-[#EEBC3F] text-xs sm:text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-white/40 text-xs sm:text-sm text-center sm:text-left">
            {t('copyright', { year: currentYear })}
          </p>

          {/* Social icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-white/40 text-xs sm:text-sm hidden sm:inline">{t('social.follow')}</span>
            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href={t('social.instagramUrl')}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-[#EEBC3F] hover:text-[#0F1A26] transition-all"
              >
                <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a
                href={t('social.facebookUrl')}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-[#EEBC3F] hover:text-[#0F1A26] transition-all"
              >
                <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a
                href={t('social.tiktokUrl')}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-[#EEBC3F] hover:text-[#0F1A26] transition-all"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/@natOnatofficial"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-[#EEBC3F] hover:text-[#0F1A26] transition-all"
              >
                <Youtube className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a
                href={t('social.whatsappUrl')}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-[#EEBC3F] hover:text-[#0F1A26] transition-all"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
