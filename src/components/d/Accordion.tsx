"use client";

import { useId, useState } from "react";

// Hairline accordion row: the panel grows via grid-template-rows and the plus
// sign rotates into a minus (reference product page details).
export function AccordionItem({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <div className="border-t border-d-ink">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="d-acc-trigger flex w-full items-center justify-between py-4 text-left text-sm"
      >
        {title}
        <span className="d-acc-icon" aria-hidden="true" />
      </button>
      <div id={id} className="d-acc-panel" data-open={open}>
        <div>
          <div className="pb-5 text-sm/[1.6] text-d-muted">{children}</div>
        </div>
      </div>
    </div>
  );
}
