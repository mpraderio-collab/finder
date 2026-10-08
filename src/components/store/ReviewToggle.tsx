"use client";

import { useState } from "react";
import { ReviewForm } from "@/components/ReviewForm";

// Botón "Dejá tu reseña" que despliega el formulario con el "panel reveal"
// de transitions-dev (sube, se aclara y se enfoca).
export function ReviewToggle({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="review-form"
        className="b-btn b-btn-outline w-fit !px-[22px] !py-[14px] !text-sm"
      >
        {open ? "Cerrar" : "Dejá tu reseña"}
      </button>
      <div
        id="review-form"
        className={`grid transition-[grid-template-rows] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div
            data-open={open}
            inert={!open}
            className="t-panel-slide pb-1 [--panel-translate-y:24px]"
          >
            <ReviewForm productId={productId} />
          </div>
        </div>
      </div>
    </div>
  );
}
