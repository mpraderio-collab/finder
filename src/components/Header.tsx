import Image from "next/image";
import Link from "next/link";
import { CartLink } from "@/components/CartLink";

const links = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="shrink-0">
          <Image
            src="/brand/finder-logo.png"
            alt="Finder"
            width={1463}
            height={303}
            className="h-[22px] w-auto"
            priority
          />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-navy"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-6">
          <span className="hidden text-sm font-medium text-ink-soft sm:inline">
            Buscar
          </span>
          <CartLink />
        </div>
      </div>
    </header>
  );
}
