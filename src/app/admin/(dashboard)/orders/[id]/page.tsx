import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { orderStatusColors, orderStatusLabels } from "@/lib/order-status";
import { StatusSelect } from "./StatusSelect";

export default async function OrderDetailPage(
  props: PageProps<"/admin/orders/[id]">,
) {
  const { id } = await props.params;
  const order = await db.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });
  if (!order) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-ink">
            Pedido #{order.id.slice(-8)}
          </h1>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${orderStatusColors[order.status]}`}
          >
            {orderStatusLabels[order.status]}
          </span>
        </div>
        <StatusSelect orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-line bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-ink-soft">
                <tr>
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">Cant.</th>
                  <th className="px-4 py-3 font-medium">Precio unit.</th>
                  <th className="px-4 py-3 font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{item.product.name}</p>
                      {item.variantName && (
                        <p className="text-xs text-ink-soft">{item.variantName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3">{formatPrice(item.unitPrice)}</td>
                    <td className="px-4 py-3 font-medium">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end gap-8 border-t border-line px-4 py-3 text-sm">
              <span className="text-ink-soft">Total</span>
              <span className="font-heading text-lg font-extrabold text-ink">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>

          {order.mpPaymentId && (
            <p className="mt-3 text-xs text-ink-soft">
              Pago Mercado Pago: {order.mpPaymentId}
              {order.mpStatusDetail ? ` (${order.mpStatusDetail})` : ""}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-line bg-card p-5">
          <p className="text-sm font-semibold text-ink">Datos del cliente</p>
          <dl className="mt-3 space-y-2 text-sm text-ink-soft">
            <div>
              <dt className="text-xs uppercase tracking-wide">Nombre</dt>
              <dd className="text-ink">{order.customerName}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide">Email</dt>
              <dd className="text-ink">{order.customerEmail}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide">Teléfono</dt>
              <dd className="text-ink">{order.customerPhone}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide">Envío</dt>
              <dd className="text-ink">
                {order.shippingAddress}, {order.shippingCity},{" "}
                {order.shippingProvince} ({order.shippingZip})
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide">Fecha</dt>
              <dd className="text-ink">
                {order.createdAt.toLocaleString("es-AR")}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
