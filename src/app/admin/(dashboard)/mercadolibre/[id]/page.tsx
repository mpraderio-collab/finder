import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { getSiteSettings } from "@/lib/settings";
import { calculateMlMargin } from "@/lib/mercadolibre/margin";

export default async function MlOrderPage(props: PageProps<"/admin/mercadolibre/[id]">) {
  const { id } = await props.params;
  const [order, settings] = await Promise.all([
    db.mlOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { id: true, name: true, costPrice: true } } } },
      },
    }),
    getSiteSettings(),
  ]);
  if (!order) notFound();

  const m = calculateMlMargin(order, settings.mlTaxPercent);
  const cancelled = order.status === "cancelled" || order.status === "invalid";

  const breakdown: { label: string; value: number; sign: "+" | "−" }[] = [
    { label: "Vendido", value: m.revenue, sign: "+" },
    { label: "Costo de la mercadería", value: m.cogs, sign: "−" },
    { label: "Comisión de Mercado Libre", value: m.fee, sign: "−" },
    { label: "Envío a tu cargo", value: m.shipping, sign: "−" },
    { label: `Impuestos estimados (${settings.mlTaxPercent}%)`, value: m.tax, sign: "−" },
  ];

  return (
    <div>
      <p className="text-sm text-ink-faint">
        <Link href="/admin/mercadolibre" className="hover:text-navy">
          Mercado Libre
        </Link>{" "}
        / <span className="text-ink">Venta {order.mlOrderId}</span>
      </p>
      <h1 className="mt-1 font-heading text-2xl font-extrabold text-navy">Venta {order.mlOrderId}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {order.dateCreated.toLocaleString("es-AR")} · {order.buyerNickname || "Comprador sin nombre"} ·
        estado en Mercado Libre: {order.status}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-4 py-3">Publicación</th>
                <th className="px-4 py-3">Producto de Finder</th>
                <th className="px-4 py-3 text-right">Cant.</th>
                <th className="px-4 py-3 text-right">Precio unit.</th>
                <th className="px-4 py-3 text-right">Costo unit.</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i) => (
                <tr key={i.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <p className="text-ink">{i.title || "—"}</p>
                    <p className="font-mono text-xs text-ink-faint">{i.mlItemId}</p>
                  </td>
                  <td className="px-4 py-3">
                    {i.product ? (
                      <span className="text-ink">
                        {i.product.name}
                        {i.variantName ? ` · ${i.variantName}` : ""}
                      </span>
                    ) : (
                      <Link
                        href="/admin/mercadolibre/publicaciones"
                        className="font-semibold text-warn-ink underline"
                      >
                        Sin vincular
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink">{i.quantity}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink">{formatPrice(i.unitPrice)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-soft">
                    {i.product?.costPrice != null ? formatPrice(i.product.costPrice) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-line bg-bg p-5">
          <p className="text-sm font-semibold text-navy">Margen de la venta</p>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            {breakdown.map((b) => (
              <div key={b.label} className="flex items-center justify-between gap-3">
                <dt className="text-ink-soft">{b.label}</dt>
                <dd className="tabular-nums text-ink">
                  {b.sign} {formatPrice(b.value)}
                </dd>
              </div>
            ))}
            <div className="mt-1 flex items-center justify-between gap-3 border-t border-line pt-3">
              <dt className="font-semibold text-ink">Margen</dt>
              <dd
                className={`text-lg font-bold tabular-nums ${
                  cancelled ? "text-ink-faint" : m.margin >= 0 ? "text-ok-ink" : "text-err-ink"
                }`}
              >
                {cancelled ? "—" : formatPrice(m.margin)}
              </dd>
            </div>
          </dl>
          {!m.complete && !cancelled && (
            <p className="mt-3 rounded-lg bg-warn-bg px-3 py-2 text-xs text-warn-ink">
              Hay productos sin vincular o sin costo cargado: el margen real es menor al que se muestra.
            </p>
          )}
          {cancelled && (
            <p className="mt-3 rounded-lg bg-err-bg px-3 py-2 text-xs text-err-ink">
              Esta venta está cancelada, no suma a los totales.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
