"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleCouponActive, deleteCoupon } from "./actions";

export function CouponRowActions({ id, name, active }: { id: string; name: string; active: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await toggleCouponActive(id, !active);
              if (res.error) setError(res.error);
              router.refresh();
            })
          }
          className="text-sm font-semibold text-blue hover:text-navy disabled:opacity-50"
        >
          {active ? "Desactivar" : "Activar"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              if (!confirm(`¿Borrar el cupón "${name}"?`)) return;
              const res = await deleteCoupon(id);
              if (res.error) setError(res.error);
              router.refresh();
            })
          }
          className="text-sm font-semibold text-err-ink hover:text-err-ink/80 disabled:opacity-50"
        >
          Borrar
        </button>
      </div>
      {error && <span className="text-xs text-err-ink">{error}</span>}
    </div>
  );
}
