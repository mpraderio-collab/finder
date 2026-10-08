import Image from "next/image";
import Link from "next/link";
import { CartLink } from "@/components/CartLink";
import { SearchTrigger } from "@/components/SearchTrigger";
import { MobileNav } from "@/components/MobileNav";

// Las escenas llevan al catálogo, que está ordenado por momento de uso.
export const sceneLinks = [
  { href: "/catalogo#leer", label: "Leer" },
  { href: "/catalogo#trabajar", label: "Trabajar" },
  { href: "/catalogo#ambientar", label: "Ambientar" },
];

export const pageLinks = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

export function Header() {
  return (
    <header
      className="store sticky top-0 z-40 border-b border-linen bg-cream/95 backdrop-blur-sm"
      style={{ viewTransitionName: "site-header" }}
    >
      <div className="mx-auto grid max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-5 py-4 md:px-16 md:py-6">
        <nav className="hidden items-center gap-8 md:flex" aria-label="Escenas">
          {sceneLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="b-link text-sm text-espresso"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <span className="md:hidden" />

        <Link href="/" className="shrink-0 justify-self-center" aria-label="Finder — inicio">
          <Image
            src="/brand/finder-logo.png"
            alt="Finder"
            width={1463}
            height={303}
            className="h-[20px] w-auto md:h-[22px]"
            priority
          />
        </Link>

        <div className="flex items-center justify-end gap-5 md:gap-7">
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Tienda">
            {pageLinks.slice(1).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="b-link text-sm text-espresso"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <SearchTrigger />
          <CartLink />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
