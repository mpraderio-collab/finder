import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";

export default async function AdminSalesPage() {
  const sales = await db.order.findMany({
    where: { channel: "manual" },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-extrabold text-navy">
          Ventas manuales
        </h1>
        <Link
          href="/admin/sales/new"
          className="rounded-lg bg-navy px-4 py-2 font-heading text-sm font-bold text-white hover:bg-navy-deep"
        >
          + Nueva venta
        </Link>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        Ventas cargadas a mano (en persona, por WhatsApp, en una feria, etc.),
        aparte de las compras hechas en la página.
      </p>

      {sales.length === 0 ? (
        <p className="mt-10 text-ink-soft">Todavía no cargaste ninguna venta manual.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Venta
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Cliente
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Ítems
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Total
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Fecha
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3 font-heading font-bold text-navy">
                    #{sale.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{sale.customerName}</p>
                    {sale.note && <p className="text-xs text-ink-faint">{sale.note}</p>}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {sale.items.reduce((n, i) => n + i.quantity, 0)}
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">
                    {formatPrice(sale.total)}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {sale.createdAt.toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${sale.id}`}
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
