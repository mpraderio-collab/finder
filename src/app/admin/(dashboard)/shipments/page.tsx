import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { calculateCogs, calculateMargin } from "@/lib/margin";

export default async function AdminShipmentsPage() {
  const shipments = await db.shipment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      orders: { include: { items: { include: { product: true } } } },
    },
  });

  const rows = shipments.map((s) => {
    const revenue = s.orders.reduce((sum, o) => sum + o.total, 0);
    const cogs = s.orders.reduce(
      (sum, o) => sum + calculateCogs(o.items),
      0,
    );
    const margin = calculateMargin(revenue, cogs, s.actualShippingCost);
    return {
      id: s.id,
      createdAt: s.createdAt,
      shippingMethod: s.shippingMethod,
      trackingCode: s.trackingCode,
      actualShippingCost: s.actualShippingCost,
      orderCount: s.orders.length,
      margin,
    };
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-extrabold text-navy">
          Envíos
        </h1>
        <div className="flex gap-2">
          <Link
            href="/admin/shipments/quote"
            className="rounded-lg border border-line bg-bg px-5 py-2.5 font-heading text-sm font-bold text-navy hover:bg-surface"
          >
            Presupuestar envío
          </Link>
          <Link
            href="/admin/shipments/new"
            className="rounded-lg bg-navy px-5 py-2.5 font-heading text-sm font-bold text-white hover:bg-navy-deep"
          >
            + Agrupar pedidos
          </Link>
        </div>
      </div>
      <p className="mt-1 max-w-xl text-sm text-ink-soft">
        Pedidos de distintos clientes (web o ventas manuales) agrupados para
        salir juntos en un mismo despacho.
      </p>

      {rows.length === 0 ? (
        <p className="mt-10 text-ink-soft">Todavía no agrupaste ningún envío.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Fecha
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Transporte
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Código
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Pedidos
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Costo envío
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Margen
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3 text-ink-soft">
                    {s.createdAt.toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-4 py-3 text-ink">{s.shippingMethod || "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">{s.trackingCode || "—"}</td>
                  <td className="px-4 py-3 text-right text-ink-soft">
                    {s.orderCount}
                  </td>
                  <td className="px-4 py-3 text-right text-ink-soft">
                    {s.actualShippingCost != null ? formatPrice(s.actualShippingCost) : "—"}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${s.margin < 0 ? "text-err-ink" : "text-navy"}`}
                  >
                    {formatPrice(s.margin)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/shipments/${s.id}`}
                      className="font-heading text-sm font-bold text-blue hover:text-navy"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
