"use client";

import { Check, X } from "lucide-react";
import { Toast } from "./toast-provider";

interface CustomToastProps {
  toast: Toast;
  onClose: () => void;
}

export function CustomToast({ toast, onClose }: CustomToastProps) {
  return (
    <div className="bg-[#0F1A26] text-[#F1EBE3] border-2 border-[#EEBC3F] rounded-2xl p-4 min-w-[320px] max-w-[400px] shadow-[0_20px_40px_rgba(0,0,0,0.3),0_0_20px_rgba(238,188,63,0.3)] animate-in slide-in-from-right duration-300">
      <div className="flex items-start gap-3">
        {/* Success Icon */}
        <div className="flex-shrink-0 w-8 h-8 bg-[#EEBC3F]/20 rounded-full flex items-center justify-center">
          <Check className="w-5 h-5 text-[#EEBC3F]" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[#F1EBE3] text-sm">{toast.title}</h4>
          {toast.description && (
            <p className="text-[#F1EBE3]/70 text-xs mt-1">{toast.description}</p>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-2 mt-3">
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick();
                  onClose();
                }}
                className="bg-[#FFD700] hover:bg-[#FFEC8B] text-[#0F1A26] font-bold text-xs px-4 py-2 rounded-full transition-all border-2 border-[#FFD700] hover:border-[#FFEC8B]"
              >
                {toast.action.label}
              </button>
            )}
            {toast.cancel && (
              <button
                onClick={() => {
                  toast.cancel?.onClick();
                  onClose();
                }}
                className="bg-white hover:bg-[#EEBC3F] text-[#0F1A26] font-bold text-xs px-4 py-2 rounded-full transition-all border-2 border-white hover:border-[#EEBC3F]"
              >
                {toast.cancel.label}
              </button>
            )}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="flex-shrink-0 text-[#F1EBE3]/50 hover:text-[#EEBC3F] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
