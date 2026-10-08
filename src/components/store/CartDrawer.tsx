"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { cartItemKey, useCart } from "@/lib/cart-context";
import { onCartDrawerOpen } from "@/lib/cart-drawer";
import { formatPrice } from "@/lib/products";
import { CloseIcon } from "@/components/store/Icons";
import { PromoProgress } from "@/components/store/PromoProgress";
import { QuantityPill } from "@/components/store/QuantityPill";
import { usePresence } from "@/components/store/usePresence";

// Cart drawer (maap.cc pattern): slides in from the right over a dimmed page.
// Uses the same cart store as /carrito and /checkout.
export function CartDrawer() {
  const { items, itemCount, subtotal, lineTotals, updateQuantity, removeItem } = useCart();
  const { state, open, close } = usePresence("--e-drawer-out");

  useEffect(() => onCartDrawerOpen(open), [open]);

  if (state === "closed") return null;

  const rawSubtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const promoSavings = rawSubtotal - subtotal;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Carrito">
      <div
        data-state={state}
        className="e-drawer-overlay absolute inset-0 bg-black/50"
        onClick={close}
      />
      <aside
        data-state={state}
        className="e-drawer-panel absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col bg-e-bg text-e-ink"
      >
        <div className="flex items-center justify-between border-b border-e-line px-6 py-5">
          <span className="e-mono">Carrito ({itemCount})</span>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar carrito"
            className="-mr-2.5 grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-e-tile"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-[28px] font-medium leading-tight">Tu carrito está vacío</p>
            <p className="text-sm text-e-muted">Explorá el catálogo y encontrá tu próxima luz.</p>
            <Link href="/catalogo" onClick={close} className="e-pill e-pill--dark">
              Ver catálogo
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-e-line px-6 py-5">
              <PromoProgress items={items} />
            </div>

            <ul className="flex-1 divide-y divide-e-line overflow-y-auto px-6">
              {items.map((item) => {
                const key = cartItemKey(item.productId, item.variantName);
                const lineTotal = lineTotals.get(key) ?? item.price * item.quantity;
                return (
                  <li key={key} className="flex gap-4 py-5">
                    <Link
                      href={`/catalogo/${item.slug}`}
                      onClick={close}
                      className="relative h-[112px] w-[96px] shrink-0 overflow-hidden bg-e-tile"
                    >
                      {item.image && (
                        <Image src={item.image} alt={item.name} fill className="object-contain" sizes="96px" />
                      )}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[14px] leading-snug">{item.name}</p>
                          {item.variantName && (
                            <p className="e-mono mt-1 text-e-muted">{item.variantName}</p>
                          )}
                        </div>
                        <span className="shrink-0 text-[14px] tabular-nums">{formatPrice(lineTotal)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <QuantityPill
                          size="sm"
                          value={item.quantity}
                          onDecrement={() => updateQuantity(key, item.quantity - 1)}
                          onIncrement={() => updateQuantity(key, item.quantity + 1)}
                          canDecrement={item.quantity > 1}
                          canIncrement={item.quantity < item.maxStock}
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(key)}
                          className="text-[12px] text-e-muted underline underline-offset-4 transition-colors hover:text-e-ink"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-col gap-3 border-t border-e-line px-6 py-5">
              {promoSavings > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-e-muted">Promo aplicada</span>
                  <span className="tabular-nums">−{formatPrice(promoSavings)}</span>
                </div>
              )}
              <div className="flex justify-between text-[13px]">
                <span className="text-e-muted">Envío</span>
                <span className="text-e-muted">Se calcula al finalizar</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="e-mono">Subtotal</span>
                <span className="text-[20px] font-medium tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <Link href="/checkout" onClick={close} className="e-pill e-pill--dark mt-1 w-full">
                Finalizar compra
              </Link>
              <Link href="/carrito" onClick={close} className="e-pill e-pill--outline w-full">
                Ver carrito
              </Link>
              <p className="text-center text-[12px] text-e-muted">
                Pagás con Mercado Pago · Cambios en 30 días
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
