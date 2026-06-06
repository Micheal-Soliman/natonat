"use client";

import dynamic from "next/dynamic";

const SanityStudio = dynamic(
  () => import("@/app/components/sanity-studio").then((mod) => mod.SanityStudio),
  { ssr: false },
);

export default function StudioPage() {
  return <SanityStudio />;
}
