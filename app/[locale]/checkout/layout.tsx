import { createNoIndexMetadata } from "@/lib/seo";

export const metadata = createNoIndexMetadata("Checkout | natOnat");

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
