import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";

export default async function AdminCustomersPage() {
  const customers = await db.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      orders: {
        where: { status: { in: ["paid", "shipped"] } },
        select: { total: true },
      },
    },
  });

  const rows = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    createdAt: c.createdAt,
    orderCount: c.orders.length,
    totalSpent: c.orders.reduce((sum, o) => sum + o.total, 0),
  }));

  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-navy">
        Clientes
      </h1>
      <p className="mt-1 max-w-xl text-sm text-ink-soft">
        Se completa solo: cada venta web o manual que cargás actualiza este
        registro.
      </p>

      {rows.length === 0 ? (
        <p className="mt-10 text-ink-soft">
          Todavía no hay clientes cargados.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Nombre
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Email
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Teléfono
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Pedidos
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Total comprado
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Alta
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
                  <td className="px-4 py-3 text-ink-soft">{row.email || "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">{row.phone || "—"}</td>
                  <td className="px-4 py-3 text-right text-ink-soft">
                    {row.orderCount}
                  </td>
                  <td className="px-4 py-3 text-right font-heading font-bold text-navy">
                    {formatPrice(row.totalSpent)}
                  </td>
                  <td className="px-4 py-3 text-right text-ink-faint">
                    {row.createdAt.toLocaleDateString("es-AR")}
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
