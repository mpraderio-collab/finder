import { db } from "@/lib/db";

function slugify(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100) || "producto"
  );
}

// Recibe una compra confirmada: suma el stock de cada línea y actualiza el costo del
// producto. Las líneas que no estaban vinculadas a un producto se agregan a la lista de
// productos: si ya hay uno con el mismo nombre se vincula a ese, y si no se crea uno
// nuevo con el costo de la compra y el precio de venta sugerido (o el doble del costo
// si no se cargó). Los productos nuevos quedan archivados — ocultos en la tienda — hasta
// que se les complete la descripción y se publiquen desde Productos.
export async function applyPurchaseReceipt(purchaseId: string): Promise<{
  error?: string;
  productIds: string[];
  created: number;
  linked: number;
}> {
  const purchase = await db.purchase.findUnique({
    where: { id: purchaseId },
    include: { items: true },
  });
  if (!purchase) return { error: "Esta compra no existe.", productIds: [], created: 0, linked: 0 };
  if (purchase.status !== "confirmed") {
    return {
      error: "Solo se puede recibir una compra confirmada.",
      productIds: [],
      created: 0,
      linked: 0,
    };
  }
  if (purchase.items.length === 0) {
    return { error: "Esta compra no tiene líneas.", productIds: [], created: 0, linked: 0 };
  }

  const productIds: string[] = [];
  let created = 0;
  let linked = 0;

  await db.$transaction(
    async (tx) => {
      await tx.purchase.update({ where: { id: purchaseId }, data: { status: "received" } });

      for (const item of purchase.items) {
        let productId = item.productId;

        if (!productId) {
          const name = item.productName.trim();
          const existing = await tx.product.findFirst({
            where: { name: { equals: name, mode: "insensitive" } },
            select: { id: true },
          });

          if (existing) {
            productId = existing.id;
            linked++;
          } else {
            const base = slugify(name);
            let slug = base;
            for (let n = 2; await tx.product.findUnique({ where: { slug }, select: { id: true } }); n++) {
              slug = `${base}-${n}`;
            }
            const newProduct = await tx.product.create({
              data: {
                slug,
                name,
                tagline: name,
                description: "Producto cargado desde una compra: falta completar la descripción.",
                price: Math.max(1, item.suggestedPrice ?? item.unitCostPesos * 2),
                stock: 0,
                status: "archived",
                ...(item.imageUrl
                  ? { images: { create: { url: item.imageUrl, type: "image", position: 0, isHero: true } } }
                  : {}),
              },
              select: { id: true },
            });
            productId = newProduct.id;
            created++;
          }

          await tx.purchaseItem.update({ where: { id: item.id }, data: { productId } });
        }

        await tx.product.update({
          where: { id: productId },
          data: { stock: { increment: item.quantity }, costPrice: item.unitCostPesos },
        });
        productIds.push(productId);
      }
    },
    { timeout: 30_000 },
  );

  return { productIds, created, linked };
}
