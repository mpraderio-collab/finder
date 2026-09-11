import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { dedupeSuppliersByName } from "@/lib/suppliers";
import { PurchaseForm } from "../../PurchaseForm";

export default async function EditPurchasePage(
  props: PageProps<"/admin/purchases/[id]/edit">,
) {
  const { id } = await props.params;

  const [purchase, products, allSuppliers] = await Promise.all([
    db.purchase.findUnique({
      where: { id },
      include: { product: { select: { id: true, name: true, status: true } }, supplier: true },
    }),
    db.product.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.supplier.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
  ]);

  if (!purchase) notFound();

  // Si el producto vinculado está archivado, igual tiene que aparecer en
  // el desplegable para no perder el vínculo al editar.
  const productOptions =
    purchase.product && purchase.product.status !== "active"
      ? [{ id: purchase.product.id, name: purchase.product.name }, ...products]
      : products;

  const suppliers = dedupeSuppliersByName(allSuppliers);

  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-navy">
        Editar compra
      </h1>

      <div className="mt-8">
        <PurchaseForm
          products={productOptions}
          suppliers={suppliers}
          purchaseId={purchase.id}
          initial={{
            productId: purchase.productId,
            productName: purchase.productName,
            supplierName: purchase.supplier?.name ?? "",
            purchaseDate: purchase.purchaseDate.toISOString().slice(0, 10),
            quantity: purchase.quantity,
            unitPriceUsd: purchase.unitPriceUsd,
            exchangeRate: purchase.exchangeRate,
            taxesPesos: purchase.taxesPesos,
            shippingCostUsd: purchase.shippingCostUsd,
            suggestedPrice: purchase.suggestedPrice,
            appliedToStock: purchase.appliedToStock,
          }}
        />
      </div>
    </div>
  );
}
