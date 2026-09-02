"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SearchTrigger } from "@/components/SearchTrigger";

const links = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

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
        className="flex h-9 w-9 items-center justify-center"
      >
        <span className="flex flex-col gap-[5px]">
          <span className="h-0.5 w-5 rounded-full bg-navy" />
          <span className="h-0.5 w-5 rounded-full bg-navy" />
          <span className="h-0.5 w-5 rounded-full bg-navy" />
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-ink/50"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-bg p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="font-heading text-sm font-bold text-navy">
                Menú
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="text-2xl leading-none text-ink-faint hover:text-ink"
              >
                ×
              </button>
            </div>
            <nav className="mt-5 flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-base font-medium text-ink hover:bg-surface"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 border-t border-line pt-4">
              <SearchTrigger triggerClassName="w-full rounded-lg px-3 py-2.5 text-left text-base font-medium text-ink hover:bg-surface" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
