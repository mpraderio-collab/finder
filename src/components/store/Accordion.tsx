"use client";

import { useId, useState } from "react";
import { MinusIcon, PlusIcon } from "@/components/store/Icons";

// maap.cc accordion: hairline rows, plus/minus crossfade, height eased with
// cubic-bezier(0.87, 0, 0.13, 1) over 300ms (see .e-accordion in globals.css).
export function Accordion({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className="e-accordion border-b border-e-line" data-open={open}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="relative flex w-full items-center justify-between py-4 pr-8 text-left"
      >
        <span className="e-mono">{title}</span>
        <span className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2">
          <PlusIcon size={16} className="e-accordion-icon e-accordion-icon--plus absolute inset-0" />
          <MinusIcon size={16} className="e-accordion-icon e-accordion-icon--minus absolute inset-0" />
        </span>
      </button>
      <div id={panelId} className="e-accordion-panel" role="region">
        <div>
          <div className="pb-5 text-[14px]/[1.6] text-e-ink">{children}</div>
        </div>
      </div>
    </div>
  );
}
