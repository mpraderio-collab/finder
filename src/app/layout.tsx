import type { Metadata } from "next";
import { Manrope, DM_Sans, Instrument_Sans, Libre_Caslon_Text } from "next/font/google";
import { CartProvider } from "@/lib/cart-context";
import { WhatsAppButtonGate } from "@/components/WhatsAppButtonGate";
import { PageViewTracker } from "@/components/PageViewTracker";
import { MetaPixel } from "@/components/MetaPixel";
import { PromoBanner } from "@/components/PromoBanner";
import { CartDrawer } from "@/components/CartDrawer";
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

// Storefront (D · Galería) typefaces — stand-ins for the reference's Mier A
// and Caslon Ionic, which are not on Google Fonts.
const instrumentSans = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const libreCaslon = Libre_Caslon_Text({
  variable: "--font-caslon",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
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
      className={`${manrope.variable} ${dmSans.variable} ${instrumentSans.variable} ${libreCaslon.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <MetaPixel />
        <PromoBanner />
        <CartProvider>{children}</CartProvider>
        <CartDrawer />
        <WhatsAppButtonGate />
        <PageViewTracker />
      </body>
    </html>
  );
}
