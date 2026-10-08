"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const noop = () => () => {};

// Overlays opened from the sticky header (menu, search) render into <body> so
// they escape the header's stacking context and sit above everything else.
export function BodyPortal({ children }: { children: React.ReactNode }) {
  const isClient = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  if (!isClient) return null;
  return createPortal(children, document.body);
}
