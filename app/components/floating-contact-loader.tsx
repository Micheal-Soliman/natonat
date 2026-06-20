"use client";

import dynamic from "next/dynamic";

const FloatingContact = dynamic(
  () => import("../components/floating-contact").then((m) => m.FloatingContact),
  {
    ssr: false,
    loading: () => (
      <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end sm:right-6">
        <div className="w-14 h-14 rounded-full bg-[#0F1A26]" />
      </div>
    ),
  }
);

export default function FloatingContactLoader() {
  return <FloatingContact />;
}
