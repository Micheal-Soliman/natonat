import { createNoIndexMetadata } from "@/lib/seo";

export const metadata = createNoIndexMetadata("Order Confirmation | natOnat");

export default function OrderConfirmedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
