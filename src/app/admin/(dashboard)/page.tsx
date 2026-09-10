import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { orderStatusColors, orderStatusLabels } from "@/lib/order-status";

function weeklySales(orders: { createdAt: Date; total: number }[]) {
  const now = new Date();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  // 5 baldes de 7 días, el más reciente termina hoy.
  const buckets = Array.from({ length: 5 }, (_, i) => {
    const end = new Date(now.getTime() - (4 - i) * weekMs);
    const start = new Date(end.getTime() - weekMs);
    return { start, end, total: 0 };
  });

  for (const order of orders) {
    const bucket = buckets.find(
      (b) => order.createdAt >= b.start && order.createdAt < b.end,
    );
    if (bucket) bucket.total += order.total;
  }

  return buckets;
}

function fifteenDaysAgo(): Date {
  return new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
}

// Visitantes únicos por día — cuenta sessionId distintos dentro de cada
// balde, no eventos sueltos (una misma visita puede tener varios page_view).
function dailyUniqueVisitors(pageViews: { createdAt: Date; sessionId: string | null }[]) {
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  // 15 baldes de 1 día, el más reciente termina hoy.
  const buckets = Array.from({ length: 15 }, (_, i) => {
    const end = new Date(now.getTime() - (14 - i) * dayMs);
    const start = new Date(end.getTime() - dayMs);
    return { start, end, sessionIds: new Set<string>() };
  });

  for (const view of pageViews) {
    if (!view.sessionId) continue;
    const bucket = buckets.find(
      (b) => view.createdAt >= b.start && view.createdAt < b.end,
    );
    if (bucket) bucket.sessionIds.add(view.sessionId);
  }

  return buckets.map((b) => ({ start: b.start, end: b.end, count: b.sessionIds.size }));
}

export default async function AdminDashboardPage() {
  const [
    pendingCount,
    paidOrders,
    lowStock,
    recentOrders,
    pageViewCount,
    viewContentCount,
    addToCartCount,
    initiateCheckoutCount,
    purchaseCount,
    uniqueVisitors,
    recentPageViews,
  ] = await Promise.all([
    db.order.count({ where: { status: "pending" } }),
    db.order.findMany({
      where: { status: { in: ["paid", "shipped"] } },
      select: { createdAt: true, total: true },
    }),
    db.product.findMany({
      where: { status: "active", stock: { lte: 3 } },
      orderBy: { stock: "asc" },
    }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    db.analyticsEvent.count({ where: { type: "page_view" } }),
    db.analyticsEvent.count({ where: { type: "view_content" } }),
    db.analyticsEvent.count({ where: { type: "add_to_cart" } }),
    db.analyticsEvent.count({ where: { type: "initiate_checkout" } }),
    db.analyticsEvent.count({ where: { type: "purchase" } }),
    db.analyticsEvent.findMany({
      where: { type: "page_view", sessionId: { not: null } },
      distinct: ["sessionId"],
      select: { sessionId: true },
    }),
    db.analyticsEvent.findMany({
      where: {
        type: "page_view",
        sessionId: { not: null },
        createdAt: { gte: fifteenDaysAgo() },
      },
      select: { createdAt: true, sessionId: true },
    }),
  ]);

  const revenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const buckets = weeklySales(paidOrders);
  const maxBucket = Math.max(...buckets.map((b) => b.total), 1);

  const conversionRate =
    pageViewCount > 0 ? (purchaseCount / pageViewCount) * 100 : 0;
  const visitBuckets = dailyUniqueVisitors(recentPageViews);
  const maxVisitBucket = Math.max(...visitBuckets.map((b) => b.count), 1);

  const analyticsStats = [
    { label: "Visitas totales", value: pageViewCount },
    { label: "Visitantes únicos", value: uniqueVisitors.length },
    { label: "Vistas de producto", value: viewContentCount },
    { label: "Agregados al carrito", value: addToCartCount },
    { label: "Checkouts iniciados", value: initiateCheckoutCount },
    { label: "Conversión", value: `${conversionRate.toFixed(1)}%` },
  ];

  const stats = [
    { label: "Pedidos pendientes", value: pendingCount },
    { label: "Ventas confirmadas", value: paidOrders.length },
    { label: "Ingresos (pagados)", value: formatPrice(revenue) },
    {
      label: "Stock bajo",
      value: lowStock.length,
      warn: lowStock.length > 0,
    },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-navy">
        Resumen
      </h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-line bg-bg p-[18px]"
          >
            <p className="text-[13px] text-ink-soft">{stat.label}</p>
            <p
              className={`mt-1 font-heading text-2xl font-extrabold ${stat.warn ? "text-amber-ink" : "text-navy"}`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-xl border border-line bg-bg p-5">
          <div className="flex items-baseline justify-between">
            <p className="font-heading text-[15px] font-bold text-navy">
              Ventas por semana
            </p>
            <p className="font-heading text-sm font-bold text-navy">
              {formatPrice(buckets.reduce((sum, b) => sum + b.total, 0))}
            </p>
          </div>
          <div className="mt-5 flex items-end gap-4" style={{ height: 160 }}>
            {buckets.map((bucket, i) => {
              const isLast = i === buckets.length - 1;
              const heightPct = Math.max((bucket.total / maxBucket) * 100, 3);
              return (
                <div
                  key={i}
                  className="flex flex-1 flex-col items-center justify-end gap-1.5"
                >
                  <span
                    className={`text-xs font-semibold ${isLast ? "text-amber-ink" : "text-ink-faint"}`}
                  >
                    {bucket.total > 0 ? formatPrice(bucket.total) : ""}
                  </span>
                  <div
                    className={`w-full rounded-t-md ${isLast ? "bg-amber" : "bg-[#DCE6EE]"}`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex gap-4 border-t border-line pt-2">
            {buckets.map((_, i) => (
              <span
                key={i}
                className="flex-1 text-center text-xs text-ink-faint"
              >
                Sem {i + 1}
              </span>
            ))}
          </div>
        </div>

        {lowStock.length > 0 ? (
          <div className="rounded-xl border border-amber-line bg-amber-soft p-5">
            <p className="text-sm font-semibold text-amber-ink">
              Productos con poco stock
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {lowStock.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-ink-soft">
                    {p.name} ·{" "}
                    <span
                      className={
                        p.stock === 0 ? "font-semibold text-err-ink" : "font-semibold text-amber-ink"
                      }
                    >
                      {p.stock === 0 ? "sin stock" : `${p.stock} u.`}
                    </span>
                  </span>
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="shrink-0 rounded-lg border border-border-btn bg-bg px-2.5 py-1 text-xs font-semibold text-navy hover:bg-surface"
                  >
                    Reponer
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-bg p-5">
            <p className="text-sm font-semibold text-navy">Stock</p>
            <p className="mt-2 text-sm text-ink-soft">
              Todos los productos tienen stock suficiente.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <p className="font-heading text-lg font-bold text-navy">Visitas</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {analyticsStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-line bg-bg p-[18px]"
            >
              <p className="text-[13px] text-ink-soft">{stat.label}</p>
              <p className="mt-1 font-heading text-2xl font-extrabold text-navy">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-line bg-bg p-5">
          <p className="font-heading text-[15px] font-bold text-navy">
            Visitantes únicos (últimos 15 días)
          </p>
          <div className="mt-5 flex items-end gap-1.5" style={{ height: 120 }}>
            {visitBuckets.map((bucket, i) => {
              const isLast = i === visitBuckets.length - 1;
              const heightPct = Math.max(
                (bucket.count / maxVisitBucket) * 100,
                3,
              );
              return (
                <div
                  key={i}
                  className="flex flex-1 flex-col items-center justify-end gap-1"
                  title={`${bucket.start.toLocaleDateString("es-AR")}: ${bucket.count} visitantes únicos`}
                >
                  <span
                    className={`text-[10px] font-semibold ${isLast ? "text-amber-ink" : "text-ink-faint"}`}
                  >
                    {bucket.count > 0 ? bucket.count : ""}
                  </span>
                  <div
                    className={`w-full rounded-t-md ${isLast ? "bg-amber" : "bg-[#DCE6EE]"}`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex gap-1.5 border-t border-line pt-2">
            {visitBuckets.map((bucket, i) => (
              <span
                key={i}
                className="flex-1 text-center text-[10px] text-ink-faint"
              >
                {bucket.start.getDate()}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <p className="font-heading text-lg font-bold text-navy">
            Últimos pedidos
          </p>
          <Link
            href="/admin/orders"
            className="font-heading text-sm font-bold text-blue hover:text-navy"
          >
            Ver todos →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="mt-4 text-ink-soft">Todavía no hay pedidos.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-bg">
            <table className="w-full min-w-[560px] text-left text-sm">
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">
                      {order.customerName}
                      {order.channel === "manual" && (
                        <span className="ml-1.5 rounded-full bg-amber-soft px-1.5 py-0.5 text-[10px] font-semibold text-amber-ink">
                          Manual
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{formatPrice(order.total)}</td>
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
        )}
      </div>
    </div>
  );
}
