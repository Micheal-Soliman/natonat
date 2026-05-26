"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';
import NextImage from "next/image";
import { X, ShoppingBag, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

interface SizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (size: string) => void;
  productName: string;
}

export function SizeModal({ isOpen, onClose, onConfirm, productName }: SizeModalProps) {
  const t = useTranslations('sizeModal');
  const tg = useTranslations('sizeModal.sizeGuideDetails');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const sizes = [
    { id: "s", label: tg('sizes.s.label'), cm: "45–53", inch: "18–21", type: tg('sizes.s.type'), icon: "/s.png" },
    { id: "m", label: tg('sizes.m.label'), cm: "55–63", inch: "22–25", type: tg('sizes.m.type'), icon: "/m.png" },
    { id: "l", label: tg('sizes.l.label'), cm: "65–70", inch: "26–28", type: tg('sizes.l.type'), icon: "/l.png" },
    { id: "xl", label: tg('sizes.xl.label'), cm: "72–81", inch: "29–32", type: tg('sizes.xl.type'), icon: "/xl.png" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#0F1A26]/5 flex items-center justify-center text-[#0F1A26]/60 hover:bg-[#0F1A26]/10 hover:text-[#0F1A26] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#EEBC3F]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Ruler className="w-8 h-8 text-[#EEBC3F]" />
          </div>
          <h3 className="text-xl font-bold text-[#0F1A26] mb-2">
            {t('title')}
          </h3>
          <p className="text-[#0F1A26]/60 text-sm">
            {t('subtitle')} <span className="font-medium text-[#0F1A26]">{productName}</span>
          </p>
        </div>

        {/* Size Options - Visual Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {sizes.map((size) => (
            <button
              key={size.id}
              onClick={() => setSelectedSize(size.id)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                selectedSize === size.id
                  ? "border-[#EEBC3F] bg-[#EEBC3F]/10"
                  : "border-[#0F1A26]/10 hover:border-[#0F1A26]/20 hover:bg-[#0F1A26]/5"
              }`}
            >
              {/* Size Image */}
              <div className={`w-full h-16 rounded-lg mb-2 flex items-center justify-center overflow-hidden ${
                selectedSize === size.id ? "bg-[#EEBC3F]/30" : "bg-[#EEBC3F]/20"
              }`}>
                <NextImage 
                  src={size.icon} 
                  alt={`Size ${size.label}`}
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>

              {/* Size Label */}
              <p className={`text-lg font-bold text-center mb-1 ${
                selectedSize === size.id ? "text-[#EEBC3F]" : "text-[#0F1A26]/80"
              }`}>
                {size.label}
              </p>

              {/* Type */}
              <p className={`text-sm font-semibold mb-1 ${
                selectedSize === size.id ? "text-[#0F1A26]" : "text-[#0F1A26]/80"
              }`}>
                {size.type}
              </p>

              {/* Measurements */}
              <div className="space-y-0.5 text-center">
                <p className={`font-bold text-sm ${
                  selectedSize === size.id ? "text-[#EEBC3F]" : "text-[#0F1A26]/70"
                }`}>
                  {size.cm} <span className="text-xs font-normal text-[#0F1A26]/50">cm</span>
                </p>
                <p className="text-xs text-[#0F1A26]/40">
                  {size.inch}&quot;
                </p>
                <p className="text-[#0F1A26]/30 text-[10px] italic">({tg('heightOnly')})</p>
              </div>

              {/* Selection indicator */}
              {selectedSize === size.id && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#EEBC3F] flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="bg-[#F1EBE3] rounded-xl p-3 mb-6">
          <p className="text-xs text-[#0F1A26]/70 text-center">
            💡 {t('note')} 
            <Link href="/how-it-works" className="text-[#EEBC3F] font-medium hover:underline ml-1">
              {t('sizeGuide')}
            </Link>
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-[#0F1A26]/20 text-[#0F1A26] hover:bg-[#0F1A26]/5 rounded-xl h-12"
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={() => selectedSize && onConfirm(selectedSize)}
            disabled={!selectedSize}
            className="flex-1 bg-[#0F1A26] text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26] rounded-xl h-12 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            {t('confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}
