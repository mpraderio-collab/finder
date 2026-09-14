"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/products";
import { setActualShippingCost } from "../actions";

export function ActualShippingCost({
  orderId,
  actualShippingCost,
}: {
  orderId: string;
  actualShippingCost: number | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(actualShippingCost?.toString() ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!editing) {
    return actualShippingCost != null ? (
      <div className="flex items-center justify-between">
        <dd className="text-ink">{formatPrice(actualShippingCost)}</dd>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs font-semibold text-blue hover:text-navy"
        >
          Editar
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-sm font-semibold text-blue hover:text-navy"
      >
        + Cargar costo real
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ej: 10500"
          className="w-full rounded-lg border border-border-input bg-bg px-2.5 py-1.5 text-sm outline-none focus:border-amber"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await setActualShippingCost(orderId, value);
              if (res.error) {
                setError(res.error);
                return;
              }
              setError(null);
              setEditing(false);
              router.refresh();
            })
          }
          className="shrink-0 rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {pending ? "…" : "Guardar"}
        </button>
      </div>
      {error && <p className="text-xs text-err-ink">{error}</p>}
    </div>
  );
}
