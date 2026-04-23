"use client";

import React, { useState } from "react";
import { MessageCircle, Phone, X, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function FloatingContact() {
  const [isOpen, setIsOpen] = useState(false);

  const contacts = [
    {
      id: "whatsapp",
      label: "واتساب",
      icon: MessageCircle,
      href: "https://wa.me/201070004227",
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600",
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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <>
            {contacts.map((contact, index) => (
              <motion.a
                key={contact.id}
                href={contact.href}
                target={contact.id === "whatsapp" ? "_blank" : undefined}
                rel={contact.id === "whatsapp" ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ duration: 0.2, delay: index * 0.1 }}
                className={`flex items-center gap-3 group`}
              >
                <span className="bg-white px-3 py-1.5 rounded-lg shadow-lg text-sm font-medium text-[#0F1A26] opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
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

      {/* Main Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105"
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
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
          </>
        )}
      </motion.button>

      {/* Label - Always visible except when menu is open */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute bottom-16 right-0 bg-white px-4 py-2 rounded-lg shadow-lg whitespace-nowrap"
          >
            <p className="text-sm font-medium text-[#0F1A26]">Need help?</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
