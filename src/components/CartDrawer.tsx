"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { cartItemKey, useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/products";

// UI-only open/closed state for the drawer, shared by the header button and
// the add-to-cart actions. Cart contents still live in lib/cart-context.
let drawerOpen = false;
const listeners = new Set<() => void>();

function setDrawer(next: boolean) {
  drawerOpen = next;
  listeners.forEach((l) => l());
}

export function openCartDrawer() {
  setDrawer(true);
}

export function closeCartDrawer() {
  setDrawer(false);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function useDrawerOpen() {
  return useSyncExternalStore(
    subscribe,
    () => drawerOpen,
    () => false,
  );
}

export function CartDrawer() {
  const open = useDrawerOpen();
  const pathname = usePathname();
  const router = useRouter();
  const { items, itemCount, subtotal, lineTotals, updateQuantity, removeItem } = useCart();

  // Navigating away always closes it.
  useEffect(() => {
    closeCartDrawer();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeCartDrawer();
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/checkout")) return null;

  // Progress toward the next promotion tier, shown from the promo data each
  // cart line already carries (same tiers the price calculation uses).
  const promo = items.find((i) => i.promotion && i.promotion.tiers.length > 0)?.promotion ?? null;
  const promoQuantity = promo
    ? items
        .filter((i) => i.promotion?.id === promo.id)
        .reduce((sum, i) => sum + i.quantity, 0)
    : 0;
  const nextTier =
    promo && promo.triggerType === "quantity"
      ? promo.tiers.find((t) => t.threshold > promoQuantity)
      : undefined;
  const topThreshold = promo ? Math.max(...promo.tiers.map((t) => t.threshold)) : 0;
  const rawSubtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const savings = rawSubtotal - subtotal;

  return (
    <div className="font-d-sans text-d-ink">
      <div
        className="d-scrim fixed inset-0 z-[60] bg-d-ink/40"
        data-open={open}
        onClick={closeCartDrawer}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrito"
        inert={!open}
        className="t-panel-slide fixed inset-y-0 right-0 z-[61] flex w-full max-w-[480px] flex-col border-l border-d-ink bg-d-bg"
        data-open={open}
      >
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-d-ink px-6">
          <p className="text-lg">Carrito ({itemCount})</p>
          <button type="button" onClick={closeCartDrawer} className="d-fade text-sm">
            Cerrar
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-start gap-5 px-6 py-10">
            <p className="text-sm">Tu carrito está vacío.</p>
            <Link href="/catalogo" className="d-cta text-sm" onClick={closeCartDrawer}>
              Ver el catálogo
            </Link>
          </div>
        ) : (
          <>
            {promo && topThreshold > 0 && (
              <div className="border-b border-d-line px-6 py-4">
                <p className="text-sm">
                  {nextTier
                    ? `Sumá ${nextTier.threshold - promoQuantity} ${nextTier.threshold - promoQuantity === 1 ? "pieza" : "piezas"} más y obtené ${nextTier.percentOff}% off`
                    : "Descuento del set aplicado"}
                </p>
                <div className="mt-3 flex gap-1" aria-hidden="true">
                  {Array.from({ length: topThreshold }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-[2px] flex-1 transition-colors duration-[var(--d-dur)] ${
                        i < promoQuantity ? "bg-d-ink" : "bg-d-line"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            <ul className="flex-1 overflow-y-auto px-6">
              {items.map((item) => {
                const key = cartItemKey(item.productId, item.variantName);
                const lineTotal = lineTotals.get(key) ?? item.price * item.quantity;
                return (
                  <li key={key} className="flex gap-4 border-b border-d-line py-5">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden bg-d-surface">
                      {item.image && (
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="96px" />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                      <div className="flex justify-between gap-3">
                        <Link
                          href={`/catalogo/${item.slug}`}
                          onClick={closeCartDrawer}
                          className="d-fade leading-snug"
                        >
                          {item.name}
                        </Link>
                        <span className="shrink-0">{formatPrice(lineTotal)}</span>
                      </div>
                      {item.variantName && <p className="text-d-muted">{item.variantName}</p>}
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => updateQuantity(key, item.quantity - 1)}
                            aria-label="Restar cantidad"
                            className="d-fade"
                          >
                            −
                          </button>
                          <span className="min-w-4 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(key, item.quantity + 1)}
                            disabled={item.quantity >= item.maxStock}
                            aria-label="Sumar cantidad"
                            className="d-fade disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(key)}
                          className="d-fade text-d-muted underline underline-offset-2"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="shrink-0 border-t border-d-ink px-6 py-5">
              {savings > 0 && (
                <div className="flex justify-between text-sm text-d-muted">
                  <span>Descuento del set</span>
                  <span>−{formatPrice(savings)}</span>
                </div>
              )}
              <div className="mt-1 flex justify-between text-sm">
                <span>Envío</span>
                <span className="text-d-muted">Se calcula al finalizar</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-sm">Subtotal</span>
                <span className="font-d-serif text-[28px]">{formatPrice(subtotal)}</span>
              </div>
              <button
                type="button"
                onClick={() => router.push("/checkout")}
                className="d-btn mt-4 w-full"
              >
                Finalizar compra
              </button>
              <p className="mt-3 text-center text-xs text-d-muted">
                Pagás con Mercado Pago · tarjeta, cuotas o dinero en cuenta ·{" "}
                <Link href="/carrito" onClick={closeCartDrawer} className="underline underline-offset-2">
                  Ver carrito
                </Link>
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
