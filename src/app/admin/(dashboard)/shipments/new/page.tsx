import { db } from "@/lib/db";
import { ShipmentForm } from "./ShipmentForm";

export default async function NewShipmentPage() {
  const orders = await db.order.findMany({
    where: { status: "paid" },
    orderBy: { createdAt: "asc" },
    include: { items: true },
  });

  const options = orders.map((o) => ({
    id: o.id,
    code: o.id.slice(-6).toUpperCase(),
    customerName: o.customerName || "Visitante anónimo",
    channel: o.channel,
    itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
    total: o.total,
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-navy">
        Agrupar pedidos en un envío
      </h1>
      <p className="mt-1 max-w-xl text-sm text-ink-soft">
        Elegí los pedidos pagados, pendientes de envío (web o ventas
        manuales, de cualquier cliente) que van a salir juntos. Al confirmar,
        todos pasan a &quot;Enviado&quot; con el mismo transporte y código si
        cargás uno.
      </p>

      <div className="mt-8">
        <ShipmentForm orders={options} />
      </div>
    </div>
  );
}
