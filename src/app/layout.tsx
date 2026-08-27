import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import { CartProvider } from "@/lib/cart-context";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
      className={`${sora.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
