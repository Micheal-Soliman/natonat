import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "./lib/cart-context";
import { ToastProvider } from "./components/toast-provider";

export const metadata: Metadata = {
  title: "natOnat | Pack Smart. Travel Easy.",
  description: "Premium travel accessories - stretchy, washable luggage covers and smart passport wallets that protect your gear and make it stand out.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ToastProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </ToastProvider>
  );
}
