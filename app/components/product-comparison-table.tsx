"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

const rows = ["elastic", "zipper", "fabric", "print", "designs", "ecosystem", "guarantee"];

export function ProductComparisonTable() {
  const t = useTranslations("product");

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-[#0F1A26]/10 bg-white shadow-sm">
        <div className="bg-[#0F1A26] px-5 py-6 text-center sm:px-8">
          <span className="text-xs font-black uppercase tracking-[0.24em] text-[#EEBC3F]">{t("comparison.eyebrow")}</span>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">{t("comparison.title")}</h2>
          <p className="mt-2 text-sm font-semibold text-white/60">{t("comparison.subtitle")}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-start">
            <thead>
              <tr className="border-b border-[#0F1A26]/10 bg-[#F8F6F3]">
                <th className="w-[24%] px-5 py-4 text-sm font-black text-[#0F1A26]">{t("comparison.feature")}</th>
                <th className="w-[38%] bg-[#0F1A26] px-5 py-4 text-sm font-black text-white">{t("comparison.natonat")}</th>
                <th className="w-[38%] px-5 py-4 text-sm font-black text-[#0F1A26]/60">{t("comparison.competitors")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row} className={`border-b border-[#0F1A26]/8 last:border-0 ${index % 2 ? "bg-[#F8F6F3]/70" : "bg-white"}`}>
                  <td className="px-5 py-4 text-sm font-black text-[#0F1A26]">{t(`comparison.rows.${row}.feature`)}</td>
                  <td className="bg-[#0F1A26] px-5 py-4 text-sm font-bold leading-relaxed text-white">
                    <span className="inline-flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#EEBC3F]" />{t(`comparison.rows.${row}.natonat`)}</span>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold leading-relaxed text-[#0F1A26]/55">{t(`comparison.rows.${row}.competitors`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

