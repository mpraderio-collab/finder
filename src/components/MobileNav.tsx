"use client";

import { createPortal } from "react-dom";
import Link from "next/link";
import { SearchTrigger } from "@/components/SearchTrigger";
import { CloseIcon, MenuIcon } from "@/components/store/Icons";
import { usePresence } from "@/components/store/usePresence";

const links = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

// Mobile menu: drawer from the left (maap.cc pattern, 300ms in / 250ms out).
export function MobileNav() {
  const { state, open, close } = usePresence("--e-drawer-out");

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={open}
        aria-label="Abrir menú"
        className="-ml-3 grid h-11 w-11 place-items-center text-e-ink"
      >
        <MenuIcon size={20} />
      </button>

      {state !== "closed" &&
        createPortal(
          <div
            className="fixed inset-0 z-[60]"
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
          >
            <div
              data-state={state}
              className="e-drawer-overlay absolute inset-0 bg-black/50"
              onClick={close}
            />
            <div
              data-state={state}
              className="e-drawer-panel e-drawer-panel--left absolute left-0 top-0 flex h-full w-[85vw] max-w-[360px] flex-col bg-e-bg"
            >
              <div className="flex items-center justify-between border-b border-e-line px-5 py-4">
                <span className="e-mono">Menú</span>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Cerrar menú"
                  className="-mr-2.5 grid h-11 w-11 place-items-center rounded-full hover:bg-e-tile"
                >
                  <CloseIcon size={18} />
                </button>
              </div>
              <nav className="flex flex-col px-5 py-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={close}
                    className="border-b border-e-line py-4 text-[28px] font-medium leading-tight text-e-ink"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="px-5 py-4">
                <SearchTrigger
                  showLabel
                  triggerClassName="e-pill e-pill--outline w-full"
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
