import { createNoIndexMetadata } from "@/lib/seo";

export const metadata = createNoIndexMetadata("Payment | natOnat");

export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
