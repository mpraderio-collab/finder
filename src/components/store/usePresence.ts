"use client";

import { useEffect, useState } from "react";

// Mantiene montado un overlay mientras corre su animación de salida.
// `mounted` decide si se renderiza; `visible` es el estado que lee el CSS
// (data-open / .is-open). Al abrir se monta primero y se activa en el
// cuadro siguiente, para que la transición de entrada tenga desde dónde
// arrancar.
export function usePresence(open: boolean, exitMs: number) {
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(open);

  // Abrir monta en el mismo render (ajuste de estado durante el render, no
  // en un effect).
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open) {
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setEntered(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    const timeout = setTimeout(() => {
      setMounted(false);
      setEntered(false);
    }, exitMs);
    return () => clearTimeout(timeout);
  }, [open, exitMs]);

  return { mounted, visible: open && entered };
}
