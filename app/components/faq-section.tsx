"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

interface FAQItem {
  questionKey: string;
  answerKey: string;
}

interface FAQSectionProps {
  title?: string;
  faqs: FAQItem[];
  translationNamespace?: string;
  showIcon?: boolean;
  className?: string;
}

export function FAQSection({ 
  title,
  faqs,
  translationNamespace = 'product',
  showIcon = true,
  className = ""
}: FAQSectionProps) {
  const t = useTranslations(translationNamespace);
  const [openItems, setOpenItems] = useState<number[]>([0]); // First item open by default

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className={`bg-white rounded-3xl p-6 border border-[#0F1A26]/5 ${className}`}>
      {title && (
        <h3 className="text-sm font-bold text-[#0F1A26] mb-5 tracking-[0.1em] uppercase flex items-center gap-2">
          {showIcon && <HelpCircle className="w-4 h-4 text-[#EEBC3F]" />}
          {title}
        </h3>
      )}
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border-b border-[#0F1A26]/5 last:border-0 pb-3 last:pb-0"
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full flex items-center justify-between text-left group py-2"
            >
              <span className="font-semibold text-[#0F1A26] text-sm pr-4 group-hover:text-[#EEBC3F] transition-colors duration-300">
                {t(faq.questionKey)}
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                openItems.includes(index) 
                  ? 'bg-[#EEBC3F] text-[#0F1A26]' 
                  : 'bg-[#F8F6F3] text-[#0F1A26]/40 group-hover:bg-[#EEBC3F]/10 group-hover:text-[#EEBC3F]'
              }`}>
                {openItems.includes(index) ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>
            {openItems.includes(index) && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <p className="text-[#0F1A26]/60 text-sm leading-relaxed pt-2 pb-1 pl-0">
                  {t(faq.answerKey)}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
