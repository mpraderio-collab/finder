"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const INTERVAL_MS = 4000;

// Franja de anuncio arriba de todo el sitio, con crossfade entre dos
// mensajes (ver globals.css .t-text-swap, del sistema de transiciones ya
// instalado) para llamar la atención sin ser invasivo.
export function PromoBanner({ messages }: { messages: string[] }) {
  const pathname = usePathname();
  const [index, setIndex] = useState(0);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (messages.length < 2) return;
    const interval = setInterval(() => {
      const el = textRef.current;
      if (!el) {
        setIndex((i) => (i + 1) % messages.length);
        return;
      }
      el.classList.add("is-exit");
      const swapTimeout = setTimeout(() => {
        setIndex((i) => (i + 1) % messages.length);
        el.classList.remove("is-exit");
        el.classList.add("is-enter-start");
        void el.offsetWidth; // fuerza el reflow para que la animación de entrada se re-dispare
        el.classList.remove("is-enter-start");
      }, 200);
      return () => clearTimeout(swapTimeout);
    }, INTERVAL_MS);
    return () => clearInterval(interval);
  }, [messages.length]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <div className="flex h-10 items-center justify-center bg-e-ink text-center">
      <p className="px-4 text-[12px] text-white">
        <span ref={textRef} className="t-text-swap">
          {messages[index % messages.length]}
        </span>
      </p>
    </div>
  );
}
