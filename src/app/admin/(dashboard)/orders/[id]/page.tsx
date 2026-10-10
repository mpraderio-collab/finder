import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import {
  orderStatusColors,
  orderStatusLabels,
  saleStateColors,
  saleStateLabels,
  saleStateOf,
  shippingStateColors,
  shippingStateLabels,
  shippingStateOf,
} from "@/lib/order-status";
import { shippingMethods, type ShippingMethod } from "@/lib/shipping";
import { calculateCogs, calculateMargin } from "@/lib/margin";
import { SaleShippingStatus } from "./SaleShippingStatus";
import { TrackingCode } from "./TrackingCode";
import { ActualShippingCost } from "./ActualShippingCost";

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
  // Un borrador de venta manual se edita en su propia pantalla, no acá.
  if (order.channel === "manual" && order.status === "draft") {
    redirect(`/admin/sales/${order.id}/edit`);
  }

  const done = timelineProgress(order.status);
  const isCart = order.status === "cart";

  // Si el pedido va en un envío agrupado, ese costo es de todo el grupo
  // (varios clientes juntos) — no hay forma justa de prorratearlo por
  // pedido individual, así que acá ni se muestra ni se descuenta del
  // margen (el costo real del grupo se ve enterito en /admin/shipments).
  // Suelto, sigue siendo el costo real de ese pedido puntual.
  const effectiveShippingCost = order.shipmentId ? null : order.actualShippingCost;
  const cogs = calculateCogs(order.items);
  const saleState = saleStateOf(order);
  const shippingState = shippingStateOf(order);
  const margin = calculateMargin(order.total, cogs, effectiveShippingCost);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-navy">
            Pedido #{order.id.slice(-6).toUpperCase()}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {isCart ? (
              <span
                className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${orderStatusColors[order.status]}`}
              >
                {orderStatusLabels[order.status]}
              </span>
            ) : (
              <>
                <span
                  className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${saleStateColors[saleState]}`}
                >
                  Venta: {saleStateLabels[saleState]}
                </span>
                <span
                  className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${shippingStateColors[shippingState]}`}
                >
                  Envío: {shippingStateLabels[shippingState]}
                </span>
              </>
            )}
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
        <div className="flex flex-col items-end gap-2">
          {!isCart && (
            <SaleShippingStatus
              orderId={order.id}
              channel={order.channel}
              saleState={saleState}
              shippingState={shippingState}
            />
          )}
        </div>
      </div>

      {isCart && (
        <p className="mt-6 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
          Este visitante agregó productos al carrito pero todavía no completó
          el checkout. Se actualiza solo mientras siga en el carrito, y
          desaparece de acá si lo vacía o si termina comprando.
        </p>
      )}

      {order.channel === "online" && !isCart && (
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
          {!isCart && (
            <div className="rounded-xl border border-line bg-bg p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-navy">
                  {order.channel === "manual" ? "Venta manual" : "Cliente"}
                </p>
                {order.channel === "manual" && order.status !== "cancelled" && (
                  <Link
                    href={`/admin/sales/${order.id}/edit`}
                    className="text-xs font-semibold text-blue hover:text-navy"
                  >
                    Editar venta
                  </Link>
                )}
              </div>
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
          )}

          {!isCart && (
            <div className="rounded-xl border border-line bg-bg p-5">
              <p className="text-sm font-semibold text-navy">Envío</p>
              <dl className="mt-3 space-y-2 text-sm text-ink-soft">
                {order.channel === "online" && (
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
                )}
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-faint">Transporte</dt>
                  <dd className="text-ink">
                    {order.shippingMethod
                      ? (shippingMethods[order.shippingMethod as ShippingMethod]?.label ??
                        order.shippingMethod)
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-faint">Seguimiento</dt>
                  <TrackingCode orderId={order.id} trackingCode={order.trackingCode} />
                </div>
                {!order.shipmentId && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink-faint">
                      Costo real de envío
                    </dt>
                    <ActualShippingCost
                      orderId={order.id}
                      actualShippingCost={order.actualShippingCost}
                    />
                  </div>
                )}
                {order.shipmentId && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink-faint">Envío agrupado</dt>
                    <dd>
                      <Link
                        href={`/admin/shipments/${order.shipmentId}`}
                        className="font-semibold text-blue hover:text-navy"
                      >
                        Ver envío →
                      </Link>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {!isCart && (
            <div className="rounded-xl border border-line bg-bg p-5">
              <p className="text-sm font-semibold text-navy">Rentabilidad</p>
              <dl className="mt-3 space-y-2 text-sm text-ink-soft">
                <div className="flex justify-between">
                  <dt>Costo de mercadería</dt>
                  <dd className="text-ink">{formatPrice(cogs)}</dd>
                </div>
                {!order.shipmentId && (
                  <div className="flex justify-between">
                    <dt>Costo real de envío</dt>
                    <dd className="text-ink">
                      {effectiveShippingCost != null ? formatPrice(effectiveShippingCost) : "—"}
                    </dd>
                  </div>
                )}
                {order.shipmentId && (
                  <p className="text-xs text-ink-faint">
                    Va en un envío agrupado — el costo es del grupo entero, no de este pedido solo,
                    así que no se descuenta acá (lo ves en el envío agrupado).
                  </p>
                )}
                <div className="flex justify-between border-t border-line pt-2">
                  <dt className="font-semibold text-ink">Margen</dt>
                  <dd
                    className={`font-heading text-lg font-extrabold ${margin < 0 ? "text-err-ink" : "text-navy"}`}
                  >
                    {formatPrice(margin)}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {order.channel === "online" && !isCart && (
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
