import { db } from "@/lib/db";
import { dedupeSuppliersByName } from "@/lib/suppliers";
import { PurchaseForm } from "../PurchaseForm";

export default async function NewPurchasePage() {
  const [products, allSuppliers] = await Promise.all([
    db.product.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.supplier.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
  ]);

  const suppliers = dedupeSuppliersByName(allSuppliers);

  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-navy">
        Nueva compra
      </h1>
      <p className="mt-1 max-w-xl text-sm text-ink-soft">
        Cargá una compra a proveedor. Si el producto todavía no está en el
        catálogo, elegí &quot;Producto nuevo&quot; — queda como registro
        histórico hasta que lo vincules.
      </p>

      <div className="mt-8">
        <PurchaseForm products={products} suppliers={suppliers} />
      </div>
    </div>
  );
}
