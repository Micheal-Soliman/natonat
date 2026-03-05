"use client";

import { useState } from "react";
import { X, ShoppingBag, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";

const sizes = [
  { id: "s", label: "S", range: "18-21 inches" },
  { id: "m", label: "M", range: "22-25 inches" },
  { id: "l", label: "L", range: "26-29 inches" },
  { id: "xl", label: "XL", range: "30-32 inches" },
];

interface SizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (size: string) => void;
  productName: string;
}

export function SizeModal({ isOpen, onClose, onConfirm, productName }: SizeModalProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

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
            Select Size
          </h3>
          <p className="text-[#0F1A26]/60 text-sm">
            Choose the right size for <span className="font-medium text-[#0F1A26]">{productName}</span>
          </p>
        </div>

        {/* Size Options */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {sizes.map((size) => (
            <button
              key={size.id}
              onClick={() => setSelectedSize(size.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                selectedSize === size.id
                  ? "border-[#EEBC3F] bg-[#EEBC3F]/10"
                  : "border-[#0F1A26]/10 hover:border-[#0F1A26]/20 hover:bg-[#0F1A26]/5"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-2xl font-bold ${
                  selectedSize === size.id ? "text-[#EEBC3F]" : "text-[#0F1A26]"
                }`}>
                  {size.label}
                </span>
                {selectedSize === size.id && (
                  <div className="w-5 h-5 rounded-full bg-[#EEBC3F] flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-xs text-[#0F1A26]/50">
                {size.range}
              </p>
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="bg-[#F1EBE3] rounded-xl p-3 mb-6">
          <p className="text-xs text-[#0F1A26]/70 text-center">
            💡 Not sure? Check your suitcase measurements or visit our
            <a href="/how-it-works" className="text-[#EEBC3F] font-medium hover:underline ml-1">
              size guide
            </a>
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-[#0F1A26]/20 text-[#0F1A26] hover:bg-[#0F1A26]/5 rounded-xl h-12"
          >
            Cancel
          </Button>
          <Button
            onClick={() => selectedSize && onConfirm(selectedSize)}
            disabled={!selectedSize}
            className="flex-1 bg-[#0F1A26] text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26] rounded-xl h-12 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
