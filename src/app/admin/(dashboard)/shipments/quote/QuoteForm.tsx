"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/products";
import { calculateMargin } from "@/lib/margin";
import { orderStatusColors, orderStatusLabels } from "@/lib/order-status";

type OrderOption = {
  id: string;
  code: string;
  customerName: string;
  channel: string;
  status: string;
  itemCount: number;
  total: number;
  cogs: number;
  createdAt: string;
};

export function QuoteForm({ orders }: { orders: OrderOption[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shippingCost, setShippingCost] = useState("10500");

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedOrders = orders.filter((o) => selected.has(o.id));
  const revenue = selectedOrders.reduce((sum, o) => sum + o.total, 0);
  const cogs = selectedOrders.reduce((sum, o) => sum + o.cogs, 0);
  const parsedShippingCost = useMemo(() => {
    const n = Number(shippingCost);
    return Number.isFinite(n) && shippingCost.trim() !== "" ? n : 0;
  }, [shippingCost]);
  const margin = calculateMargin(revenue, cogs, parsedShippingCost);

  if (orders.length === 0) {
    return (
      <p className="text-ink-soft">
        No hay ventas ni borradores para incluir en un presupuesto ahora
        mismo.
      </p>
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="overflow-x-auto rounded-xl border border-line bg-bg">
        <table className="w-full min-w-[720px] text-left text-sm">
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
                Estado
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
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${orderStatusColors[order.status]}`}
                  >
                    {orderStatusLabels[order.status]}
                  </span>
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
            Total: {formatPrice(revenue)}
          </span>
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border border-line bg-bg p-5 sm:grid-cols-[1fr_auto]">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">
            Costo de envío cotizado
          </span>
          <input
            type="number"
            min={0}
            value={shippingCost}
            onChange={(e) => setShippingCost(e.target.value)}
            placeholder="Ej: 10500"
            className="w-full rounded-lg border border-border-input bg-bg px-2.5 py-1.5 text-sm outline-none focus:border-amber sm:w-48"
          />
        </label>
      </div>

      <div className="rounded-xl border border-line bg-bg p-5">
        <p className="text-sm font-semibold text-navy">Rentabilidad estimada</p>
        <dl className="mt-3 space-y-2 text-sm text-ink-soft">
          <div className="flex justify-between">
            <dt>Total de la venta</dt>
            <dd className="text-ink">{formatPrice(revenue)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Costo de mercadería</dt>
            <dd className="text-ink">{formatPrice(cogs)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Costo de envío cotizado</dt>
            <dd className="text-ink">{formatPrice(parsedShippingCost)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2">
            <dt className="font-semibold text-ink">Margen total</dt>
            <dd
              className={`font-heading text-lg font-extrabold ${margin < 0 ? "text-err-ink" : "text-navy"}`}
            >
              {formatPrice(margin)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
