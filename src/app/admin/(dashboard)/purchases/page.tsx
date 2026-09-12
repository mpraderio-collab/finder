import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { purchaseStatusLabels, purchaseStatusColors } from "@/lib/purchase-status";
import { PurchaseRow } from "./PurchaseRow";

function usd(value: number | null): string {
  if (value === null) return "—";
  return `US$ ${value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
      unitCostUsdFinal: item.unitCostUsdFinal,
      unitShippingCostUsd: item.unitShippingCostUsd,
      shippingCostUsd: item.shippingCostUsd,
      totalUsd: item.totalUsd,
      unitPriceUsd: item.unitPriceUsd,
      costPesos: item.unitCostPesos * item.quantity,
    })),
  );

  // Los borradores todavía pueden cambiar y los cancelados no pasaron —
  // los totales reflejan compras reales (confirmadas o ya recibidas).
  const committed = rows.filter((r) => r.status === "confirmed" || r.status === "received");
  const totalUnits = committed.reduce((sum, r) => sum + r.quantity, 0);
  const totalUsdRaw = committed.reduce((sum, r) => sum + r.quantity * r.unitPriceUsd, 0);
  const totalCostPesos = committed.reduce((sum, r) => sum + r.costPesos, 0);
  const totalShippingUsd = committed.reduce((sum, r) => sum + (r.shippingCostUsd ?? 0), 0);

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

          <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
            <table className="w-full min-w-[1220px] text-left text-sm">
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
                    Costo unit. (USD)
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                    Costo neto (USD)
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                    Costo envío (USD)
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                    Costo total (USD)
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                    Costo (pesos)
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <PurchaseRow
                    key={row.itemId}
                    href={`/admin/purchases/${row.purchaseId}/edit`}
                  >
                    <td className="px-4 py-3 text-ink-soft">
                      {row.purchaseDate.toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">{row.productName}</td>
                    <td className="px-4 py-3 text-ink-soft">{row.supplierName ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-ink-soft">{row.quantity}</td>
                    <td className="px-4 py-3 text-right text-ink-soft">
                      {usd(row.unitCostUsd)}
                    </td>
                    <td className="px-4 py-3 text-right text-ink-soft">
                      {usd(row.unitCostUsdFinal)}
                    </td>
                    <td className="px-4 py-3 text-right text-ink-soft">
                      {usd(row.unitShippingCostUsd)}
                    </td>
                    <td className="px-4 py-3 text-right text-ink-soft">
                      {usd(row.totalUsd)}
                    </td>
                    <td className="px-4 py-3 text-right font-heading font-bold text-navy">
                      {formatPrice(row.costPesos)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${purchaseStatusColors[row.status]}`}
                      >
                        {purchaseStatusLabels[row.status] ?? row.status}
                      </span>
                    </td>
                  </PurchaseRow>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
