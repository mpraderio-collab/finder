"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// Dispara el evento Purchase del píxel una sola vez por pedido — guardamos
// una marca en sessionStorage para no duplicarlo si el usuario refresca
// esta página (Meta contaría dos conversiones por la misma compra).
export function PurchasePixel({
  orderId,
  value,
}: {
  orderId: string;
  value: number;
}) {
  useEffect(() => {
    const key = `finder-purchase-tracked-${orderId}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // si sessionStorage falla, preferimos disparar igual antes que perder la conversión
    }
    window.fbq?.("track", "Purchase", { value, currency: "ARS" });
  }, [orderId, value]);

  return null;
}
