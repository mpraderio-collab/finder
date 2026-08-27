import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { orderStatusColors, orderStatusLabels } from "@/lib/order-status";

export default async function AdminDashboardPage() {
  const [pendingCount, paidOrders, lowStock, recentOrders] = await Promise.all([
    db.order.count({ where: { status: "pending" } }),
    db.order.findMany({ where: { status: { in: ["paid", "shipped"] } } }),
    db.product.findMany({
      where: { status: "active", stock: { lte: 3 } },
      orderBy: { stock: "asc" },
    }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const revenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

  const stats = [
    { label: "Pedidos pendientes", value: pendingCount },
    { label: "Ventas confirmadas", value: paidOrders.length },
    { label: "Ingresos (pagados)", value: formatPrice(revenue) },
    { label: "Productos con stock bajo", value: lowStock.length },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-ink">
        Resumen
      </h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-line bg-card p-5"
          >
            <p className="text-sm text-ink-soft">{stat.label}</p>
            <p className="mt-1 font-heading text-2xl font-extrabold text-ink">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="mt-8 rounded-xl border border-amber/40 bg-amber/10 p-5">
          <p className="text-sm font-semibold text-amber-dark">
            Productos con poco stock
          </p>
          <ul className="mt-2 space-y-1 text-sm text-ink-soft">
            {lowStock.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/products/${p.id}`} className="hover:underline">
                  {p.name}
                </Link>{" "}
                — {p.stock === 0 ? "sin stock" : `${p.stock} unidades`}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <p className="font-heading text-lg font-bold text-ink">
            Últimos pedidos
          </p>
          <Link
            href="/admin/orders"
            className="text-sm font-semibold text-amber-dark hover:underline"
          >
            Ver todos →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="mt-4 text-ink-soft">Todavía no hay pedidos.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-card">
            <table className="w-full min-w-[560px] text-left text-sm">
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">
                      {order.customerName}
                    </td>
                    <td className="px-4 py-3">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${orderStatusColors[order.status]}`}
                      >
                        {orderStatusLabels[order.status]}
                      </span>
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
    </div>
  );
}
