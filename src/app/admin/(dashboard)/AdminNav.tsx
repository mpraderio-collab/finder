"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Productos" },
  { href: "/admin/promotions", label: "Promociones" },
  { href: "/admin/coupons", label: "Cupones" },
  { href: "/admin/reviews", label: "Reseñas" },
  { href: "/admin/orders", label: "Pedidos" },
  { href: "/admin/sales", label: "Ventas manuales" },
  { href: "/admin/shipments", label: "Envíos" },
  { href: "/admin/customers", label: "Clientes" },
  { href: "/admin/purchases", label: "Compras" },
  { href: "/admin/settings", label: "Configuración" },
  { href: "/admin/account", label: "Mi cuenta" },
];

export function AdminNav({ pendingReviewCount = 0 }: { pendingReviewCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {navLinks.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname?.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
              active
                ? "bg-white/12 font-heading font-bold text-white"
                : "font-medium text-white/78 hover:bg-white/12 hover:text-white"
            }`}
          >
            {link.label}
            {link.href === "/admin/reviews" && pendingReviewCount > 0 && (
              <span className="rounded-full bg-amber px-1.5 py-0.5 text-[11px] font-bold text-navy-deep">
                {pendingReviewCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
