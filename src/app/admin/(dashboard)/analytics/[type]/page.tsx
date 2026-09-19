import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";

const TYPE_LABELS: Record<string, string> = {
  page_view: "Visitantes únicos",
  view_content: "Vistas de producto",
  add_to_cart: "Agregados al carrito",
  initiate_checkout: "Checkouts iniciados",
};

const ANALYTICS_PERIODS = {
  today: { label: "Hoy", days: 1 },
  "7d": { label: "7 días", days: 7 },
  "30d": { label: "30 días", days: 30 },
  all: { label: "Todo", days: null },
} as const;
type AnalyticsPeriod = keyof typeof ANALYTICS_PERIODS;
function periodSince(period: AnalyticsPeriod): Date | undefined {
  const days = ANALYTICS_PERIODS[period].days;
  return days === null ? undefined : new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

const MAX_ROWS = 300;

function shortSession(id: string | null): string {
  return id ? id.slice(0, 8) : "—";
}

export default async function AnalyticsDetailPage(
  props: PageProps<"/admin/analytics/[type]">,
) {
  const { type } = await props.params;
  if (!(type in TYPE_LABELS)) notFound();

  const searchParams = await props.searchParams;
  const periodParam = typeof searchParams?.period === "string" ? searchParams.period : undefined;
  const period: AnalyticsPeriod =
    periodParam && periodParam in ANALYTICS_PERIODS ? (periodParam as AnalyticsPeriod) : "all";
  const since = periodSince(period);

  // "Visitantes únicos" es por sesión (varias vistas cuentan como 1
  // visitante), el resto son eventos sueltos — por eso se arma distinto.
  if (type === "page_view") {
    const events = await db.analyticsEvent.findMany({
      where: { type: "page_view", sessionId: { not: null }, ...(since && { createdAt: { gte: since } }) },
      orderBy: { createdAt: "desc" },
      select: { sessionId: true, path: true, createdAt: true },
      take: 5000,
    });

    const bySession = new Map<
      string,
      { views: number; first: Date; last: Date; lastPath: string | null }
    >();
    for (const e of events) {
      const entry = bySession.get(e.sessionId!);
      if (!entry) {
        bySession.set(e.sessionId!, { views: 1, first: e.createdAt, last: e.createdAt, lastPath: e.path });
        continue;
      }
      entry.views += 1;
      if (e.createdAt < entry.first) entry.first = e.createdAt;
      if (e.createdAt > entry.last) entry.last = e.createdAt;
    }

    const sessionIds = [...bySession.keys()];
    const relatedOrders = await db.order.findMany({
      where: { sessionId: { in: sessionIds } },
      select: { id: true, sessionId: true, status: true, customerName: true, total: true },
    });
    const orderBySession = new Map(relatedOrders.map((o) => [o.sessionId!, o]));

    const rows = [...bySession.entries()]
      .map(([sessionId, data]) => ({ sessionId, ...data, order: orderBySession.get(sessionId) ?? null }))
      .sort((a, b) => b.last.getTime() - a.last.getTime())
      .slice(0, MAX_ROWS);

    return (
      <DetailShell type={type} period={period} count={bySession.size}>
        <Table
          head={["Sesión", "Páginas vistas", "Primera visita", "Última visita", "Carrito / pedido"]}
          rows={rows.map((r) => [
            <span key="s" className="font-mono text-xs">{shortSession(r.sessionId)}</span>,
            r.views,
            r.first.toLocaleString("es-AR"),
            r.last.toLocaleString("es-AR"),
            <OrderCell key="o" order={r.order} />,
          ])}
        />
      </DetailShell>
    );
  }

  const events = await db.analyticsEvent.findMany({
    where: { type, ...(since && { createdAt: { gte: since } }) },
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
  });

  const sessionIds = [...new Set(events.map((e) => e.sessionId).filter((s): s is string => Boolean(s)))];
  const relatedOrders = sessionIds.length
    ? await db.order.findMany({
        where: { sessionId: { in: sessionIds } },
        select: { id: true, sessionId: true, status: true, customerName: true, total: true },
      })
    : [];
  const orderBySession = new Map(relatedOrders.map((o) => [o.sessionId!, o]));

  return (
    <DetailShell type={type} period={period} count={events.length}>
      <Table
        head={["Fecha", type === "view_content" || type === "add_to_cart" ? "Producto" : "Página", "Monto", "Sesión", "Carrito / pedido"]}
        rows={events.map((e) => [
          e.createdAt.toLocaleString("es-AR"),
          e.productName ?? e.path ?? "—",
          e.value != null ? formatPrice(e.value) : "—",
          <span key="s" className="font-mono text-xs">{shortSession(e.sessionId)}</span>,
          <OrderCell key="o" order={e.sessionId ? (orderBySession.get(e.sessionId) ?? null) : null} />,
        ])}
      />
    </DetailShell>
  );
}

function OrderCell({
  order,
}: {
  order: { id: string; status: string; customerName: string; total: number } | null;
}) {
  if (!order) return <span className="text-ink-faint">Anónimo</span>;
  const label =
    order.status === "cart"
      ? `Carrito activo — ${formatPrice(order.total)}`
      : `${order.customerName || "Cliente"} — ${formatPrice(order.total)}`;
  return (
    <Link href={`/admin/orders/${order.id}`} className="font-semibold text-blue hover:text-navy">
      {label}
    </Link>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  if (rows.length === 0) {
    return <p className="mt-10 text-ink-soft">No hay datos para este período.</p>;
  }
  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-line">
          <tr>
            {head.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-line-soft last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-ink">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DetailShell({
  type,
  period,
  count,
  children,
}: {
  type: string;
  period: AnalyticsPeriod;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-sm text-ink-faint">
        <Link href="/admin" className="hover:text-accent">
          Resumen
        </Link>{" "}
        / <span className="text-ink">{TYPE_LABELS[type]}</span>
      </p>
      <h1 className="mt-1 font-heading text-2xl font-extrabold text-navy">
        {TYPE_LABELS[type]} — {count}
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        No guardamos ubicación ni de dónde vino la visita (Instagram, Google, etc.) — solo un ID de
        sesión anónimo por navegador. &quot;Carrito / pedido&quot; solo muestra un nombre cuando esa
        misma sesión coincide con un carrito o pedido real; el resto queda anónimo.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(ANALYTICS_PERIODS) as AnalyticsPeriod[]).map((p) => (
          <Link
            key={p}
            href={p === "all" ? `/admin/analytics/${type}` : `/admin/analytics/${type}?period=${p}`}
            className={`rounded-full px-3 py-1.5 font-heading text-xs font-bold ${
              period === p ? "bg-navy text-white" : "border border-border-btn bg-bg text-ink-soft"
            }`}
          >
            {ANALYTICS_PERIODS[p].label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
