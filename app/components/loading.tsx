"use client";

export function Loading() {
  return (
    <div className="min-h-screen bg-[#F1EBE3] flex flex-col items-center justify-center">
      {/* Premium Spinner */}
      <div className="relative">
        {/* Outer ring */}
        <div className="w-20 h-20 rounded-full border-4 border-[#0F1A26]/10" />
        
        {/* Spinning ring */}
        <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-[#EEBC3F] border-r-[#EEBC3F] animate-spin" />
        
        {/* Inner dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-[#EEBC3F] animate-pulse" />
        </div>
      </div>
      
      {/* Loading text */}
      <p className="mt-6 text-[#0F1A26]/60 text-sm font-medium tracking-wider uppercase animate-pulse">
        Loading
      </p>
      
      {/* Brand logo */}
      <div className="mt-8">
        <span className="text-[#0F1A26]/30 text-lg font-light tracking-[0.3em] uppercase">
          natOnat
        </span>
      </div>
    </div>
  );
}
