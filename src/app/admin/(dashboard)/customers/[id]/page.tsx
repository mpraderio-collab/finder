import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { orderStatusColors, orderStatusLabels } from "@/lib/order-status";
import { CustomerForm } from "../CustomerForm";

const CHANNEL_LABELS: Record<string, string> = { online: "Web", manual: "Manual" };

export default async function CustomerDetailPage(
  props: PageProps<"/admin/customers/[id]">,
) {
  const { id } = await props.params;

  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      orders: {
        where: { status: { not: "cart" } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          channel: true,
          status: true,
          isPaid: true,
          total: true,
        },
      },
    },
  });

  if (!customer) notFound();

  const committedOrders = customer.orders.filter((o) => o.status === "paid" || o.status === "shipped");
  const totalSpent = committedOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = committedOrders.filter((o) => !o.isPaid);
  const balanceDue = pendingOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div>
      <p className="text-sm text-ink-faint">
        <Link href="/admin/customers" className="hover:text-blue">
          Clientes
        </Link>{" "}
        / <span className="text-ink">{customer.name}</span>
      </p>
      <h1 className="mt-1 font-heading text-2xl font-extrabold text-navy">{customer.name}</h1>

      <div className="mt-6">
        <CustomerForm
          customerId={customer.id}
          initial={{
            name: customer.name,
            email: customer.email ?? "",
            phone: customer.phone ?? "",
            address: customer.address ?? "",
            city: customer.city ?? "",
            province: customer.province ?? "",
            zip: customer.zip ?? "",
          }}
        />
      </div>

      <div className="mt-8">
        <p className="font-heading text-lg font-bold text-navy">Cuenta corriente</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-bg p-[18px]">
            <p className="text-[13px] text-ink-soft">Total comprado</p>
            <p className="mt-1 font-heading text-2xl font-extrabold text-navy">
              {formatPrice(totalSpent)}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-bg p-[18px]">
            <p className="text-[13px] text-ink-soft">Pedidos confirmados</p>
            <p className="mt-1 font-heading text-2xl font-extrabold text-navy">
              {committedOrders.length}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-bg p-[18px]">
            <p className="text-[13px] text-ink-soft">Saldo pendiente (fiado)</p>
            <p
              className={`mt-1 font-heading text-2xl font-extrabold ${balanceDue > 0 ? "text-amber-ink" : "text-navy"}`}
            >
              {formatPrice(balanceDue)}
            </p>
          </div>
        </div>

        {customer.orders.length === 0 ? (
          <p className="mt-6 text-sm text-ink-soft">Todavía no tiene pedidos.</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                    Canal
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                    Pago
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                    Total
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {customer.orders.map((order) => (
                  <tr key={order.id} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-3 text-ink-soft">
                      {order.createdAt.toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {CHANNEL_LABELS[order.channel] ?? order.channel}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${orderStatusColors[order.status]}`}
                      >
                        {orderStatusLabels[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {order.status === "paid" || order.status === "shipped" ? (
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                            order.isPaid ? "bg-ok-bg text-ok-ink" : "bg-warn-bg text-warn-ink"
                          }`}
                        >
                          {order.isPaid ? "Pagado" : "Sin pagar"}
                        </span>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-ink">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
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
    </div>
  );
}
