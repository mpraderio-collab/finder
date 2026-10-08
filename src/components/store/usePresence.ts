"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PresenceState = "closed" | "open" | "closing";

function readMs(variable: string, fallback: number) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  if (!raw) return fallback;
  return raw.endsWith("ms") ? parseFloat(raw) : parseFloat(raw) * 1000 || fallback;
}

// Keeps an overlay mounted while its exit animation runs: open → closing →
// closed after the duration stored in the given CSS custom property. Locks
// page scroll and closes on Escape while open.
export function usePresence(closeDurationVar: string, fallbackMs = 250) {
  const [state, setState] = useState<PresenceState>("closed");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
      returnFocus.current = document.activeElement;
    }
    setState("open");
  }, []);

  const close = useCallback(() => {
    setState((s) => (s === "closed" ? s : "closing"));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("closed"), readMs(closeDurationVar, fallbackMs));
  }, [closeDurationVar, fallbackMs]);

  // Foco: al abrir entra al diálogo (si nada adentro lo tomó ya, como el
  // autoFocus de la búsqueda); al cerrar vuelve al botón que lo abrió.
  useEffect(() => {
    if (state === "open") {
      // Se reintenta unos frames: mientras el panel entra puede no ser
      // enfocable todavía (visibility de la animación de entrada).
      let frame = 0;
      let tries = 0;
      const tryFocus = () => {
        const dialogs = document.querySelectorAll<HTMLElement>('[aria-modal="true"]');
        const dialog = dialogs[dialogs.length - 1];
        if (dialog?.contains(document.activeElement)) return;
        dialog
          ?.querySelector<HTMLElement>('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])')
          ?.focus({ preventScroll: true });
        if (++tries < 20 && !dialog?.contains(document.activeElement)) {
          frame = requestAnimationFrame(tryFocus);
        }
      };
      frame = requestAnimationFrame(tryFocus);
      return () => cancelAnimationFrame(frame);
    }
    if (state === "closed" && returnFocus.current) {
      returnFocus.current.focus({ preventScroll: true });
      returnFocus.current = null;
    }
  }, [state]);

  useEffect(() => {
    if (state !== "open") return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [state, close]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { state, open, close };
}
