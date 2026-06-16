import { createNoIndexMetadata } from "@/lib/seo";

export const metadata = createNoIndexMetadata("Cart | natOnat");

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
