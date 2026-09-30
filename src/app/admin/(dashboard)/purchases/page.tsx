import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { purchaseStatusLabels, purchaseStatusColors } from "@/lib/purchase-status";
import { PurchaseRow } from "./PurchaseRow";

function usd(value: number | null): string {
  if (value === null) return "—";
  return `US$ ${value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Envío de una compra entera: suma el costo de envío por caja de cada línea
// (cálculo nuevo, por volumen). Las compras viejas no tienen ese dato por
// línea — ahí se cae al valor manual que se cargaba antes (uno solo,
// repetido igual en todas las líneas de esa compra).
function purchaseShippingUsd(items: { boxShippingCostUsd: number | null; shippingCostUsd: number | null }[]): number {
  const hasBoxData = items.some((i) => i.boxShippingCostUsd != null);
  if (hasBoxData) return items.reduce((sum, i) => sum + (i.boxShippingCostUsd ?? 0), 0);
  return items[0]?.shippingCostUsd ?? 0;
}

export default async function AdminPurchasesPage() {
  const purchases = await db.purchase.findMany({
    orderBy: { purchaseDate: "desc" },
    include: { supplier: { select: { name: true } }, items: true },
  });

  // Una fila por línea de producto — el desglose en dólares puede variar
  // línea a línea aunque sean de la misma compra, así que agregarlo por
  // compra no tendría sentido.
  const rows = purchases.flatMap((p) =>
    p.items.map((item) => ({
      purchaseId: p.id,
      itemId: item.id,
      purchaseDate: p.purchaseDate,
      supplierName: p.supplier?.name ?? null,
      status: p.status,
      productName: item.productName,
      quantity: item.quantity,
      unitCostUsd: item.unitCostUsd,
      totalUsd: item.totalUsd,
      unitPriceUsd: item.unitPriceUsd,
      costPesos: item.unitCostPesos * item.quantity,
    })),
  );

  // Los borradores todavía pueden cambiar y los cancelados no pasaron —
  // los totales reflejan compras reales (confirmadas o ya recibidas).
  const committed = purchases.filter((p) => p.status === "confirmed" || p.status === "received");
  const committedRows = rows.filter((r) => r.status === "confirmed" || r.status === "received");
  const totalUnits = committedRows.reduce((sum, r) => sum + r.quantity, 0);
  const totalUsdRaw = committedRows.reduce((sum, r) => sum + r.quantity * r.unitPriceUsd, 0);
  const totalCostPesos = committedRows.reduce((sum, r) => sum + r.costPesos, 0);
  const totalShippingUsd = committed.reduce((sum, p) => sum + purchaseShippingUsd(p.items), 0);

  // purchases ya viene ordenado por fecha desc, así que las compras de una
  // misma fecha quedan contiguas — alcanza con agrupar de a tramos
  // consecutivos en vez de un Map.
  const dateGroups: { dateKey: string; purchases: typeof purchases }[] = [];
  for (const p of purchases) {
    const dateKey = p.purchaseDate.toISOString().slice(0, 10);
    const last = dateGroups[dateGroups.length - 1];
    if (last && last.dateKey === dateKey) {
      last.purchases.push(p);
    } else {
      dateGroups.push({ dateKey, purchases: [p] });
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-navy">
            Compras
          </h1>
          <p className="mt-1 max-w-xl text-sm text-ink-soft">
            Borrador → confirmado → recibido (ahí se actualiza el stock), o
            cancelado. Tocá una fila para editarla o gestionarla.
          </p>
        </div>
        <Link
          href="/admin/purchases/new"
          className="w-fit shrink-0 rounded-lg bg-navy px-4 py-2.5 font-heading text-sm font-bold text-white hover:bg-navy-deep"
        >
          + Nueva compra
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-10 text-ink-soft">Todavía no hay compras cargadas.</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-bg p-[18px]">
              <p className="text-[13px] text-ink-soft">Unidades compradas</p>
              <p className="mt-1 font-heading text-2xl font-extrabold text-navy">
                {totalUnits}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-bg p-[18px]">
              <p className="text-[13px] text-ink-soft">
                Total (cant. × precio unitario)
              </p>
              <p className="mt-1 font-heading text-2xl font-extrabold text-navy">
                {usd(totalUsdRaw)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-bg p-[18px]">
              <p className="text-[13px] text-ink-soft">Costo de envío (USD)</p>
              <p className="mt-1 font-heading text-2xl font-extrabold text-navy">
                {usd(totalShippingUsd)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-bg p-[18px]">
              <p className="text-[13px] text-ink-soft">Costo total (pesos)</p>
              <p className="mt-1 font-heading text-2xl font-extrabold text-navy">
                {formatPrice(totalCostPesos)}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-ink-faint">
            Solo cuenta compras confirmadas o recibidas — los borradores y
            cancelados no suman acá.
          </p>

          <div className="mt-6 flex flex-col gap-6">
            {dateGroups.map((group) => (
              <div key={group.dateKey}>
                <p className="mb-2 font-heading text-sm font-bold text-navy">
                  {group.purchases[0].purchaseDate.toLocaleDateString("es-AR")}
                </p>
                <div className="flex flex-col gap-3">
                  {group.purchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="overflow-x-auto rounded-xl border border-line bg-bg"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
                        <span className="text-sm font-medium text-ink">
                          {purchase.supplier?.name ?? "Sin proveedor"}
                        </span>
                        <div className="flex items-center gap-3">
                          {purchaseShippingUsd(purchase.items) > 0 && (
                            <span className="text-xs text-ink-faint">
                              Envío: {usd(purchaseShippingUsd(purchase.items))}
                            </span>
                          )}
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs font-semibold ${purchaseStatusColors[purchase.status]}`}
                          >
                            {purchaseStatusLabels[purchase.status] ?? purchase.status}
                          </span>
                        </div>
                      </div>
                      <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="border-b border-line">
                          <tr>
                            <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                              Producto
                            </th>
                            <th className="px-4 py-2 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                              Cant.
                            </th>
                            <th className="px-4 py-2 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                              Costo unit. (USD)
                            </th>
                            <th className="px-4 py-2 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                              Costo total (USD)
                            </th>
                            <th className="px-4 py-2 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                              Costo (pesos)
                            </th>
                            <th className="px-4 py-2 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                              Envío caja (USD)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchase.items.map((item) => (
                            <PurchaseRow
                              key={item.id}
                              href={`/admin/purchases/${purchase.id}/edit`}
                            >
                              <td className="px-4 py-2.5 font-medium text-ink">
                                {item.productName}
                              </td>
                              <td className="px-4 py-2.5 text-right text-ink-soft">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-2.5 text-right text-ink-soft">
                                {usd(item.unitCostUsd)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-ink-soft">
                                {usd(item.totalUsd)}
                              </td>
                              <td className="px-4 py-2.5 text-right font-heading font-bold text-navy">
                                {formatPrice(item.unitCostPesos * item.quantity)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-ink-soft">
                                {usd(item.boxShippingCostUsd)}
                              </td>
                            </PurchaseRow>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
