"use client";

import { useEffect } from "react";
import { clearCart } from "@/lib/cart-context";

export function ClearCartOnMount() {
  useEffect(() => {
    clearCart();
  }, []);
  return null;
}
