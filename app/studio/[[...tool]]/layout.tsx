import { createNoIndexMetadata } from "@/lib/seo";

export const metadata = createNoIndexMetadata("Studio | natOnat");

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
