"use server";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const ALLOWED_VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export async function uploadProductImage(
  productId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Elegí un archivo." };
  }

  const isVideo = file.type in ALLOWED_VIDEO_TYPES;
  const ext = isVideo ? ALLOWED_VIDEO_TYPES[file.type] : ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) {
    return { error: "Formato no soportado. Usá JPG, PNG, WEBP (foto) o MP4, WEBM, MOV (video)." };
  }
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_SIZE;
  if (file.size > maxSize) {
    return {
      error: isVideo
        ? "El video pesa más de 50MB."
        : "La imagen pesa más de 5MB.",
    };
  }

  const product = await db.product.findUnique({
    where: { id: productId },
    include: { images: true },
  });
  if (!product) return { error: "El producto ya no existe." };

  const dir = path.join(process.cwd(), "public", "products", product.slug);
  await mkdir(dir, { recursive: true });

  // Nombre aleatorio: nunca confiar en el nombre de archivo original para
  // construir una ruta en disco (evita path traversal).
  const filename = `${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);

  // Un video nunca se vuelve automáticamente la foto principal: la
  // portada del producto (catálogo, tarjetas, carrito) siempre necesita
  // ser una imagen renderizable con <Image>.
  const hasImageHero = product.images.some((img) => img.type === "image" && img.isHero);

  await db.productImage.create({
    data: {
      productId,
      url: `/products/${product.slug}/${filename}`,
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

  const filePath = path.join(process.cwd(), "public", image.url);
  await unlink(filePath).catch(() => {
    // El archivo puede ya no existir en disco; no es un error fatal.
  });

  const product = await db.product.findUnique({ where: { id: productId } });
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/catalogo");
  if (product) revalidatePath(`/catalogo/${product.slug}`);
  revalidatePath("/");
  return {};
}

export async function uploadVariantImage(
  variantId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Elegí un archivo de imagen." };
  }

  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) {
    return { error: "Formato no soportado. Usá JPG, PNG o WEBP." };
  }
  if (file.size > MAX_SIZE) {
    return { error: "La imagen pesa más de 5MB." };
  }

  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });
  if (!variant) return { error: "La variante ya no existe." };

  const dir = path.join(process.cwd(), "public", "products", variant.product.slug);
  await mkdir(dir, { recursive: true });

  const filename = `variant-${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);

  await db.productVariant.update({
    where: { id: variantId },
    data: { imageUrl: `/products/${variant.product.slug}/${filename}` },
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
