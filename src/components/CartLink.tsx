"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export function CartLink() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/carrito"
      className="relative rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-amber-dark"
    >
      Carrito
      {itemCount > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1 text-xs font-bold text-cream">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
