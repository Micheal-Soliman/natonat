"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";

export default function PromisePage() {
  const t = useTranslations("promise");
  const [state, setState] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setError("");
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/returns/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || t("error"));
      setState("idle");
      return;
    }
    setState("success");
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F1EBE3] px-4 pb-20 pt-32">
        <div className="mx-auto max-w-5xl">
          <header className="mb-10 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#EEBC3F]">natOnat</p>
            <h1 className="mt-3 text-4xl font-black text-[#0F1A26] sm:text-6xl">{t("title")}</h1>
            <p className="mt-4 text-base font-semibold leading-7 text-[#0F1A26]/65 sm:text-lg">{t("subtitle")}</p>
          </header>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <section className="space-y-3">
              {["fit", "window", "support"].map((item) => (
                <div key={item} className="rounded-2xl border border-[#0F1A26]/10 bg-white p-5">
                  <h2 className="font-black text-[#0F1A26]">{t(`benefits.${item}.title`)}</h2>
                  <p className="mt-1 text-sm leading-6 text-[#0F1A26]/60">{t(`benefits.${item}.description`)}</p>
                </div>
              ))}
            </section>
            <section className="rounded-3xl border border-[#0F1A26]/10 bg-white p-5 shadow-sm sm:p-8">
              {state === "success" ? (
                <div className="py-16 text-center"><h2 className="text-2xl font-black text-[#0F1A26]">{t("successTitle")}</h2><p className="mt-3 text-[#0F1A26]/60">{t("successBody")}</p></div>
              ) : (
                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                  <h2 className="sm:col-span-2 text-2xl font-black text-[#0F1A26]">{t("formTitle")}</h2>
                  <input name="orderRef" required placeholder={t("orderRef")} className="h-12 rounded-xl border border-[#0F1A26]/15 px-4 text-base" />
                  <input name="phone" required inputMode="tel" placeholder={t("phone")} className="h-12 rounded-xl border border-[#0F1A26]/15 px-4 text-base" />
                  <input name="customerName" required placeholder={t("name")} className="h-12 rounded-xl border border-[#0F1A26]/15 px-4 text-base" />
                  <input name="email" type="email" placeholder={t("email")} className="h-12 rounded-xl border border-[#0F1A26]/15 px-4 text-base" />
                  <select name="requestType" className="h-12 rounded-xl border border-[#0F1A26]/15 bg-white px-4 text-base sm:col-span-2"><option value="exchange">{t("exchange")}</option><option value="return">{t("return")}</option></select>
                  <textarea name="reason" required minLength={8} placeholder={t("reason")} className="min-h-32 rounded-xl border border-[#0F1A26]/15 p-4 text-base sm:col-span-2" />
                  {error && <p className="text-sm font-bold text-red-600 sm:col-span-2">{error}</p>}
                  <Button disabled={state === "loading"} className="h-12 bg-[#EEBC3F] font-black text-[#0F1A26] hover:bg-[#0F1A26] hover:text-white sm:col-span-2">{state === "loading" ? t("sending") : t("submit")}</Button>
                </form>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

