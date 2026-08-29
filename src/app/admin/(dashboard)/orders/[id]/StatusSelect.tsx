"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "../actions";
import { orderStatuses } from "@/lib/validation";
import { orderStatusLabels } from "@/lib/order-status";

export function StatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold text-ink" htmlFor="status">
        Cambiar estado
      </label>
      <select
        id="status"
        defaultValue={currentStatus}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          if (
            next === "cancelled" &&
            !confirm("Cancelar el pedido repone el stock reservado. ¿Confirmás?")
          ) {
            e.target.value = currentStatus;
            return;
          }
          startTransition(async () => {
            const res = await updateOrderStatus(orderId, next);
            if (res.error) {
              setError(res.error);
              return;
            }
            setError(null);
            router.refresh();
          });
        }}
        className="w-fit rounded-lg border border-border-input bg-bg px-3 py-2 text-sm outline-none focus:border-amber"
      >
        {orderStatuses.map((s) => (
          <option key={s} value={s}>
            {orderStatusLabels[s]}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-err-ink">{error}</p>}
    </div>
  );
}
