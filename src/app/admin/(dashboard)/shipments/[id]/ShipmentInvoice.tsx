"use client";

import { ExportCsvButton } from "@/components/ExportCsvButton";
import { formatPrice } from "@/lib/products";

type InvoiceItem = {
  productName: string;
  variantName?: string | null;
  quantity: number;
  unitPrice: number;
};

type InvoiceOrder = {
  reference: string;
  customerName: string;
  items: InvoiceItem[];
  total: number;
};

export function ShipmentInvoice({
  shipmentDate,
  shippingMethod,
  trackingCode,
  orders,
  total,
  actualShippingCost,
}: {
  shipmentDate: string;
  shippingMethod: string;
  trackingCode: string;
  orders: InvoiceOrder[];
  total: number;
  actualShippingCost: number | null;
}) {
  const csvRows: (string | number)[][] = [
    ["Finder — Iluminación moderna para tu casa"],
    [`Envío del ${shipmentDate}`],
    ...(shippingMethod ? [[`Transporte: ${shippingMethod}`]] : []),
    ...(trackingCode ? [[`Código de seguimiento: ${trackingCode}`]] : []),
    [],
    ...orders.flatMap((order) => [
      [`Pedido #${order.reference} — ${order.customerName}`],
      ["Producto", "Cantidad", "Precio unitario", "Subtotal"],
      ...order.items.map((item) => [
        item.variantName ? `${item.productName} — ${item.variantName}` : item.productName,
        item.quantity,
        item.unitPrice,
        item.unitPrice * item.quantity,
      ]),
      ["Subtotal pedido", "", "", order.total],
      [],
    ]),
    ["Total del envío", "", "", total],
    ...(actualShippingCost != null
      ? [[`Costo real de envío: ${formatPrice(actualShippingCost)}`]]
      : []),
  ];

  return (
    <div className="rounded-xl border border-line bg-bg p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">Factura del envío</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg border border-border-btn bg-bg px-3 py-1.5 text-xs font-semibold text-navy hover:bg-surface"
          >
            Exportar a PDF
          </button>
          <ExportCsvButton
            fileName={`envio-${shipmentDate.replace(/\//g, "-")}`}
            rows={csvRows}
            label="Exportar a Excel"
          />
        </div>
      </div>

      <div
        id="shipment-invoice-print-area"
        className="mt-4 rounded-lg border border-line-soft bg-surface p-5"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-soft pb-3">
          <div>
            <p className="font-heading text-lg font-extrabold text-navy">Finder</p>
            <p className="text-xs text-ink-faint">Iluminación moderna para tu casa</p>
          </div>
          <div className="text-right text-xs text-ink-soft">
            <p>Envío del {shipmentDate}</p>
            {shippingMethod && <p>{shippingMethod}</p>}
            {trackingCode && <p>Cód. {trackingCode}</p>}
          </div>
        </div>

        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-ink-faint">Este envío todavía no tiene pedidos.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-5">
            {orders.map((order, oi) => (
              <div key={oi}>
                <p className="text-sm font-semibold text-ink">
                  Pedido #{order.reference}{" "}
                  <span className="font-normal text-ink-faint">— {order.customerName}</span>
                </p>
                <table className="mt-2 w-full text-left text-sm">
                  <thead className="border-b border-line-soft text-xs uppercase tracking-wide text-ink-faint">
                    <tr>
                      <th className="py-1.5 font-medium">Producto</th>
                      <th className="py-1.5 text-right font-medium">Cant.</th>
                      <th className="py-1.5 text-right font-medium">P. unit.</th>
                      <th className="py-1.5 text-right font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, i) => (
                      <tr key={i} className="border-b border-line-soft last:border-0">
                        <td className="py-1.5 text-ink">
                          {item.productName}
                          {item.variantName ? ` — ${item.variantName}` : ""}
                        </td>
                        <td className="py-1.5 text-right text-ink-soft">{item.quantity}</td>
                        <td className="py-1.5 text-right text-ink-soft">
                          {formatPrice(item.unitPrice)}
                        </td>
                        <td className="py-1.5 text-right text-ink">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-ink-faint">Subtotal pedido</span>
                  <span className="text-sm font-semibold text-ink">{formatPrice(order.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-line-soft pt-3">
          <span className="text-sm font-semibold text-ink">Total del envío</span>
          <span className="font-heading text-lg font-extrabold text-navy">{formatPrice(total)}</span>
        </div>

        {actualShippingCost != null && (
          <p className="mt-2 text-xs text-ink-faint">
            <span className="font-semibold">Costo real de envío:</span>{" "}
            {formatPrice(actualShippingCost)}
          </p>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #shipment-invoice-print-area,
          #shipment-invoice-print-area * {
            visibility: visible;
          }
          #shipment-invoice-print-area {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
