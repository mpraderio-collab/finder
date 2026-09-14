import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { orderStatusColors, orderStatusLabels } from "@/lib/order-status";

export default async function ShipmentDetailPage(
  props: PageProps<"/admin/shipments/[id]">,
) {
  const { id } = await props.params;

  const shipment = await db.shipment.findUnique({
    where: { id },
    include: { orders: { include: { items: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!shipment) notFound();

  return (
    <div>
      <p className="text-sm text-ink-faint">
        <Link href="/admin/shipments" className="hover:text-navy">
          Envíos
        </Link>{" "}
        / <span className="text-ink">{shipment.createdAt.toLocaleDateString("es-AR")}</span>
      </p>
      <h1 className="mt-1 font-heading text-2xl font-extrabold text-navy">
        Envío del {shipment.createdAt.toLocaleDateString("es-AR")}
      </h1>

      <div className="mt-4 grid max-w-xl gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-bg p-4">
          <p className="text-xs text-ink-soft">Transporte</p>
          <p className="mt-1 font-medium text-ink">{shipment.shippingMethod || "—"}</p>
        </div>
        <div className="rounded-xl border border-line bg-bg p-4">
          <p className="text-xs text-ink-soft">Código de seguimiento</p>
          <p className="mt-1 font-medium text-ink">{shipment.trackingCode || "—"}</p>
        </div>
      </div>

      {shipment.note && (
        <p className="mt-4 max-w-xl text-sm text-ink-soft">
          <span className="font-semibold text-ink">Nota:</span> {shipment.note}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line">
            <tr>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                Pedido
              </th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                Cliente
              </th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                Ítems
              </th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                Total
              </th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                Estado
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {shipment.orders.map((order) => (
              <tr key={order.id} className="border-b border-line-soft last:border-0">
                <td className="px-4 py-3 font-heading font-bold text-navy">
                  #{order.id.slice(-6).toUpperCase()}
                </td>
                <td className="px-4 py-3 text-ink">
                  {order.customerName || "Visitante anónimo"}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {order.items.reduce((n, i) => n + i.quantity, 0)}
                </td>
                <td className="px-4 py-3 font-medium text-ink">
                  {formatPrice(order.total)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold ${orderStatusColors[order.status]}`}
                  >
                    {orderStatusLabels[order.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/orders/${order.id}`}
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
    </div>
  );
}
