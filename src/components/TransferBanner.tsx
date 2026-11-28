"use client";

import { usePathname } from "next/navigation";
import { getWhatsAppUrl } from "@/lib/whatsapp";

const MESSAGE = "¡Hola! Quiero comprar con el 10% off pagando por transferencia.";

// Franja ámbar del descuento por transferencia. El checkout cobra solo por
// Mercado Pago, así que el pedido con descuento se coordina por WhatsApp.
export function TransferBanner() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <a
      href={getWhatsAppUrl(MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-amber px-4 py-3 text-center text-[#222222]"
    >
      <span className="text-[15px] leading-snug md:text-[18px]">
        <strong className="font-bold">10% off en toda la tienda</strong> pagando por transferencia
      </span>
      <span className="text-[12px] font-medium underline underline-offset-4 group-hover:no-underline">
        Pedilo por WhatsApp
      </span>
    </a>
  );
}
