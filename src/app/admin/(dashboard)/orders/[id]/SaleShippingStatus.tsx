"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setSaleState, setShippingState } from "../actions";
import {
  manualSaleStates,
  onlineSaleStates,
  saleStateLabels,
  shippingStateLabels,
  type SaleState,
  type ShippingState,
} from "@/lib/order-status";

const selectClass =
  "w-fit rounded-lg border border-border-input bg-bg px-3 py-2 text-sm outline-none focus:border-amber disabled:opacity-50";

// Dos selectores independientes: el estado de la venta (cobro / cancelación) y
// el estado del envío. Cada uno cambia solo lo suyo.
export function SaleShippingStatus({
  orderId,
  channel,
  saleState,
  shippingState,
}: {
  orderId: string;
  channel: string;
  saleState: SaleState;
  shippingState: ShippingState;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const saleOptions = channel === "manual" ? manualSaleStates : onlineSaleStates;

  function run(action: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      const res = await action();
      setError(res.error ?? null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-start justify-end gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-ink" htmlFor="sale-state">
          Estado de la venta
        </label>
        <select
          id="sale-state"
          value={saleState}
          disabled={pending}
          onChange={(e) => {
            const next = e.target.value;
            if (
              next === "cancelled" &&
              !confirm("Cancelar el pedido repone el stock reservado. ¿Confirmás?")
            ) {
              return;
            }
            if (
              channel === "online" &&
              (next === "pending" || next === "failed") &&
              shippingState === "shipped" &&
              !confirm("El pedido figura como enviado. Al cambiar el estado del pago vuelve a \"Sin enviar\". ¿Confirmás?")
            ) {
              return;
            }
            run(() => setSaleState(orderId, next));
          }}
          className={selectClass}
        >
          {saleOptions.map((s) => (
            <option key={s} value={s}>
              {saleStateLabels[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-ink" htmlFor="shipping-state">
          Estado del envío
        </label>
        <select
          id="shipping-state"
          value={shippingState}
          disabled={pending || saleState === "cancelled" || saleState === "failed"}
          onChange={(e) => run(() => setShippingState(orderId, e.target.value === "shipped"))}
          className={selectClass}
        >
          {(Object.keys(shippingStateLabels) as ShippingState[]).map((s) => (
            <option key={s} value={s}>
              {shippingStateLabels[s]}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="basis-full text-right text-xs text-err-ink">{error}</p>}
    </div>
  );
}
