"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SearchTrigger } from "@/components/SearchTrigger";
import { navLinks } from "@/components/NavLinks";
import { BodyPortal } from "@/components/d/BodyPortal";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
      <button type="button" onClick={() => setOpen(true)} aria-label="Abrir menú" className="d-fade text-sm">
        Menú
      </button>

      <BodyPortal>
        <div
          className="d-scrim fixed inset-0 z-[60] bg-d-ink/40"
          data-open={open}
          onClick={() => setOpen(false)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
          inert={!open}
          data-open={open}
          className="t-panel-slide fixed inset-y-0 right-0 z-[61] flex w-full max-w-[360px] flex-col border-l border-d-ink bg-d-bg font-d-sans text-d-ink"
        >
          <div className="flex h-[72px] items-center justify-between border-b border-d-ink px-5">
            <span className="text-lg">Menú</span>
            <button type="button" onClick={() => setOpen(false)} className="d-fade text-sm">
              Cerrar
            </button>
          </div>
          <nav className="flex flex-col px-5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={pathname === link.href ? "page" : undefined}
                className="d-fade border-b border-d-line py-4 text-[26px] leading-tight"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="px-5 py-5">
            <SearchTrigger triggerClassName="d-fade text-sm underline underline-offset-2" />
          </div>
        </div>
      </BodyPortal>
    </div>
  );
}
