"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Truck } from "lucide-react";
import { useTranslations } from "next-intl";

type DeliveryCountdownVariant = "dark" | "darkCompact" | "showcase" | "light" | "compact" | "sticky";

type DeliveryCountdownProps = {
  variant?: DeliveryCountdownVariant;
  className?: string;
};

const CUTOFF_HOUR = 14;
const CUTOFF_MINUTE = 30;
const CAIRO_TIME_ZONE = "Africa/Cairo";

type DeliveryState = {
  remainingMs: number;
  deliveryDays: 1 | 2;
};

function getTimeZoneParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value || 0);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

function getTimeZoneOffsetMs(timeZone: string, date: Date) {
  const parts = getTimeZoneParts(date, timeZone);
  const zonedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return zonedAsUtc - date.getTime();
}

function zonedTimeToUtcMs(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const firstOffset = getTimeZoneOffsetMs(timeZone, new Date(utcGuess));
  const firstUtc = utcGuess - firstOffset;
  const finalOffset = getTimeZoneOffsetMs(timeZone, new Date(firstUtc));

  return utcGuess - finalOffset;
}

function addCalendarDays(year: number, month: number, day: number, days: number) {
  const next = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));

  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  };
}

function getDeliveryState(): DeliveryState {
  const now = new Date();
  const cairoNow = getTimeZoneParts(now, CAIRO_TIME_ZONE);
  const isBeforeCutoff =
    cairoNow.hour < CUTOFF_HOUR ||
    (cairoNow.hour === CUTOFF_HOUR && cairoNow.minute < CUTOFF_MINUTE);
  const targetDate = isBeforeCutoff
    ? cairoNow
    : addCalendarDays(cairoNow.year, cairoNow.month, cairoNow.day, 1);
  const cutoffUtcMs = zonedTimeToUtcMs(
    CAIRO_TIME_ZONE,
    targetDate.year,
    targetDate.month,
    targetDate.day,
    CUTOFF_HOUR,
    CUTOFF_MINUTE,
  );

  return {
    remainingMs: cutoffUtcMs - now.getTime(),
    deliveryDays: isBeforeCutoff ? 1 : 2,
  };
}

function getCountdownParts(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

export function DeliveryCountdown({ variant = "light", className = "" }: DeliveryCountdownProps) {
  const t = useTranslations("deliveryCountdown");
  const [deliveryState, setDeliveryState] = useState<DeliveryState | null>(null);

  useEffect(() => {
    const updateDeliveryState = () => {
      setDeliveryState(getDeliveryState());
    };

    updateDeliveryState();
    const timer = window.setInterval(updateDeliveryState, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const countdownParts = useMemo(
    () => getCountdownParts(deliveryState?.remainingMs ?? 0),
    [deliveryState?.remainingMs]
  );
  const title = deliveryState?.deliveryDays === 1 ? t("titleOneDay") : t("titleTwoDays");

  const isDark = variant === "dark" || variant === "darkCompact";
  const isCompact = variant === "compact" || variant === "darkCompact";
  const isSticky = variant === "sticky";
  const compactTime = deliveryState === null
    ? "--:--:--"
    : `${countdownParts.hours}:${countdownParts.minutes}:${countdownParts.seconds}`;

  if (isSticky) {
    return (
      <div
        className={[
          "inline-flex min-w-0 items-center gap-2 rounded-full border border-[#EEBC3F]/35 bg-[#FFF8E5] px-3 py-2 text-[#0F1A26] shadow-sm shadow-[#EEBC3F]/10",
          className,
        ].join(" ")}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0F1A26] text-[#EEBC3F]">
          <Truck className="h-4 w-4" strokeWidth={1.9} />
        </span>
        <span className="min-w-0 truncate text-xs font-black leading-tight">
          {title}
        </span>
        <span className="shrink-0 rounded-full bg-[#0F1A26] px-2.5 py-1 font-mono text-xs font-black text-[#EEBC3F]">
          {compactTime}
        </span>
      </div>
    );
  }

  if (variant === "darkCompact") {
    return (
      <div
        className={[
          "group relative inline-flex max-w-full items-stretch overflow-hidden rounded-[28px] border border-[#EEBC3F]/30 bg-[#18232E] text-white shadow-2xl shadow-black/20 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5",
          className,
        ].join(" ")}
      >
        <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[#EEBC3F] to-transparent opacity-80" />
        <div className="absolute -right-12 -top-10 h-28 w-28 rounded-full bg-[#EEBC3F]/15 blur-2xl transition-opacity duration-300 group-hover:opacity-80" />

        <div className="relative flex items-center gap-3 px-4 py-3">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEBC3F] text-[#0F1A26] shadow-lg shadow-[#EEBC3F]/20">
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#18232E]" />
            <Truck className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-black leading-tight tracking-tight">{title}</p>
            <span className="mt-1 inline-flex rounded-full bg-[#EEBC3F] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#0F1A26]">
              {t("badge")}
            </span>
          </div>
        </div>

        <div className="relative flex items-center border-l border-dashed border-white/15 bg-[#0F1A26]/65 px-4 py-3">
          <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#0F1A26]" />
          <span className="rounded-2xl border border-[#EEBC3F]/25 bg-black/25 px-3.5 py-2 font-mono text-sm font-black tabular-nums text-[#EEBC3F] shadow-inner">
            {compactTime}
          </span>
        </div>
      </div>
    );
  }

  if (variant === "showcase") {
    const showcaseBlocks = [
      { value: countdownParts.hours, label: t("hours") },
      { value: countdownParts.minutes, label: t("minutes") },
      { value: countdownParts.seconds, label: t("seconds") },
    ];

    return (
      <div
        className={[
          "relative overflow-hidden rounded-[2rem] border border-[#EEBC3F]/30 bg-[#17222D] text-white shadow-2xl shadow-black/25",
          className,
        ].join(" ")}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-[#EEBC3F]" />
        <div className="grid items-stretch md:grid-cols-[1.05fr_0.95fr]">
          <div className="relative p-4 sm:p-6">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#EEBC3F] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#0F1A26]">
              <Truck className="h-4 w-4" strokeWidth={2} />
              {t("badge")}
            </div>
            <p className="max-w-xl text-[1.7rem] font-black leading-[1.05] tracking-tight text-white sm:text-3xl">
              {title}
            </p>
            <div className="mt-4 flex items-center gap-3 sm:mt-5">
              <span className="h-px w-1/2 bg-gradient-to-r from-[#EEBC3F] to-[#EEBC3F]/20" />
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#EEBC3F]/35 bg-[#0F1A26] text-[#EEBC3F] shadow-lg shadow-[#EEBC3F]/10">
                <span className="absolute inset-0 rounded-full border border-[#EEBC3F]/30 animate-ping" />
                <Truck className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className="h-px flex-1 border-t border-dashed border-[#EEBC3F]/45" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#EEBC3F]" />
            </div>
          </div>

          <div className="relative border-t border-white/10 bg-[#0F1A26]/65 p-4 sm:p-6 md:border-l md:border-t-0">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/55">
                <Clock className="h-4 w-4 text-[#EEBC3F]" strokeWidth={2} />
                {t("orderWithin")}
              </span>
              <span className="h-2 w-2 rounded-full bg-[#EEBC3F] shadow-[0_0_18px_rgba(238,188,63,0.9)]" />
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {showcaseBlocks.map((block) => (
                <div
                  key={block.label}
                  className="rounded-2xl border border-[#EEBC3F]/25 bg-black/25 px-2 py-3 text-center shadow-inner sm:p-3"
                >
                  <div className="font-mono text-[1.55rem] font-black tabular-nums leading-none text-[#EEBC3F] sm:text-3xl">
                    {deliveryState === null ? "--" : block.value}
                  </div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-wide text-white/45">
                    {block.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const shellClass = isDark
    ? "border-white/10 bg-white/[0.08] text-white shadow-black/20"
    : "border-[#EEBC3F]/35 bg-white text-[#0F1A26] shadow-[#0F1A26]/8";

  const accentClass = isDark
    ? "bg-[#EEBC3F] text-[#0F1A26]"
    : "bg-[#0F1A26] text-[#EEBC3F]";

  const mutedClass = isDark ? "text-white/55" : "text-[#0F1A26]/55";
  const titleClass = isDark ? "text-white" : "text-[#0F1A26]";

  const timeBlocks = [
    { value: countdownParts.hours, label: t("hours") },
    { value: countdownParts.minutes, label: t("minutes") },
    { value: countdownParts.seconds, label: t("seconds") },
  ];

  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border shadow-lg",
        isCompact ? "p-3" : "p-4 sm:p-5",
        shellClass,
        className,
      ].join(" ")}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#EEBC3F] via-white to-[#EEBC3F]" />
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[#EEBC3F]/20 blur-2xl" />

      <div className={["relative flex items-center", isCompact ? "gap-3" : "gap-4"].join(" ")}>
        <div className={["flex shrink-0 items-center justify-center rounded-2xl", isCompact ? "h-10 w-10" : "h-12 w-12", accentClass].join(" ")}>
          <Truck className={isCompact ? "h-5 w-5" : "h-6 w-6"} strokeWidth={1.8} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={["font-black leading-tight", isCompact ? "text-sm" : "text-base sm:text-lg", titleClass].join(" ")}>
              {title}
            </p>
            <span className="rounded-full bg-[#EEBC3F] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#0F1A26]">
              {t("badge")}
            </span>
          </div>
        </div>

        <div className="shrink-0">
          <div className={["mb-1 flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-wide", mutedClass].join(" ")}>
            <Clock className="h-3 w-3" strokeWidth={2} />
            {t("orderWithin")}
          </div>
          <div className="flex items-center gap-1">
            {timeBlocks.map((block, index) => (
              <div key={block.label} className="flex items-center gap-1">
                <div className={["rounded-xl border text-center font-mono font-black", isDark ? "border-white/10 bg-[#0F1A26] text-[#EEBC3F]" : "border-[#0F1A26]/10 bg-[#0F1A26] text-[#EEBC3F]", isCompact ? "min-w-9 px-1.5 py-1 text-xs" : "min-w-11 px-2 py-1.5 text-sm"].join(" ")}>
                  {deliveryState === null ? "--" : block.value}
                </div>
                {index < timeBlocks.length - 1 && (
                  <span className={["font-black", mutedClass].join(" ")}>:</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
