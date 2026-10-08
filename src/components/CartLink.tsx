"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/lib/cart-context";
import { openCartDrawer } from "@/lib/cart-drawer";
import { BagIcon } from "@/components/store/Icons";

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
    <button
      type="button"
      onClick={openCartDrawer}
      aria-label={`Abrir carrito (${itemCount})`}
      className="flex h-9 items-center gap-1.5 rounded-full px-2 text-e-ink transition-colors hover:bg-e-tile"
    >
      <BagIcon size={18} />
      <span className="e-mono tabular-nums">
        <span ref={groupRef} className="t-digit-group">
          {itemCount}
        </span>
      </span>
    </button>
  );
}
