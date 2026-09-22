"use client";

import { ExportCsvButton } from "@/components/ExportCsvButton";
import { formatPrice } from "@/lib/products";

type InvoiceItem = {
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
};

export function InvoicePreview({
  customerName,
  customerPhone,
  items,
  total,
  note,
  reference,
}: {
  customerName: string;
  customerPhone: string;
  items: InvoiceItem[];
  total: number;
  note: string;
  // Nº de venta a mostrar (últimos caracteres del id) si ya se guardó.
  reference?: string;
}) {
  const today = new Date().toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const csvRows: (string | number)[][] = [
    ["Finder — Iluminación moderna para tu casa"],
    [reference ? `Venta #${reference}` : "Venta (borrador)"],
    [`Fecha: ${today}`],
    [`Cliente: ${customerName || "Consumidor final"}`],
    ...(customerPhone ? [[`Teléfono: ${customerPhone}`]] : []),
    [],
    ["Producto", "Cantidad", "Precio unitario", "Subtotal"],
    ...items.map((item) => [
      item.variantName ? `${item.productName} — ${item.variantName}` : item.productName,
      item.quantity,
      item.unitPrice,
      item.unitPrice * item.quantity,
    ]),
    [],
    ["Total", "", "", total],
    ...(note ? [[], [`Nota: ${note}`]] : []),
  ];

  return (
    <div className="rounded-xl border border-line bg-bg p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">Factura para el cliente</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg border border-border-btn bg-bg px-3 py-1.5 text-xs font-semibold text-navy hover:bg-surface"
          >
            Exportar a PDF
          </button>
          <ExportCsvButton
            fileName={`factura-${(customerName || "venta").toLowerCase().replace(/\s+/g, "-")}`}
            rows={csvRows}
            label="Exportar a Excel"
          />
        </div>
      </div>

      <div id="invoice-print-area" className="mt-4 rounded-lg border border-line-soft bg-surface p-5">
        <div className="flex items-start justify-between gap-3 border-b border-line-soft pb-3">
          <div>
            <p className="font-heading text-lg font-extrabold text-navy">Finder</p>
            <p className="text-xs text-ink-faint">Iluminación moderna para tu casa</p>
          </div>
          <div className="text-right text-xs text-ink-soft">
            <p>{reference ? `Venta #${reference}` : "Borrador"}</p>
            <p>{today}</p>
          </div>
        </div>

        <div className="mt-3 text-sm">
          <p className="text-ink">
            <span className="text-ink-faint">Cliente:</span> {customerName || "Consumidor final"}
          </p>
          {customerPhone && (
            <p className="text-ink">
              <span className="text-ink-faint">Teléfono:</span> {customerPhone}
            </p>
          )}
        </div>

        {items.length === 0 ? (
          <p className="mt-4 text-sm text-ink-faint">Agregá productos para ver la factura.</p>
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="border-b border-line-soft text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="py-1.5 font-medium">Producto</th>
                <th className="py-1.5 text-right font-medium">Cant.</th>
                <th className="py-1.5 text-right font-medium">P. unit.</th>
                <th className="py-1.5 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-line-soft last:border-0">
                  <td className="py-1.5 text-ink">
                    {item.productName}
                    {item.variantName ? ` — ${item.variantName}` : ""}
                  </td>
                  <td className="py-1.5 text-right text-ink-soft">{item.quantity}</td>
                  <td className="py-1.5 text-right text-ink-soft">{formatPrice(item.unitPrice)}</td>
                  <td className="py-1.5 text-right text-ink">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-line-soft pt-3">
          <span className="text-sm font-semibold text-ink">Total</span>
          <span className="font-heading text-lg font-extrabold text-navy">{formatPrice(total)}</span>
        </div>

        {note && (
          <p className="mt-3 text-xs text-ink-faint">
            <span className="font-semibold">Nota:</span> {note}
          </p>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-print-area,
          #invoice-print-area * {
            visibility: visible;
          }
          #invoice-print-area {
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
