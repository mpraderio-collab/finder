"use client";

// UI-only signal to open the cart drawer from anywhere (header button, "add
// to cart"). The cart state itself still lives in lib/cart-context.
const EVENT = "finder:cart-drawer";

export function openCartDrawer() {
  window.dispatchEvent(new Event(EVENT));
}

export function onCartDrawerOpen(listener: () => void) {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
