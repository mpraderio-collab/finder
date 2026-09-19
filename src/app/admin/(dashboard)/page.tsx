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

const ANALYTICS_PERIODS = {
  today: { label: "Hoy", days: 1 },
  "7d": { label: "7 días", days: 7 },
  "30d": { label: "30 días", days: 30 },
  all: { label: "Todo", days: null },
} as const;

type AnalyticsPeriod = keyof typeof ANALYTICS_PERIODS;

function periodSince(period: AnalyticsPeriod): Date | undefined {
  const days = ANALYTICS_PERIODS[period].days;
  if (days === null) return undefined;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
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

export default async function AdminDashboardPage(
  props: PageProps<"/admin">,
) {
  const searchParams = await props.searchParams;
  const periodParam =
    typeof searchParams?.period === "string" ? searchParams.period : undefined;
  const period: AnalyticsPeriod =
    periodParam && periodParam in ANALYTICS_PERIODS
      ? (periodParam as AnalyticsPeriod)
      : "all";
  const since = periodSince(period);

  const [
    pendingCount,
    activeCartCount,
    paidOrders,
    lowStock,
    recentOnlineOrders,
    recentManualSales,
    unpaidOrders,
    viewContentCount,
    addToCartCount,
    initiateCheckoutCount,
    purchaseCount,
    uniqueVisitors,
    recentPageViews,
    topViewedProducts,
    addToCartByProduct,
  ] = await Promise.all([
    db.order.count({ where: { status: "pending" } }),
    db.order.count({ where: { status: "cart" } }),
    db.order.findMany({
      where: { status: { in: ["paid", "shipped"] } },
      select: { createdAt: true, total: true },
    }),
    db.product.findMany({
      where: { status: "active", stock: { lte: 3 } },
      orderBy: { stock: "asc" },
    }),
    db.order.findMany({
      where: { channel: "online", status: { not: "cart" } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.order.findMany({
      where: { channel: "manual" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // Ventas ya confirmadas (o hasta enviadas) pero que todavía no se
    // cobraron — hoy solo pasa con ventas manuales fiadas, ver isPaid.
    db.order.findMany({
      where: { isPaid: false, status: { in: ["paid", "shipped"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, customerName: true, total: true, status: true, createdAt: true },
    }),
    db.analyticsEvent.count({
      where: { type: "view_content", ...(since && { createdAt: { gte: since } }) },
    }),
    db.analyticsEvent.count({
      where: { type: "add_to_cart", ...(since && { createdAt: { gte: since } }) },
    }),
    db.analyticsEvent.count({
      where: { type: "initiate_checkout", ...(since && { createdAt: { gte: since } }) },
    }),
    db.analyticsEvent.count({
      where: { type: "purchase", ...(since && { createdAt: { gte: since } }) },
    }),
    db.analyticsEvent.findMany({
      where: {
        type: "page_view",
        sessionId: { not: null },
        ...(since && { createdAt: { gte: since } }),
      },
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
    db.analyticsEvent.groupBy({
      by: ["productId", "productName"],
      where: {
        type: "view_content",
        productId: { not: null },
        ...(since && { createdAt: { gte: since } }),
      },
      _count: { _all: true },
      orderBy: { _count: { productId: "desc" } },
      take: 10,
    }),
    db.analyticsEvent.groupBy({
      by: ["productId"],
      where: {
        type: "add_to_cart",
        productId: { not: null },
        ...(since && { createdAt: { gte: since } }),
      },
      _count: { _all: true },
    }),
  ]);

  const addToCartCountByProduct = new Map(
    addToCartByProduct.map((row) => [row.productId, row._count._all]),
  );
  const productViewRanking = topViewedProducts.map((row) => ({
    productId: row.productId!,
    productName: row.productName ?? "(sin nombre)",
    views: row._count._all,
    addToCart: addToCartCountByProduct.get(row.productId) ?? 0,
  }));

  const revenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const buckets = weeklySales(paidOrders);
  const maxBucket = Math.max(...buckets.map((b) => b.total), 1);

  const conversionRate =
    uniqueVisitors.length > 0
      ? (purchaseCount / uniqueVisitors.length) * 100
      : 0;
  const visitBuckets = dailyUniqueVisitors(recentPageViews);
  const maxVisitBucket = Math.max(...visitBuckets.map((b) => b.count), 1);

  const periodQuery = period !== "all" ? `?period=${period}` : "";
  const analyticsStats = [
    {
      label: "Visitantes únicos",
      value: uniqueVisitors.length,
      href: `/admin/analytics/page_view${periodQuery}`,
    },
    {
      label: "Vistas de producto",
      value: viewContentCount,
      href: `/admin/analytics/view_content${periodQuery}`,
    },
    {
      label: "Agregados al carrito",
      value: addToCartCount,
      href: `/admin/analytics/add_to_cart${periodQuery}`,
    },
    {
      label: "Checkouts iniciados",
      value: initiateCheckoutCount,
      href: `/admin/analytics/initiate_checkout${periodQuery}`,
    },
    { label: "Conversión", value: `${conversionRate.toFixed(1)}%`, href: "/admin/orders?status=paid" },
  ];

  const unpaidTotal = unpaidOrders.reduce((sum, o) => sum + o.total, 0);

  const stats = [
    { label: "Pedidos pendientes", value: pendingCount, href: "/admin/orders?status=pending" },
    { label: "Carritos activos", value: activeCartCount, href: "/admin/orders?status=cart" },
    { label: "Ventas confirmadas", value: paidOrders.length, href: "/admin/orders?status=paid" },
    { label: "Ingresos (pagados)", value: formatPrice(revenue), href: "/admin/orders?status=paid" },
    {
      label: "Stock bajo",
      value: lowStock.length,
      warn: lowStock.length > 0,
      href: "/admin/products",
    },
    {
      label: "Por cobrar",
      value: formatPrice(unpaidTotal),
      warn: unpaidOrders.length > 0,
      href: "/admin/sales",
    },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-navy">
        Resumen
      </h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-line bg-bg p-[18px] transition-colors hover:border-navy"
          >
            <p className="text-[13px] text-ink-soft">{stat.label}</p>
            <p
              className={`mt-1 font-heading text-2xl font-extrabold ${stat.warn ? "text-amber-ink" : "text-navy"}`}
            >
              {stat.value}
            </p>
          </Link>
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
          <div className="mt-5 flex gap-4" style={{ height: 160 }}>
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-heading text-lg font-bold text-navy">Visitas</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ANALYTICS_PERIODS) as AnalyticsPeriod[]).map((p) => (
              <Link
                key={p}
                href={p === "all" ? "/admin" : `/admin?period=${p}`}
                className={`rounded-full px-3 py-1.5 font-heading text-xs font-bold ${
                  period === p
                    ? "bg-navy text-white"
                    : "border border-border-btn bg-bg text-ink-soft"
                }`}
              >
                {ANALYTICS_PERIODS[p].label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {analyticsStats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-xl border border-line bg-bg p-[18px] transition-colors hover:border-navy"
            >
              <p className="text-[13px] text-ink-soft">{stat.label}</p>
              <p className="mt-1 font-heading text-2xl font-extrabold text-navy">
                {stat.value}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-line bg-bg p-5">
          <p className="font-heading text-[15px] font-bold text-navy">
            Visitantes únicos (últimos 15 días)
          </p>
          <div className="mt-5 flex gap-1.5" style={{ height: 120 }}>
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

        <div className="mt-4 rounded-xl border border-line bg-bg p-5">
          <p className="font-heading text-[15px] font-bold text-navy">
            Productos más vistos
          </p>
          {productViewRanking.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">
              Todavía no hay vistas de producto en este período.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="py-2 pr-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                      Producto
                    </th>
                    <th className="py-2 pr-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                      Vistas
                    </th>
                    <th className="py-2 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                      Agregados al carrito
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {productViewRanking.map((row) => (
                    <tr
                      key={row.productId}
                      className="border-b border-line-soft last:border-0"
                    >
                      <td className="py-2.5 pr-3">
                        <Link
                          href={`/admin/products/${row.productId}`}
                          className="font-medium text-ink hover:text-blue"
                        >
                          {row.productName}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3 text-right font-heading font-bold text-navy">
                        {row.views}
                      </td>
                      <td className="py-2.5 text-right text-ink-soft">
                        {row.addToCart}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {unpaidOrders.length > 0 && (
        <div className="mt-8 rounded-xl border border-amber-line bg-amber-soft p-5">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold text-amber-ink">
              Ingresos por cobrar — ventas vendidas/enviadas sin cobrar todavía
            </p>
            <p className="font-heading text-lg font-bold text-amber-ink">
              {formatPrice(unpaidTotal)}
            </p>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {unpaidOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between text-sm">
                <span className="text-ink">
                  {o.customerName || "Cliente"}{" "}
                  <span className="text-ink-faint">
                    · {o.createdAt.toLocaleDateString("es-AR")} ·{" "}
                    {o.status === "shipped" ? "enviada" : "vendida"}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="font-semibold text-ink">{formatPrice(o.total)}</span>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="rounded-lg border border-border-btn bg-bg px-2.5 py-1 text-xs font-semibold text-navy hover:bg-surface"
                  >
                    Ver
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <RecentOrdersList
          title="Últimos pedidos (web)"
          viewAllHref="/admin/orders"
          emptyLabel="Todavía no hay pedidos por la web."
          orders={recentOnlineOrders}
        />
        <RecentOrdersList
          title="Últimas ventas manuales"
          viewAllHref="/admin/sales"
          emptyLabel="Todavía no cargaste ninguna venta manual."
          orders={recentManualSales}
        />
      </div>
    </div>
  );
}

function RecentOrdersList({
  title,
  viewAllHref,
  emptyLabel,
  orders,
}: {
  title: string;
  viewAllHref: string;
  emptyLabel: string;
  orders: { id: string; customerName: string; total: number; status: string }[];
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="font-heading text-lg font-bold text-navy">{title}</p>
        <Link
          href={viewAllHref}
          className="font-heading text-sm font-bold text-blue hover:text-navy"
        >
          Ver todos →
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="mt-4 text-ink-soft">{emptyLabel}</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full min-w-[420px] text-left text-sm">
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{order.customerName}</td>
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
                      href={
                        order.status === "draft"
                          ? `/admin/sales/${order.id}/edit`
                          : `/admin/orders/${order.id}`
                      }
                      className="font-heading text-sm font-bold text-blue hover:text-navy"
                    >
                      {order.status === "draft" ? "Editar" : "Ver"}
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
