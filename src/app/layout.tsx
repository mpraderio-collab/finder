import type { Metadata } from "next";
import { Manrope, DM_Sans } from "next/font/google";
import { CartProvider } from "@/lib/cart-context";
import { WhatsAppButtonGate } from "@/components/WhatsAppButtonGate";
import { PageViewTracker } from "@/components/PageViewTracker";
import { MetaPixel } from "@/components/MetaPixel";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Finder — Iluminación moderna para tu casa",
  description:
    "Finder importa luces modernas para leer, trabajar y ambientar tu casa: lámparas de lectura, luces RGB con sensor de movimiento y luces de escritorio magnéticas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${manrope.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <MetaPixel />
        <CartProvider>{children}</CartProvider>
        <WhatsAppButtonGate />
        <PageViewTracker />
      </body>
    </html>
  );
}
