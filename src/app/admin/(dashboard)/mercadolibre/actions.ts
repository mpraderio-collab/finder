"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { normalizeMlItemId } from "@/lib/mercadolibre/listing";
import { relinkMlItems } from "@/lib/mercadolibre/import";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}

export type ListingActionState = { error?: string; success?: string };

function revalidateMl() {
  revalidatePath("/admin/mercadolibre");
  revalidatePath("/admin/mercadolibre/publicaciones");
}

// Vincula una publicación de Mercado Libre con un producto de Finder (y,
// opcionalmente, con una variante). Si la publicación ya estaba vinculada, la
// re-apunta. Las ventas ya importadas de esa publicación se actualizan solas.
export async function saveListing(
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  await requireAdmin();

  const mlItemId = normalizeMlItemId(String(formData.get("mlItemId") ?? ""));
  if (!mlItemId) {
    return { error: "No reconozco ese código. Pegá el código de la publicación (MLA…) o su link." };
  }
  const productId = String(formData.get("productId") ?? "");
  const variantName = String(formData.get("variantName") ?? "").trim() || null;

  const product = await db.product.findUnique({
    where: { id: productId },
    include: { variants: { select: { name: true } } },
  });
  if (!product) return { error: "Elegí un producto." };
  if (variantName && !product.variants.some((v) => v.name === variantName)) {
    return { error: "Esa variante no existe en el producto elegido." };
  }

  await db.mlListing.upsert({
    where: { mlItemId },
    create: { mlItemId, productId, variantName, title: product.name },
    update: { productId, variantName },
  });
  const relinked = await relinkMlItems(mlItemId, productId, variantName);

  revalidateMl();
  return {
    success:
      relinked > 0
        ? `Vinculada. ${relinked} ${relinked === 1 ? "venta ya importada se actualizó" : "ventas ya importadas se actualizaron"}.`
        : "Vinculada.",
  };
}

export async function deleteListing(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const listing = await db.mlListing.findUnique({ where: { id } });
  if (!listing) return {};
  await db.$transaction([
    // Las ventas importadas de esta publicación vuelven a quedar sin vincular.
    db.mlOrderItem.updateMany({
      where: { mlItemId: listing.mlItemId },
      data: { productId: null, variantName: null },
    }),
    db.mlListing.delete({ where: { id } }),
  ]);
  revalidateMl();
  return {};
}
