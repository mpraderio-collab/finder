import Link from "next/link";
import { CartLink } from "@/components/CartLink";
import { SearchTrigger } from "@/components/SearchTrigger";
import { MobileNav } from "@/components/MobileNav";
import { NavLinks } from "@/components/NavLinks";

export function Header() {
  return (
    <header
      className="sticky top-0 z-40 border-b border-d-ink bg-d-bg font-d-sans text-d-ink"
      style={{ viewTransitionName: "site-header" }}
    >
      <div className="flex h-[72px] items-center justify-between px-5 md:grid md:grid-cols-[1fr_auto_1fr] md:px-10">
        <NavLinks />
        <Link href="/" className="d-fade text-[26px] leading-none tracking-[-0.02em] md:justify-self-center">
          Finder
        </Link>
        <div className="flex items-center justify-end gap-7 text-sm">
          <SearchTrigger />
          <CartLink />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
