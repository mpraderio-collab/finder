import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { DeletePurchaseButton } from "./DeletePurchaseButton";

function formatUsd(value: number | null): string {
  if (value === null) return "—";
  return `US$ ${value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function AdminPurchasesPage() {
  const purchases = await db.purchase.findMany({
    orderBy: { purchaseDate: "desc" },
    include: {
      product: { select: { id: true, name: true } },
      supplier: { select: { name: true } },
    },
  });

  const totalUnits = purchases.reduce((sum, p) => sum + p.quantity, 0);
  const totalCostPesos = purchases.reduce(
    (sum, p) => sum + p.unitCostPesos * p.quantity,
    0,
  );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-navy">
            Compras
          </h1>
          <p className="mt-1 max-w-xl text-sm text-ink-soft">
            Historial de compras a proveedor, con el mismo desglose de
            costos (dólares, impuestos, envío) que la planilla de origen.
          </p>
        </div>
        <Link
          href="/admin/purchases/new"
          className="w-fit shrink-0 rounded-lg bg-navy px-4 py-2.5 font-heading text-sm font-bold text-white hover:bg-navy-deep"
        >
          + Nueva compra
        </Link>
      </div>

      {purchases.length === 0 ? (
        <p className="mt-10 text-ink-soft">Todavía no hay compras cargadas.</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-bg p-[18px]">
              <p className="text-[13px] text-ink-soft">Unidades compradas</p>
              <p className="mt-1 font-heading text-2xl font-extrabold text-navy">
                {totalUnits}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-bg p-[18px]">
              <p className="text-[13px] text-ink-soft">Costo total (pesos)</p>
              <p className="mt-1 font-heading text-2xl font-extrabold text-navy">
                {formatPrice(totalCostPesos)}
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="border-b border-line">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                    Proveedor
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                    Cant.
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                    P. unitario
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                    Cotización
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                    Costo unit. (USD)
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                    Costo unit. (pesos)
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                    Reflejado
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-3 text-ink-soft">
                      {p.purchaseDate.toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">
                      {p.product ? (
                        <Link
                          href={`/admin/products/${p.product.id}`}
                          className="hover:text-blue"
                        >
                          {p.product.name}
                        </Link>
                      ) : (
                        <span title="Todavía no está dado de alta en el catálogo">
                          {p.productName} <span className="text-ink-faint">(sin vincular)</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{p.supplier?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-ink-soft">{p.quantity}</td>
                    <td className="px-4 py-3 text-right text-ink-soft">
                      {formatUsd(p.unitPriceUsd)}
                    </td>
                    <td className="px-4 py-3 text-right text-ink-soft">
                      {p.exchangeRate.toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-3 text-right text-ink-soft">
                      {formatUsd(p.unitCostUsdFinal)}
                    </td>
                    <td className="px-4 py-3 text-right font-heading font-bold text-navy">
                      {formatPrice(p.unitCostPesos)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.appliedToStock ? (
                        <span className="rounded-md bg-ok-bg px-2 py-0.5 text-xs font-semibold text-ok-ink">
                          Sí
                        </span>
                      ) : (
                        <span className="rounded-md bg-amber-soft px-2 py-0.5 text-xs font-semibold text-amber-ink">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/purchases/${p.id}/edit`}
                          className="text-xs font-semibold text-blue hover:text-navy"
                        >
                          Editar
                        </Link>
                        <DeletePurchaseButton id={p.id} appliedToStock={p.appliedToStock} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
