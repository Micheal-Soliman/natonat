"use client";

import Link from "next/link";
import { Instagram, Facebook, MessageCircle, Mail, MapPin, Phone } from "lucide-react";

const footerLinks = {
  shop: [
    { label: "Luggage Covers", href: "/shop?category=luggage-covers" },
    { label: "Passport Wallets", href: "/shop?category=passport-wallets" },
    { label: "Travel Sets", href: "/shop?category=travel-sets" },
    { label: "All Products", href: "/shop" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Size Guide", href: "/how-it-works" },
    { label: "FAQs", href: "/faqs" },
    { label: "Contact", href: "/contact" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Terms & Conditions", href: "/legal/terms" },
    { label: "Shipping & Returns", href: "/legal/shipping" },
    { label: "Warranty", href: "/legal/warranty" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#0F1A26] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer - Desktop: 1 row, Mobile: stacked */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="lg:w-1/4">
            <Link href="/" className="inline-block">
              <img 
                src="/logo-after.png" 
                alt="natOnat" 
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="text-white/60 mt-4 mb-6 max-w-sm text-sm">
              Pack smart, travel easy. Premium travel accessories that protect your gear and make it stand out.
            </p>
            {/* Contact info */}
            <div className="flex flex-col gap-2">
              <a
                href="mailto:info@natonat.com"
                className="flex items-center gap-2 text-white/60 hover:text-[#EEBC3F] transition-colors text-sm"
              >
                <Mail className="w-4 h-4" />
                <span>info@natonat.com</span>
              </a>
              <a
                href="tel:+201000000061"
                className="flex items-center gap-2 text-white/60 hover:text-[#EEBC3F] transition-colors text-sm"
              >
                <Phone className="w-4 h-4" />
                <span>+20 100 000 0061</span>
              </a>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <MapPin className="w-4 h-4" />
                <span>Cairo, Egypt</span>
              </div>
            </div>
          </div>

          {/* Shop links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Shop
            </h3>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-[#EEBC3F] text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-[#EEBC3F] text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-[#EEBC3F] text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} natOnat. All rights reserved.
          </p>
          
          {/* Social icons */}
          <div className="flex items-center gap-4">
            <span className="text-white/40 text-sm">Follow us</span>
            <div className="flex items-center gap-3">
              <a
                href="https://instagram.com/natonat"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-[#EEBC3F] hover:text-[#0F1A26] transition-all"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com/natonat"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-[#EEBC3F] hover:text-[#0F1A26] transition-all"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://tiktok.com/@natonat"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-[#EEBC3F] hover:text-[#0F1A26] transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a
                href="https://wa.me/201000000061"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-[#EEBC3F] hover:text-[#0F1A26] transition-all"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
