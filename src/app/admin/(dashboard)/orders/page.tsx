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
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const statuses = ["pending", "paid", "shipped", "cancelled", "failed"];

  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-ink">
        Pedidos
      </h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            !statusFilter ? "bg-ink text-cream" : "bg-card text-ink-soft border border-line"
          }`}
        >
          Todos
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              statusFilter === s ? "bg-ink text-cream" : "bg-card text-ink-soft border border-line"
            }`}
          >
            {orderStatusLabels[s]}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="mt-10 text-ink-soft">No hay pedidos para mostrar.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Ítems</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">
                      {order.customerName}
                      {order.channel === "manual" && (
                        <span className="ml-1.5 rounded-full bg-amber/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-dark">
                          Manual
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-ink-soft">{order.customerEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {order.items.reduce((n, i) => n + i.quantity, 0)}
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${orderStatusColors[order.status]}`}
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
                      className="text-sm font-semibold text-amber-dark hover:underline"
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
