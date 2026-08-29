"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export function CartLink() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/carrito"
      className="rounded-lg bg-navy px-5 py-2.5 font-heading text-sm font-bold text-white transition-colors hover:bg-navy-deep"
    >
      Carrito · {itemCount}
    </Link>
  );
}
