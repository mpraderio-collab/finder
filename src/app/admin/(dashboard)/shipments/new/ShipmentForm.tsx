"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/products";
import { createShipment, type ShipmentActionState } from "../actions";

type OrderOption = {
  id: string;
  code: string;
  customerName: string;
  channel: string;
  itemCount: number;
  total: number;
  createdAt: string;
};

const initialState: ShipmentActionState = {};

export function ShipmentForm({ orders }: { orders: OrderOption[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createShipment, initialState);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (state.shipmentId) router.push(`/admin/shipments/${state.shipmentId}`);
  }, [state.shipmentId, router]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedOrders = orders.filter((o) => selected.has(o.id));
  const selectedTotal = selectedOrders.reduce((sum, o) => sum + o.total, 0);

  if (orders.length === 0) {
    return (
      <p className="text-ink-soft">
        No hay pedidos pagados pendientes de envío para agrupar ahora mismo.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
      <div className="overflow-x-auto rounded-xl border border-line bg-bg">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line">
            <tr>
              <th className="px-4 py-3" />
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                Pedido
              </th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                Cliente
              </th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                Canal
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                Ítems
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="cursor-pointer border-b border-line-soft last:border-0 hover:bg-surface"
                onClick={() => toggle(order.id)}
              >
                <td className="px-4 py-2.5">
                  <input
                    type="checkbox"
                    name="orderIds"
                    value={order.id}
                    checked={selected.has(order.id)}
                    onChange={() => toggle(order.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4"
                  />
                </td>
                <td className="px-4 py-2.5 font-heading font-bold text-navy">
                  #{order.code}
                </td>
                <td className="px-4 py-2.5 text-ink">{order.customerName}</td>
                <td className="px-4 py-2.5 text-ink-soft">
                  {order.channel === "manual" ? "Venta manual" : "Web"}
                </td>
                <td className="px-4 py-2.5 text-right text-ink-soft">{order.itemCount}</td>
                <td className="px-4 py-2.5 text-right font-medium text-ink">
                  {formatPrice(order.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
          <span className="text-ink-soft">{selected.size} pedido(s) elegidos</span>
          <span className="font-heading font-bold text-navy">
            Total: {formatPrice(selectedTotal)}
          </span>
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border border-line bg-bg p-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Transporte (opcional)</span>
          <input
            name="shippingMethod"
            placeholder="Ej: Correo Argentino, moto propia"
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">
            Código de seguimiento (opcional)
          </span>
          <input name="trackingCode" placeholder="Ej: CA123456789AR" className="input" />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-ink">Nota (opcional)</span>
          <textarea
            name="note"
            rows={2}
            placeholder="Ej: sale con el reparto de la tarde"
            className="input"
          />
        </label>
      </div>

      {state.error && (
        <p className="rounded-lg bg-err-bg px-3 py-2 text-sm text-err-ink">{state.error}</p>
      )}

      <div>
        <button
          type="submit"
          disabled={selected.size === 0 || pending}
          className="w-fit rounded-lg bg-navy px-6 py-2.5 font-heading text-sm font-bold text-white disabled:opacity-40"
        >
          {pending
            ? "Guardando…"
            : `Marcar ${selected.size || ""} pedido(s) como enviados`}
        </button>
      </div>

      <style jsx global>{`
        .input {
          border-radius: 0.5rem;
          border: 1px solid var(--color-border-input);
          background: var(--color-bg);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: var(--color-amber);
        }
      `}</style>
    </form>
  );
}
