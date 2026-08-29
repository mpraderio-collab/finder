"use server";

import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}

// Los archivos ya no se escriben a disco: se suben directo del navegador a
// Vercel Blob (ver /api/upload-token) porque las funciones de Vercel
// rechazan cualquier request de más de 4.5MB, y un video puede pesar mucho
// más que eso. Estas acciones solo persisten la URL que Blob ya generó.

async function safeDeleteBlob(url: string) {
  if (!url.startsWith("http")) return; // archivo local heredado, no en Blob
  await del(url).catch(() => {
    // El blob puede ya no existir; no es un error fatal.
  });
}

export async function attachProductImage(
  productId: string,
  url: string,
  contentType: string,
): Promise<{ error?: string }> {
  await requireAdmin();

  const product = await db.product.findUnique({
    where: { id: productId },
    include: { images: true },
  });
  if (!product) return { error: "El producto ya no existe." };

  const isVideo = contentType.startsWith("video/");
  const hasImageHero = product.images.some((img) => img.type === "image" && img.isHero);

  await db.productImage.create({
    data: {
      productId,
      url,
      type: isVideo ? "video" : "image",
      position: product.images.length,
      isHero: !isVideo && !hasImageHero,
    },
  });

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/catalogo");
  revalidatePath(`/catalogo/${product.slug}`);
  revalidatePath("/");
  return {};
}

export async function deleteProductImage(
  productId: string,
  imageId: string,
): Promise<{ error?: string }> {
  await requireAdmin();

  const image = await db.productImage.findUnique({ where: { id: imageId } });
  if (!image || image.productId !== productId) {
    return { error: "La imagen ya no existe." };
  }

  await db.productImage.delete({ where: { id: imageId } });

  // Si se borró la imagen principal, la siguiente FOTO (nunca un video)
  // pasa a serlo.
  if (image.isHero) {
    const next = await db.productImage.findFirst({
      where: { productId, type: "image" },
      orderBy: { position: "asc" },
    });
    if (next) {
      await db.productImage.update({
        where: { id: next.id },
        data: { isHero: true },
      });
    }
  }

  await safeDeleteBlob(image.url);

  const product = await db.product.findUnique({ where: { id: productId } });
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/catalogo");
  if (product) revalidatePath(`/catalogo/${product.slug}`);
  revalidatePath("/");
  return {};
}

export async function reorderProductImages(
  productId: string,
  orderedIds: string[],
): Promise<{ error?: string }> {
  await requireAdmin();

  const images = await db.productImage.findMany({ where: { productId } });
  if (
    images.length !== orderedIds.length ||
    !images.every((img) => orderedIds.includes(img.id))
  ) {
    return { error: "El orden no coincide con las imágenes actuales." };
  }

  await db.$transaction(
    orderedIds.map((id, index) =>
      db.productImage.update({ where: { id }, data: { position: index } }),
    ),
  );

  const product = await db.product.findUnique({ where: { id: productId } });
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/catalogo");
  if (product) revalidatePath(`/catalogo/${product.slug}`);
  revalidatePath("/");
  return {};
}

export async function attachVariantImage(
  variantId: string,
  url: string,
): Promise<{ error?: string }> {
  await requireAdmin();

  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });
  if (!variant) return { error: "La variante ya no existe." };

  if (variant.imageUrl) await safeDeleteBlob(variant.imageUrl);

  await db.productVariant.update({
    where: { id: variantId },
    data: { imageUrl: url },
  });

  revalidatePath(`/admin/products/${variant.productId}`);
  revalidatePath("/catalogo");
  revalidatePath(`/catalogo/${variant.product.slug}`);
  revalidatePath("/");
  return {};
}

export async function setHeroImage(
  productId: string,
  imageId: string,
): Promise<{ error?: string }> {
  await requireAdmin();

  const image = await db.productImage.findUnique({ where: { id: imageId } });
  if (!image || image.productId !== productId) {
    return { error: "La imagen ya no existe." };
  }
  if (image.type === "video") {
    return { error: "Un video no puede ser la foto principal." };
  }

  await db.$transaction([
    db.productImage.updateMany({
      where: { productId },
      data: { isHero: false },
    }),
    db.productImage.update({ where: { id: imageId }, data: { isHero: true } }),
  ]);

  const product = await db.product.findUnique({ where: { id: productId } });
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/catalogo");
  if (product) revalidatePath(`/catalogo/${product.slug}`);
  revalidatePath("/");
  return {};
}
