"use client";

import { dismissCartNotices, useCartNotices } from "@/lib/cart-context";

// Avisos de lo que cambió al poner el carrito al día (precio, promoción,
// stock). Se quedan hasta que el cliente los cierra.
export function CartNotices() {
  const notices = useCartNotices();
  if (notices.length === 0) return null;

  return (
    <div role="status" className="flex items-start justify-between gap-4 bg-e-tile px-4 py-3 text-[13px] text-e-ink">
      <div className="flex flex-col gap-1">
        <span className="e-mono text-e-muted">Actualizamos tu carrito</span>
        {notices.map((n) => (
          <p key={n}>{n}</p>
        ))}
      </div>
      <button
        type="button"
        onClick={dismissCartNotices}
        className="shrink-0 underline underline-offset-4 hover:text-e-muted"
      >
        Entendido
      </button>
    </div>
  );
}
