"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/products";
import { setShipmentActualShippingCost } from "../actions";

export function ShipmentActualShippingCost({
  shipmentId,
  actualShippingCost,
}: {
  shipmentId: string;
  actualShippingCost: number | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(actualShippingCost?.toString() ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!editing) {
    return (
      <div className="flex items-center justify-between">
        <p className="mt-1 font-medium text-ink">
          {actualShippingCost != null ? formatPrice(actualShippingCost) : "—"}
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs font-semibold text-blue hover:text-navy"
        >
          Editar
        </button>
      </div>
    );
  }

  return (
    <div className="mt-1 flex flex-col gap-1.5">
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
              const res = await setShipmentActualShippingCost(shipmentId, value);
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
