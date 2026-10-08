"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GiftIcon, TruckIcon } from "@/components/store/Icons";

const MESSAGES = [
  { icon: TruckIcon, text: "Envío a todo el país" },
  { icon: GiftIcon, text: "10% off llevando 3 productos — combinalos como quieras" },
];

const INTERVAL_MS = 4000;

// Franja de anuncio arriba de todo el sitio, con crossfade entre dos
// mensajes (ver globals.css .t-text-swap, del sistema de transiciones ya
// instalado) para llamar la atención sin ser invasivo.
export function PromoBanner() {
  const pathname = usePathname();
  const [index, setIndex] = useState(0);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const el = textRef.current;
      if (!el) {
        setIndex((i) => (i + 1) % MESSAGES.length);
        return;
      }
      el.classList.add("is-exit");
      const swapTimeout = setTimeout(() => {
        setIndex((i) => (i + 1) % MESSAGES.length);
        el.classList.remove("is-exit");
        el.classList.add("is-enter-start");
        void el.offsetWidth; // fuerza el reflow para que la animación de entrada se re-dispare
        el.classList.remove("is-enter-start");
      }, 200);
      return () => clearTimeout(swapTimeout);
    }, INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  if (pathname.startsWith("/admin")) return null;

  const { icon: Icon, text } = MESSAGES[index];

  return (
    <div
      className="store bg-night py-2.5 text-center"
      style={{ viewTransitionName: "promo-bar" }}
    >
      <p className="px-4 text-[13px] text-cream">
        <span ref={textRef} className="t-text-swap">
          <span className="inline-flex items-center gap-2">
            <Icon size={14} />
            {text}
          </span>
        </span>
      </p>
    </div>
  );
}
