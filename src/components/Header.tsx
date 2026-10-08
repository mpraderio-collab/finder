import Link from "next/link";
import { CartLink } from "@/components/CartLink";
import { SearchTrigger } from "@/components/SearchTrigger";
import { MobileNav } from "@/components/MobileNav";
import { CartDrawer } from "@/components/store/CartDrawer";
import { HeaderBar } from "@/components/store/HeaderBar";

const links = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

export function Header() {
  return (
    <>
      <HeaderBar>
        <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center px-4 md:px-8">
          <nav className="flex items-center gap-6">
            <MobileNav />
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="e-mono hidden text-e-ink transition-opacity hover:opacity-60 md:inline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/"
            transitionTypes={["nav-back"]}
            className="text-[20px] font-bold tracking-[0.2em] text-e-ink"
          >
            FINDER
          </Link>
          <div className="flex items-center justify-end gap-2 md:gap-4">
            <Link
              href="/contacto"
              className="e-mono hidden text-e-ink transition-opacity hover:opacity-60 lg:inline"
            >
              Ayuda
            </Link>
            <SearchTrigger />
            <CartLink />
          </div>
        </div>
      </HeaderBar>
      <CartDrawer />
    </>
  );
}
