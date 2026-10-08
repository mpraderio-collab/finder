"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SearchTrigger } from "@/components/SearchTrigger";
import { CloseIcon, MenuIcon } from "@/components/store/Icons";
import { usePresence } from "@/components/store/usePresence";

const links = [
  { href: "/catalogo#leer", label: "Leer", scene: "01" },
  { href: "/catalogo#trabajar", label: "Trabajar", scene: "02" },
  { href: "/catalogo#ambientar", label: "Ambientar", scene: "03" },
];

const pages = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

// Duración de cierre del panel (--panel-close-dur).
const PANEL_CLOSE_MS = 350;

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { mounted, visible } = usePresence(open, PANEL_CLOSE_MS);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center text-espresso"
      >
        <MenuIcon size={22} />
      </button>

      {/* Portal: el header tiene backdrop-filter, que vuelve "fixed" relativo
          al header en vez de a la ventana. */}
      {mounted &&
        createPortal(
          <div
            className={`t-scrim fixed inset-0 z-50 bg-night/50 ${visible ? "is-open" : ""}`}
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Menú"
              data-open={visible}
              className="t-panel-slide t-panel-slide--x store absolute right-0 top-0 flex h-full w-[min(340px,88vw)] flex-col bg-cream px-6 py-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-linen pb-4">
                <span className="b-eyebrow">Menú</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar menú"
                  className="flex h-11 w-11 items-center justify-center text-espresso"
                >
                  <CloseIcon size={20} />
                </button>
              </div>
              <nav className="mt-6 flex flex-col" aria-label="Escenas">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-baseline gap-3 border-b border-linen py-4"
                  >
                    <span className="font-serif text-sm text-clay-ink">
                      {link.scene}
                    </span>
                    <span className="font-serif text-[28px] leading-none text-espresso">
                      {link.label}
                    </span>
                  </Link>
                ))}
              </nav>
              <nav className="mt-4 flex flex-col" aria-label="Tienda">
                {pages.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center text-base text-espresso"
                  >
                    {link.label}
                  </Link>
                ))}
                <SearchTrigger triggerClassName="flex min-h-11 items-center gap-2 text-left text-base text-espresso" />
              </nav>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
