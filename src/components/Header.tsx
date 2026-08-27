import Link from "next/link";
import { CartLink } from "@/components/CartLink";

const links = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/blog", label: "Blog" },
  { href: "/contacto", label: "Contacto" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-heading text-2xl font-extrabold tracking-tight text-ink"
        >
          Finder<span className="text-amber">.</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <CartLink />
      </div>
    </header>
  );
}
