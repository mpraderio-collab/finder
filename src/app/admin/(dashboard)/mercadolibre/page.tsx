import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { getSiteSettings } from "@/lib/settings";
import { calculateMlMargin } from "@/lib/mercadolibre/margin";

const statusLabels: Record<string, string> = {
  paid: "Pagada",
  confirmed: "Confirmada",
  payment_in_process: "Pago en proceso",
  cancelled: "Cancelada",
  partially_refunded: "Devolución parcial",
};

// Las canceladas no son venta: se muestran pero no suman.
function countsAsSale(status: string) {
  return status !== "cancelled" && status !== "invalid";
}

function monthRange(param: string | undefined) {
  const match = param?.match(/^(\d{4})-(\d{2})$/);
  const now = new Date();
  const year = match ? Number(match[1]) : now.getFullYear();
  const month = match ? Number(match[2]) - 1 : now.getMonth();
  return {
    value: `${year}-${String(month + 1).padStart(2, "0")}`,
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 1),
  };
}

export default async function MercadoLibrePage(props: PageProps<"/admin/mercadolibre">) {
  const searchParams = await props.searchParams;
  const range = monthRange(typeof searchParams?.month === "string" ? searchParams.month : undefined);

  const [orders, settings, linkedCount] = await Promise.all([
    db.mlOrder.findMany({
      where: { dateCreated: { gte: range.start, lt: range.end } },
      orderBy: { dateCreated: "desc" },
      include: { items: { include: { product: { select: { costPrice: true } } } } },
    }),
    getSiteSettings(),
    db.mlListing.count(),
  ]);

  const rows = orders.map((o) => ({
    order: o,
    sale: countsAsSale(o.status),
    margin: calculateMlMargin(o, settings.mlTaxPercent),
  }));
  const active = rows.filter((r) => r.sale);
  const totals = active.reduce(
    (t, r) => ({
      revenue: t.revenue + r.margin.revenue,
      cogs: t.cogs + r.margin.cogs,
      fee: t.fee + r.margin.fee,
      shipping: t.shipping + r.margin.shipping,
      tax: t.tax + r.margin.tax,
      margin: t.margin + r.margin.margin,
    }),
    { revenue: 0, cogs: 0, fee: 0, shipping: 0, tax: 0, margin: 0 },
  );
  const incomplete = active.filter((r) => !r.margin.complete).length;
  const marginPercent = totals.revenue > 0 ? (totals.margin / totals.revenue) * 100 : 0;

  const stats = [
    { label: "Ventas", value: String(active.length), hint: formatPrice(totals.revenue) },
    { label: "Costo de mercadería", value: formatPrice(totals.cogs) },
    { label: "Comisiones de ML", value: formatPrice(totals.fee) },
    { label: "Envíos a tu cargo", value: formatPrice(totals.shipping) },
    { label: `Impuestos estimados (${settings.mlTaxPercent}%)`, value: formatPrice(totals.tax) },
    {
      label: "Margen",
      value: formatPrice(totals.margin),
      hint: `${marginPercent.toFixed(1).replace(".", ",")}% de lo vendido`,
      tone: totals.margin >= 0 ? "text-ok-ink" : "text-err-ink",
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-navy">Mercado Libre</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">
            Tus ventas de Mercado Libre y el margen de cada una: lo vendido, menos el costo de la
            mercadería, la comisión de ML, el envío a tu cargo y los impuestos estimados.
          </p>
        </div>
        <Link
          href="/admin/mercadolibre/publicaciones"
          className="rounded-lg border border-border-btn px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
        >
          Publicaciones vinculadas ({linkedCount})
        </Link>
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-soft">Mes</span>
          <input
            type="month"
            name="month"
            defaultValue={range.value}
            className="rounded-lg border border-border-input bg-bg px-3 py-2 text-sm outline-none focus:border-amber"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-deep"
        >
          Ver
        </button>
      </form>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-bg p-4">
            <p className="text-xs text-ink-soft">{s.label}</p>
            <p className={`mt-1 text-xl font-bold tabular-nums ${s.tone ?? "text-ink"}`}>{s.value}</p>
            {s.hint && <p className="mt-0.5 text-xs text-ink-faint">{s.hint}</p>}
          </div>
        ))}
      </div>

      {incomplete > 0 && (
        <p className="mt-4 rounded-lg border border-warn-line bg-warn-bg px-4 py-3 text-sm text-warn-ink">
          {incomplete} {incomplete === 1 ? "venta tiene" : "ventas tienen"} productos sin vincular o
          sin costo cargado, así que su margen real es menor al que se muestra.{" "}
          <Link href="/admin/mercadolibre/publicaciones" className="font-semibold underline">
            Vincular publicaciones
          </Link>
        </p>
      )}

      {rows.length === 0 ? (
        <p className="mt-10 text-ink-soft">
          No hay ventas de Mercado Libre importadas en este mes. Las ventas aparecen acá apenas se
          conecta la cuenta de Mercado Libre.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Comprador</th>
                <th className="px-4 py-3">Productos</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Comisión</th>
                <th className="px-4 py-3 text-right">Envío</th>
                <th className="px-4 py-3 text-right">Margen</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ order, sale, margin }) => (
                <tr key={order.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-ink-soft">
                    {order.dateCreated.toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-4 py-3 text-ink">{order.buyerNickname || "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {order.items.map((i) => `${i.quantity} × ${i.title || i.mlItemId}`).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink">
                    {formatPrice(order.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-soft">
                    {formatPrice(margin.fee)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-soft">
                    {formatPrice(margin.shipping)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold tabular-nums ${
                      !sale ? "text-ink-faint" : margin.margin >= 0 ? "text-ok-ink" : "text-err-ink"
                    }`}
                  >
                    {sale ? formatPrice(margin.margin) : "—"}
                    {sale && !margin.complete && (
                      <span title="Hay productos sin vincular o sin costo" className="ml-1 text-warn-ink">
                        *
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                        sale ? "bg-ok-bg text-ok-ink" : "bg-err-bg text-err-ink"
                      }`}
                    >
                      {statusLabels[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/mercadolibre/${order.id}`}
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
