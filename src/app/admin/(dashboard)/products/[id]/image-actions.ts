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

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadProductImage(
  productId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Elegí un archivo de imagen." };
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return { error: "Formato no soportado. Usá JPG, PNG o WEBP." };
  }
  if (file.size > MAX_SIZE) {
    return { error: "La imagen pesa más de 5MB." };
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

  await db.productImage.create({
    data: {
      productId,
      url: `/products/${product.slug}/${filename}`,
      position: product.images.length,
      isHero: product.images.length === 0,
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

  // Si se borró la imagen principal, la siguiente pasa a serlo.
  if (image.isHero) {
    const next = await db.productImage.findFirst({
      where: { productId },
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

export async function setHeroImage(productId: string, imageId: string) {
  await requireAdmin();

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
}
