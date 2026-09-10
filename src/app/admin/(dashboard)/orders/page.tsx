import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { orderStatusColors, orderStatusLabels } from "@/lib/order-status";

export default async function AdminOrdersPage(
  props: PageProps<"/admin/orders">,
) {
  const searchParams = await props.searchParams;
  const statusFilter =
    typeof searchParams?.status === "string" ? searchParams.status : undefined;

  const orders = await db.order.findMany({
    where: {
      channel: "online",
      // Sin filtro, "Todos" no incluye los carritos sin terminar — para
      // eso está la pestaña "Carritos" aparte.
      status: statusFilter ?? { not: "cart" },
    },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const statuses = ["pending", "paid", "shipped", "cancelled", "failed", "cart"];

  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-navy">
        Pedidos
      </h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`rounded-full px-3 py-1.5 font-heading text-xs font-bold ${
            !statusFilter
              ? "bg-navy text-white"
              : "border border-border-btn bg-bg text-ink-soft"
          }`}
        >
          Todos
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`rounded-full px-3 py-1.5 font-heading text-xs font-bold ${
              statusFilter === s
                ? "bg-navy text-white"
                : "border border-border-btn bg-bg text-ink-soft"
            }`}
          >
            {orderStatusLabels[s]}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="mt-10 text-ink-soft">No hay pedidos para mostrar.</p>
      ) : (
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
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Fecha
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3 font-heading font-bold text-navy">
                    #{order.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">
                      {order.customerName || "Visitante anónimo"}
                    </p>
                    {order.customerEmail && (
                      <p className="text-xs text-ink-faint">{order.customerEmail}</p>
                    )}
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
                  <td className="px-4 py-3 text-ink-soft">
                    {order.createdAt.toLocaleDateString("es-AR")}
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
      )}
    </div>
  );
}
