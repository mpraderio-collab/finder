import { db } from "@/lib/db";
import { dedupeSuppliersByName } from "@/lib/suppliers";
import { PurchaseForm } from "../PurchaseForm";

export default async function NewPurchasePage() {
  const [products, allSuppliers, priceHistory] = await Promise.all([
    db.product.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        images: {
          where: { isHero: true, type: "image" },
          select: { url: true },
          take: 1,
        },
      },
    }),
    db.supplier.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
    db.purchaseItem.findMany({
      where: { productId: { not: null }, purchase: { status: { not: "cancelled" } } },
      select: { productId: true, unitPriceUsd: true },
      orderBy: { purchase: { purchaseDate: "desc" } },
    }),
  ]);

  const suppliers = dedupeSuppliersByName(allSuppliers);
  const productOptions = products.map((p) => ({
    id: p.id,
    name: p.name,
    heroImageUrl: p.images[0]?.url,
  }));

  // Primera ocurrencia por producto = la más reciente (ya viene ordenado
  // desc por fecha de compra) — para sugerir el último precio pagado.
  const lastPricesByProduct: Record<string, number> = {};
  for (const row of priceHistory) {
    if (row.productId && !(row.productId in lastPricesByProduct)) {
      lastPricesByProduct[row.productId] = row.unitPriceUsd;
    }
  }

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
        <PurchaseForm products={productOptions} suppliers={suppliers} lastPrices={lastPricesByProduct} />
      </div>
    </div>
  );
}
