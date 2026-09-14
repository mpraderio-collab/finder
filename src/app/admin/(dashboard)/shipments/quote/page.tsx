import { db } from "@/lib/db";
import { QuoteForm } from "./QuoteForm";

export default async function ShipmentQuotePage() {
  const orders = await db.order.findMany({
    where: { status: { in: ["draft", "pending", "paid", "shipped"] } },
    orderBy: { createdAt: "asc" },
    include: { items: { include: { product: true } } },
  });

  const options = orders.map((o) => ({
    id: o.id,
    code: o.id.slice(-6).toUpperCase(),
    customerName: o.customerName || "Visitante anónimo",
    channel: o.channel,
    status: o.status,
    itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
    total: o.total,
    cogs: o.items.reduce(
      (sum, i) => sum + i.quantity * (i.product.costPrice ?? 0),
      0,
    ),
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-navy">
        Presupuestar envío
      </h1>
      <p className="mt-1 max-w-xl text-sm text-ink-soft">
        Elegí cualquier combinación de ventas o borradores (de cualquier
        cliente o canal) para simular un envío conjunto: cargá el costo de
        envío que te cotizaron y mirá el margen total antes de confirmar
        nada. Esto no crea ningún envío ni modifica los pedidos.
      </p>

      <div className="mt-8">
        <QuoteForm orders={options} />
      </div>
    </div>
  );
}
