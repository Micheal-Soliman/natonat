"use client";

import React, { useState } from "react";
import { MessageCircle, Phone, X, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from 'next-intl';

export function FloatingContact() {
  const t = useTranslations('components.floatingContact');
  const [isOpen, setIsOpen] = useState(false);

  const contacts = [
    {
      id: "whatsapp",
      label: "واتساب",
      icon: MessageCircle,
      href: "https://wa.me/201070004227",
      color: "bg-[#0F1A26]",
      hoverColor: "hover:bg-[#1a2938]",
    },
    {
      id: "phone",
      label: "اتصل بنا",
      icon: Phone,
      href: "tel:+201070004227",
      color: "bg-[#EEBC3F]",
      hoverColor: "hover:bg-[#d4a636]",
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Contacts Container - allows flex layout without affecting button position */}
      <div className="flex flex-col items-end gap-3 mb-3">
        <AnimatePresence>
          {isOpen && (
            <>
              {contacts.map((contact, index) => (
                <motion.a
                  key={contact.id}
                  href={contact.href}
                  target={contact.id === "whatsapp" ? "_blank" : undefined}
                  rel={contact.id === "whatsapp" ? "noopener noreferrer" : undefined}
                  aria-label={contact.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15, delay: index * 0.06 }}
                  className="relative flex items-center justify-end group cursor-pointer"
                >
                  <span className="pointer-events-none absolute right-full mr-3 hidden rounded-lg bg-white px-3 py-1.5 shadow-lg text-sm font-medium text-[#0F1A26] transition-all duration-200 group-hover:block whitespace-nowrap">
                    {contact.label}
                  </span>
                  <div
                    className={`w-12 h-12 rounded-full ${contact.color} ${contact.hoverColor} flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110`}
                  >
                    <contact.icon className="w-5 h-5 text-white" />
                  </div>
                </motion.a>
              ))}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Main Toggle Button - Fixed position, never moves */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 rounded-full bg-[#0F1A26] flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1"
            >
              <ChevronUp className="w-5 h-5 text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse Animation */}
        {!isOpen && (
          <>
            <span className="absolute inset-0 rounded-full bg-[#EEBC3F] animate-ping opacity-20" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
          </>
        )}
      </motion.button>

      {/* Label - Positioned absolutely, doesn't affect button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-16 right-0 bg-white px-4 py-2 rounded-lg shadow-lg whitespace-nowrap"
          >
            <p className="text-sm font-medium text-[#0F1A26]">{t('label')}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
