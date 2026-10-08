"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const navLinks = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

// Desktop nav: inactive links dim on hover, the active one carries a dot on
// its left (reference .btn--nav).
export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-8 text-sm md:flex">
      {navLinks.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`relative transition-opacity duration-[var(--d-dur)] ease-[var(--d-ease)] ${
              active ? "" : "hover:opacity-30"
            }`}
          >
            <span
              aria-hidden="true"
              className={`absolute -left-3.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-current transition-opacity duration-[var(--d-dur)] ease-[var(--d-ease)] ${
                active ? "opacity-100" : "opacity-0"
              }`}
            />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
