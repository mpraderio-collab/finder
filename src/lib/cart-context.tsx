"use client";

import { useMemo, useSyncExternalStore } from "react";
import { calculateLineTotals, type PromotionInfo } from "@/lib/promotions";
import { getSessionId } from "@/lib/analytics";
import { syncCartOrder } from "@/app/cart-actions";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image?: string;
  variantName?: string;
  quantity: number;
  maxStock: number;
  promotion?: PromotionInfo | null;
};

// Agrupa por promoción para combinar productos distintos de una misma
// promo (mix and match) — ver lib/promotions.ts.
export function cartLineTotals(items: CartItem[]): Map<string, number> {
  return calculateLineTotals(
    items.map((i) => ({
      key: cartItemKey(i.productId, i.variantName),
      unitPrice: i.price,
      quantity: i.quantity,
      promotion: i.promotion ?? null,
    })),
  );
}

const STORAGE_KEY = "finder-cart-v1";
const EMPTY_CART: CartItem[] = [];

export function cartItemKey(productId: string, variantName?: string) {
  return `${productId}::${variantName ?? ""}`;
}

let cartState: CartItem[] = EMPTY_CART;
let hydrated = false;
const listeners = new Set<() => void>();

function readStoredCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(next: CartItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Si falla el guardado (modo privado, storage lleno), el carrito sigue
    // funcionando en memoria para el resto de la sesión.
  }
}

// Best-effort: refleja el carrito en un pedido "cart" en la base (para que
// el admin pueda ver carritos activos/abandonados). Nunca debe bloquear ni
// romper la experiencia de compra si falla o tarda.
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
function scheduleCartSync(next: CartItem[]) {
  if (typeof window === "undefined") return;
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    const sessionId = getSessionId();
    if (!sessionId) return;
    syncCartOrder(
      sessionId,
      next.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        variantName: i.variantName,
      })),
    ).catch(() => {});
  }, 500);
}

function setCart(next: CartItem[]) {
  cartState = next;
  persist(next);
  scheduleCartSync(next);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cartState = readStoredCart();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  if (!hydrated) {
    cartState = readStoredCart();
    hydrated = true;
  }
  return cartState;
}

function getServerSnapshot() {
  return EMPTY_CART;
}

export function addCartItem(item: Omit<CartItem, "quantity">, quantity: number) {
  const key = cartItemKey(item.productId, item.variantName);
  const existing = cartState.find(
    (i) => cartItemKey(i.productId, i.variantName) === key,
  );
  const maxStock = Math.max(0, item.maxStock);

  if (existing) {
    const nextQty = Math.min(existing.quantity + quantity, maxStock);
    setCart(
      cartState.map((i) =>
        cartItemKey(i.productId, i.variantName) === key
          ? { ...i, quantity: nextQty, maxStock }
          : i,
      ),
    );
    return;
  }

  const clampedQty = Math.min(Math.max(quantity, 1), maxStock);
  if (clampedQty <= 0) return;
  setCart([...cartState, { ...item, maxStock, quantity: clampedQty }]);
}

export function updateCartQuantity(key: string, quantity: number) {
  setCart(
    cartState
      .map((i) =>
        cartItemKey(i.productId, i.variantName) === key
          ? { ...i, quantity: Math.min(Math.max(quantity, 1), i.maxStock) }
          : i,
      )
      .filter((i) => i.quantity > 0),
  );
}

export function removeCartItem(key: string) {
  setCart(cartState.filter((i) => cartItemKey(i.productId, i.variantName) !== key));
}

export function clearCart() {
  setCart([]);
}

// CartProvider ya no es necesario funcionalmente (el estado vive en un store
// externo al árbol de React), pero se mantiene para no forzar un cambio en
// el layout raíz si en el futuro se necesita envolver el árbol.
export function CartProvider({ children }: { children: React.ReactNode }) {
  return children;
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );
  const lineTotals = useMemo(() => cartLineTotals(items), [items]);
  const subtotal = useMemo(
    () => Array.from(lineTotals.values()).reduce((sum, v) => sum + v, 0),
    [lineTotals],
  );

  return {
    items,
    addItem: addCartItem,
    updateQuantity: updateCartQuantity,
    removeItem: removeCartItem,
    clear: clearCart,
    itemCount,
    subtotal,
    lineTotals,
  };
}
