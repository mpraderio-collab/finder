import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { dateBuckets, endOfToday, startOfMonth, startOfToday, startOfYear, toDateInputValue } from "@/lib/reports";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { BarChart } from "@/components/charts/BarChart";
import { DonutChart } from "@/components/charts/DonutChart";

const CHANNEL_LABELS: Record<string, string> = { online: "Web", manual: "Manual" };

export default async function SalesReportPage(props: PageProps<"/admin/reports/sales">) {
  const searchParams = await props.searchParams;
  const fromParam = typeof searchParams?.from === "string" ? searchParams.from : undefined;
  const toParam = typeof searchParams?.to === "string" ? searchParams.to : undefined;
  const channelParam = typeof searchParams?.channel === "string" ? searchParams.channel : "";
  const productIdParam = typeof searchParams?.productId === "string" ? searchParams.productId : "";

  const from = fromParam ? new Date(`${fromParam}T00:00:00`) : startOfMonth();
  const to = toParam ? new Date(`${toParam}T23:59:59`) : endOfToday();
  const hasFilters = Boolean(fromParam || toParam || channelParam || productIdParam);

  const [sales, products] = await Promise.all([
    db.order.findMany({
      where: {
        status: { in: ["paid", "shipped"] },
        createdAt: { gte: from, lte: to },
        ...(channelParam && { channel: channelParam }),
        ...(productIdParam && { items: { some: { productId: productIdParam } } }),
      },
      orderBy: { createdAt: "desc" },
      include: { items: { include: { product: { select: { name: true } } } } },
    }),
    db.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const saleCount = sales.length;
  const avgTicket = saleCount > 0 ? totalRevenue / saleCount : 0;
  const webTotal = sales.filter((s) => s.channel === "online").reduce((sum, s) => sum + s.total, 0);
  const manualTotal = sales.filter((s) => s.channel === "manual").reduce((sum, s) => sum + s.total, 0);

  const byProduct = new Map<string, { name: string; quantity: number; total: number }>();
  for (const sale of sales) {
    for (const item of sale.items) {
      const entry = byProduct.get(item.productId) ?? { name: item.product.name, quantity: 0, total: 0 };
      entry.quantity += item.quantity;
      entry.total += item.lineTotal ?? item.unitPrice * item.quantity;
      byProduct.set(item.productId, entry);
    }
  }
  const productBreakdown = [...byProduct.values()].sort((a, b) => b.total - a.total);
  const topProducts = productBreakdown.slice(0, 5).map((p) => ({ label: p.name, value: p.total }));

  const buckets = dateBuckets(from, to);
  const revenueByBucket = buckets.map((bucket) => ({
    label: bucket.label,
    value: sales
      .filter((s) => s.createdAt >= bucket.start && s.createdAt < bucket.end)
      .reduce((sum, s) => sum + s.total, 0),
  }));

  const quickRanges = [
    { label: "Hoy", from: startOfToday(), to: endOfToday() },
    { label: "Este mes", from: startOfMonth(), to: endOfToday() },
    { label: "Este año", from: startOfYear(), to: endOfToday() },
  ];
  const activeRangeLabel = quickRanges.find(
    (r) => toDateInputValue(r.from) === toDateInputValue(from) && toDateInputValue(r.to) === toDateInputValue(to),
  )?.label;

  function rangeHref(r: { from: Date; to: Date }) {
    const params = new URLSearchParams();
    params.set("from", toDateInputValue(r.from));
    params.set("to", toDateInputValue(r.to));
    if (channelParam) params.set("channel", channelParam);
    if (productIdParam) params.set("productId", productIdParam);
    return `/admin/reports/sales?${params.toString()}`;
  }

  const exportRows: (string | number)[][] = [
    [`Informe de ventas: ${toDateInputValue(from)} a ${toDateInputValue(to)}`],
    [],
    ["Fecha", "Canal", "Cliente", "Ítems", "Total"],
    ...sales.map((s) => [
      s.createdAt.toLocaleDateString("es-AR"),
      CHANNEL_LABELS[s.channel] ?? s.channel,
      s.customerName || "—",
      s.items.length,
      s.total,
    ]),
    [],
    ["Total vendido", "", "", "", totalRevenue],
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ink-faint">
            <Link href="/admin" className="hover:text-accent">
              Panel
            </Link>{" "}
            / <span className="text-ink">Informe de ventas</span>
          </p>
          <h1 className="mt-1 font-heading text-2xl font-extrabold text-navy">Informe de ventas</h1>
        </div>
        <ExportCsvButton fileName={`ventas-${toDateInputValue(from)}-a-${toDateInputValue(to)}`} rows={exportRows} />
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-4 rounded-xl border border-line bg-surface p-4">
        <form className="flex flex-wrap items-end gap-3" method="get">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-ink-soft">Desde</span>
            <input
              type="date"
              name="from"
              defaultValue={toDateInputValue(from)}
              className="rounded-lg border border-border-btn bg-bg px-3 py-2 text-sm text-ink outline-none focus-amber"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-ink-soft">Hasta</span>
            <input
              type="date"
              name="to"
              defaultValue={toDateInputValue(to)}
              className="rounded-lg border border-border-btn bg-bg px-3 py-2 text-sm text-ink outline-none focus-amber"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-ink-soft">Canal</span>
            <select
              name="channel"
              defaultValue={channelParam}
              className="rounded-lg border border-border-btn bg-bg px-3 py-2 text-sm text-ink outline-none focus-amber"
            >
              <option value="">Todos</option>
              <option value="online">Web</option>
              <option value="manual">Manual</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-ink-soft">Producto</span>
            <select
              name="productId"
              defaultValue={productIdParam}
              className="rounded-lg border border-border-btn bg-bg px-3 py-2 text-sm text-ink outline-none focus-amber"
            >
              <option value="">Todos</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-lg bg-navy px-4 py-2 font-heading text-sm font-bold text-white hover:bg-navy-deep"
          >
            Filtrar
          </button>
        </form>
        <div className="flex gap-2">
          {quickRanges.map((r) => {
            const isActive = r.label === activeRangeLabel;
            return (
              <Link
                key={r.label}
                href={rangeHref(r)}
                className={`flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold ${
                  isActive ? "border-navy bg-navy text-white" : "border-border-btn bg-bg text-ink hover:bg-surface"
                }`}
              >
                {isActive && "✓ "}
                {r.label}
              </Link>
            );
          })}
          {hasFilters && (
            <Link
              href="/admin/reports/sales"
              className="rounded-lg border border-border-btn bg-bg px-3 py-2 text-xs font-semibold text-ink hover:bg-surface"
            >
              Limpiar filtros
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-bg p-[18px]">
          <p className="text-[13px] text-ink-soft">Total vendido</p>
          <p className="mt-1 font-heading text-2xl font-extrabold text-navy">{formatPrice(totalRevenue)}</p>
          <p className="mt-1 text-xs text-ink-faint">
            Web {formatPrice(webTotal)} · Manual {formatPrice(manualTotal)}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-bg p-[18px]">
          <p className="text-[13px] text-ink-soft">Ventas</p>
          <p className="mt-1 font-heading text-2xl font-extrabold text-navy">{saleCount}</p>
        </div>
        <div className="rounded-xl border border-line bg-bg p-[18px]">
          <p className="text-[13px] text-ink-soft">Ticket promedio</p>
          <p className="mt-1 font-heading text-2xl font-extrabold text-navy">{formatPrice(avgTicket)}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-bg p-5">
          <p className="text-sm font-semibold text-navy">Ventas en el período</p>
          {revenueByBucket.every((b) => b.value === 0) ? (
            <p className="mt-3 text-sm text-ink-soft">No hay ventas en este período.</p>
          ) : (
            <BarChart data={revenueByBucket} formatValue={formatPrice} />
          )}
        </div>
        <div className="rounded-xl border border-line bg-bg p-5">
          <p className="text-sm font-semibold text-navy">Top 5 productos por facturación</p>
          {topProducts.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">No hay ventas en este período.</p>
          ) : (
            <div className="mt-4">
              <DonutChart data={topProducts} formatValue={formatPrice} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm font-semibold text-navy">Ventas por producto</p>
        {productBreakdown.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">No hay ventas en este período.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-bg">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Total facturado</th>
                </tr>
              </thead>
              <tbody>
                {productBreakdown.map((p) => (
                  <tr key={p.name} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-3 text-ink">{p.name}</td>
                    <td className="px-4 py-3 text-ink-soft">{p.quantity} u.</td>
                    <td className="px-4 py-3 font-medium text-ink">{formatPrice(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8">
        <p className="text-sm font-semibold text-navy">Detalle de ventas</p>
        {sales.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">No hay ventas en este período.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-bg">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Canal</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Ítems</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-3 text-ink-soft">{sale.createdAt.toLocaleDateString("es-AR")}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                          sale.channel === "online" ? "bg-info-bg text-info-ink" : "bg-amber-soft text-amber-ink"
                        }`}
                      >
                        {CHANNEL_LABELS[sale.channel] ?? sale.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">{sale.customerName || "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">{sale.items.length}</td>
                    <td className="px-4 py-3 text-ink">{formatPrice(sale.total)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/orders/${sale.id}`} className="font-semibold text-blue hover:text-navy">
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
