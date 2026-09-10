import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { orderStatusColors, orderStatusLabels } from "@/lib/order-status";
import { shippingMethods, type ShippingMethod } from "@/lib/shipping";
import { StatusSelect } from "./StatusSelect";
import { TrackingCode } from "./TrackingCode";

const timelineSteps = [
  { key: "created", label: "Pedido creado" },
  { key: "paid", label: "Pago acreditado" },
  { key: "preparing", label: "En preparación" },
  { key: "shipped", label: "Enviado" },
] as const;

function timelineProgress(status: string): number {
  if (status === "shipped") return 4;
  if (status === "paid") return 2;
  return 1; // pending, failed, cancelled: solo "creado"
}

export default async function OrderDetailPage(
  props: PageProps<"/admin/orders/[id]">,
) {
  const { id } = await props.params;
  const order = await db.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });
  if (!order) notFound();

  const done = timelineProgress(order.status);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-navy">
            Pedido #{order.id.slice(-6).toUpperCase()}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${orderStatusColors[order.status]}`}
            >
              {orderStatusLabels[order.status]}
            </span>
            {order.channel === "manual" && (
              <span className="inline-block rounded-md bg-amber-soft px-2 py-0.5 text-xs font-semibold text-amber-ink">
                Venta manual
              </span>
            )}
            <span className="text-xs text-ink-faint">
              {order.createdAt.toLocaleString("es-AR")}
            </span>
          </div>
        </div>
        <StatusSelect orderId={order.id} currentStatus={order.status} />
      </div>

      {order.channel === "online" && (
        <div className="mt-6 rounded-xl border border-line bg-bg p-5">
          <div className="grid grid-cols-4 gap-2">
            {timelineSteps.map((step, i) => (
              <div key={step.key} className="text-center">
                <p
                  className={`text-sm ${i < done ? "text-navy" : "text-ink-faint"}`}
                >
                  {i < done ? "●" : "○"}{" "}
                  <span className="font-heading font-bold">{step.label}</span>
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 h-[5px] w-full rounded-full bg-line">
            <div
              className="h-full rounded-full bg-amber transition-all"
              style={{ width: `${(done / timelineSteps.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-line bg-bg">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                    Cant.
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                    Precio unit.
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-heading font-bold text-navy">{item.product.name}</p>
                      {item.variantName && (
                        <p className="text-xs text-ink-faint">{item.variantName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3">{formatPrice(item.unitPrice)}</td>
                    <td className="px-4 py-3 font-medium">
                      {formatPrice(item.lineTotal ?? item.unitPrice * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex flex-col gap-1 border-t border-line bg-surface px-4 py-3 text-sm">
              <div className="flex justify-between text-ink-soft">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>Envío</span>
                <span className={order.shippingCost === 0 ? "font-semibold text-amber-ink" : undefined}>
                  {order.shippingCost === 0 ? "Gratis" : formatPrice(order.shippingCost)}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="font-semibold text-ink">Total cobrado</span>
                <span className="font-heading text-2xl font-extrabold text-navy">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-line bg-bg p-5">
            <p className="text-sm font-semibold text-navy">
              {order.channel === "manual" ? "Venta manual" : "Cliente"}
            </p>
            <dl className="mt-3 space-y-2 text-sm text-ink-soft">
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-faint">Nombre</dt>
                <dd className="text-ink">{order.customerName}</dd>
              </div>
              {order.channel === "manual" ? (
                order.note && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink-faint">Nota</dt>
                    <dd className="text-ink">{order.note}</dd>
                  </div>
                )
              ) : (
                <>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink-faint">Email</dt>
                    <dd className="text-ink">{order.customerEmail}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink-faint">Teléfono</dt>
                    <dd className="text-ink">{order.customerPhone}</dd>
                  </div>
                </>
              )}
            </dl>
          </div>

          {order.channel === "online" && (
            <div className="rounded-xl border border-line bg-bg p-5">
              <p className="text-sm font-semibold text-navy">Envío</p>
              <dl className="mt-3 space-y-2 text-sm text-ink-soft">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-faint">Dirección</dt>
                  <dd className="text-ink">
                    {order.shippingAddress}
                    <br />
                    {order.shippingCity}, {order.shippingProvince}
                    <br />
                    {order.shippingZip}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-faint">Transporte</dt>
                  <dd className="text-ink">
                    {order.shippingMethod
                      ? shippingMethods[order.shippingMethod as ShippingMethod]?.label
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-faint">Seguimiento</dt>
                  <TrackingCode orderId={order.id} trackingCode={order.trackingCode} />
                </div>
              </dl>
            </div>
          )}

          {order.channel === "online" && (
            <div className="rounded-xl border border-line bg-bg p-5">
              <p className="text-sm font-semibold text-navy">Pago</p>
              <dl className="mt-3 space-y-2 text-sm text-ink-soft">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-faint">Medio</dt>
                  <dd className="text-ink">Mercado Pago</dd>
                </div>
                {order.mpPaymentId && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink-faint">ID de pago</dt>
                    <dd className="text-ink">
                      {order.mpPaymentId}
                      {order.mpStatusDetail ? ` (${order.mpStatusDetail})` : ""}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
