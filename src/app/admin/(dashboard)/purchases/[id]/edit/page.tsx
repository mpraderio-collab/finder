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
      include: {
        supplier: true,
        items: { include: { product: { select: { id: true, name: true, status: true } } } },
      },
    }),
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
  ]);

  if (!purchase) notFound();

  // Si algún producto vinculado está archivado, igual tiene que aparecer
  // en el desplegable para no perder el vínculo al editar.
  const archivedLinked = purchase.items
    .map((i) => i.product)
    .filter((p): p is { id: string; name: string; status: string } => p !== null && p.status !== "active");
  const productOptions = [
    ...archivedLinked.map((p) => ({ id: p.id, name: p.name, heroImageUrl: undefined })),
    ...products.map((p) => ({ id: p.id, name: p.name, heroImageUrl: p.images[0]?.url })),
  ];

  const suppliers = dedupeSuppliersByName(allSuppliers);

  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-navy">
        {purchase.status === "draft" ? "Editar compra" : "Compra"}
      </h1>

      <div className="mt-8">
        <PurchaseForm
          products={productOptions}
          suppliers={suppliers}
          purchaseId={purchase.id}
          initial={{
            supplierName: purchase.supplier?.name ?? "",
            purchaseDate: purchase.purchaseDate.toISOString().slice(0, 10),
            status: purchase.status,
            items: purchase.items.map((item) => ({
              productId: item.productId ?? undefined,
              productName: item.productName,
              quantity: item.quantity,
              unitPriceUsd: item.unitPriceUsd,
              exchangeRate: item.exchangeRate,
              taxesPesos: item.taxesPesos ?? undefined,
              boxWidthM: item.boxWidthM ?? undefined,
              boxLengthM: item.boxLengthM ?? undefined,
              boxHeightM: item.boxHeightM ?? undefined,
              boxCapacityUnits: item.boxCapacityUnits ?? undefined,
              boxCount: item.boxCount ?? undefined,
              costPerCubicMeterUsd: item.costPerCubicMeterUsd ?? undefined,
              suggestedPrice: item.suggestedPrice ?? undefined,
              referenceUrl: item.referenceUrl ?? undefined,
              imageUrl: item.imageUrl ?? undefined,
            })),
          }}
        />
      </div>
    </div>
  );
}
