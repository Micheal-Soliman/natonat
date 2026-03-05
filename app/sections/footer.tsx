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
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <img 
                src="/logo-after.png" 
                alt="natOnat" 
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="text-white/60 mt-4 mb-6 max-w-sm">
              Pack smart, travel easy. Premium travel accessories that protect your gear and make it stand out.
            </p>
            
            {/* Contact info */}
            <div className="space-y-3">
              <a
                href="mailto:info@natonat.com"
                className="flex items-center gap-2 text-white/60 hover:text-[#EEBC3F] transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">info@natonat.com</span>
              </a>
              <a
                href="tel:+201000000061"
                className="flex items-center gap-2 text-white/60 hover:text-[#EEBC3F] transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm">+20 100 000 0061</span>
              </a>
              <div className="flex items-center gap-2 text-white/60">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Cairo, Egypt</span>
              </div>
            </div>
          </div>

          {/* Shop links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Shop
            </h3>
            <ul className="space-y-3">
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
            <ul className="space-y-3">
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
            <ul className="space-y-3">
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
