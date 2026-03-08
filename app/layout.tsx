import type { Metadata } from "next";
import { Montserrat, Quicksand } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./lib/cart-context";
import { Toaster } from "sonner";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

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
    <html lang="en">
      <body
        className={`${montserrat.variable} ${quicksand.variable} antialiased font-sans`}
      >
        <CartProvider>
          <Toaster
            closeButton
            richColors
            position="top-right"
            toastOptions={{
              style: {
                background: "#0F1A26",
                color: "#F1EBE3",
                border: "2px solid #EEBC3F",
                borderRadius: "16px",
                padding: "16px 20px",
                fontFamily: "var(--font-montserrat)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.3), 0 0 20px rgba(238,188,63,0.3)",
              },
              classNames: {
                toast: "group",
                title: "font-semibold text-[#F1EBE3] text-sm",
                description: "text-[#F1EBE3]/70 text-xs mt-1",
                actionButton: "!bg-[#FFD700] !hover:bg-[#FFEC8B] !text-[#0F1A26] font-bold text-xs px-5 py-2.5 rounded-full transition-all ml-3 !border-2 !border-[#FFD700] !hover:border-[#FFEC8B]",
                closeButton: "text-[#F1EBE3]/50 hover:text-[#EEBC3F] transition-colors",
              },
            }}
          />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
