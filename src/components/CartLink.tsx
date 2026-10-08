"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/lib/cart-context";
import { openCartDrawer } from "@/components/CartDrawer";

export function CartLink() {
  const { itemCount } = useCart();
  const groupRef = useRef<HTMLSpanElement>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    // No replay on first paint — only animate when the count actually
    // changes, per transitions-dev's number pop-in.
    const shouldAnimate = !isFirstRun.current;
    isFirstRun.current = false;

    group.classList.remove("is-animating");
    group.replaceChildren();
    const chars = String(itemCount).split("");
    chars.forEach((ch, i) => {
      const span = document.createElement("span");
      span.className = "t-digit";
      span.textContent = ch;
      if (i === chars.length - 2) span.dataset.stagger = "1";
      else if (i === chars.length - 1) span.dataset.stagger = "2";
      group.appendChild(span);
    });

    if (shouldAnimate) {
      void group.offsetHeight; // reflow so the animation replays
      group.classList.add("is-animating");
    }
  }, [itemCount]);

  return (
    <button type="button" onClick={openCartDrawer} className="d-fade whitespace-nowrap">
      Carrito (<span ref={groupRef} className="t-digit-group">{itemCount}</span>)
    </button>
  );
}
