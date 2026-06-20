import { createNoIndexMetadata } from "@/lib/seo";

export const metadata = createNoIndexMetadata("Wishlist | natOnat");

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
