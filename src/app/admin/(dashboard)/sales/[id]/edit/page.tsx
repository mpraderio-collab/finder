import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ManualSaleForm } from "../../ManualSaleForm";

export default async function EditManualSalePage(
  props: PageProps<"/admin/sales/[id]/edit">,
) {
  const { id } = await props.params;

  const [order, products] = await Promise.all([
    db.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    }),
    db.product.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
      include: { variants: true },
    }),
  ]);

  if (!order || order.channel !== "manual") notFound();
  // Ya se confirmó — de acá en más se ve y se gestiona como cualquier pedido.
  if (order.status !== "draft") redirect(`/admin/orders/${order.id}`);

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

  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-ink">
        Borrador de venta manual
      </h1>
      <p className="mt-1 max-w-xl text-sm text-ink-soft">
        Podés seguir editando esta venta las veces que quieras. El stock
        recién se descuenta cuando la confirmás.
      </p>

      <div className="mt-8">
        <ManualSaleForm
          products={options}
          orderId={order.id}
          initialItems={initialItems}
          initialCustomerName={order.customerName === "Venta manual" ? "" : order.customerName}
          initialNote={order.note ?? ""}
        />
      </div>
    </div>
  );
}
