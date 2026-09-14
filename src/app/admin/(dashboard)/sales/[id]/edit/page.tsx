import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { dedupeCustomersByName } from "@/lib/customers";
import { ManualSaleForm } from "../../ManualSaleForm";

export default async function EditManualSalePage(
  props: PageProps<"/admin/sales/[id]/edit">,
) {
  const { id } = await props.params;

  const [order, products, allCustomers] = await Promise.all([
    db.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    }),
    db.product.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
      include: { variants: true },
    }),
    db.customer.findMany({
      orderBy: { name: "asc" },
      select: { name: true, phone: true },
    }),
  ]);

  if (!order || order.channel !== "manual") notFound();
  // Cancelada: no tiene sentido editarla, se ve como cualquier pedido.
  if (order.status === "cancelled") redirect(`/admin/orders/${order.id}`);

  const customers = dedupeCustomersByName(allCustomers);

  const options = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    stock: p.stock,
    variants: p.variants.map((v) => ({ name: v.name, stock: v.stock })),
  }));

  const initialItems = order.items.map((item) => ({
    productId: item.productId,
    productName: item.product.name,
    variantName: item.variantName ?? undefined,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    maxStock: 0,
  }));

  const isDraft = order.status === "draft";

  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-ink">
        {isDraft ? "Borrador de venta manual" : "Editar venta manual"}
      </h1>
      <p className="mt-1 max-w-xl text-sm text-ink-soft">
        {isDraft
          ? "Podés seguir editando esta venta las veces que quieras. El stock recién se descuenta cuando la confirmás."
          : "Esta venta ya está confirmada — si cambiás cantidades, el stock se ajusta solo por la diferencia (se descuenta más o se repone, según corresponda)."}
      </p>

      <div className="mt-8">
        <ManualSaleForm
          products={options}
          customers={customers}
          orderId={order.id}
          orderStatus={order.status}
          initialItems={initialItems}
          initialCustomerName={order.customerName === "Venta manual" ? "" : order.customerName}
          initialCustomerPhone={order.customerPhone}
          initialNote={order.note ?? ""}
        />
      </div>
    </div>
  );
}
