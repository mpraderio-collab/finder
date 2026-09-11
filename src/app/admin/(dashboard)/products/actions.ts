"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { featuresTextSchema, productSchema, type ProductFormValues } from "@/lib/validation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}

export type ProductActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function parseForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    tagline: formData.get("tagline"),
    description: formData.get("description"),
    price: formData.get("price"),
    costPrice: formData.get("costPrice"),
    stock: formData.get("stock"),
    status: formData.get("status") ?? "active",
    promoQuantity: formData.get("promoQuantity"),
    promoPrice: formData.get("promoPrice"),
  });
}

function parseFeatures(formData: FormData) {
  return featuresTextSchema.parse(formData.get("features") ?? "");
}

// `undefined` en promoQuantity/promoPrice significa "sin promo" para el
// form, pero para Prisma un update con `undefined` deja el valor anterior
// sin tocar — hay que mandar `null` explícito para poder borrar una promo
// ya cargada.
function toProductData(data: ProductFormValues) {
  return {
    ...data,
    promoQuantity: data.promoQuantity ?? null,
    promoPrice: data.promoPrice ?? null,
  };
}

function toFieldErrors(result: ReturnType<typeof parseForm>) {
  if (result.success) return {};
  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

export async function createProduct(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireAdmin();

  const result = parseForm(formData);
  if (!result.success) {
    return { error: "Revisá los campos marcados.", fieldErrors: toFieldErrors(result) };
  }
  const features = parseFeatures(formData);

  try {
    const product = await db.product.create({
      data: {
        ...toProductData(result.data),
        features: {
          create: features.map((text, position) => ({ text, position })),
        },
      },
    });
    revalidatePath("/admin/products");
    revalidatePath("/catalogo");
    revalidatePath("/");
    redirect(`/admin/products/${product.id}`);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return {
        error: "Ya existe un producto con ese slug.",
        fieldErrors: { slug: "Este slug ya está en uso" },
      };
    }
    throw err;
  }
}

export async function updateProduct(
  id: string,
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireAdmin();

  const result = parseForm(formData);
  if (!result.success) {
    return { error: "Revisá los campos marcados.", fieldErrors: toFieldErrors(result) };
  }
  const features = parseFeatures(formData);

  try {
    // Se borran y se recrean todas las características en vez de tratar de
    // hacer un diff — es una lista corta que se edita entera desde un
    // textarea, no una a la vez.
    await db.$transaction([
      db.product.update({ where: { id }, data: toProductData(result.data) }),
      db.productFeature.deleteMany({ where: { productId: id } }),
      db.productFeature.createMany({
        data: features.map((text, position) => ({ productId: id, text, position })),
      }),
    ]);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return {
        error: "Ya existe un producto con ese slug.",
        fieldErrors: { slug: "Este slug ya está en uso" },
      };
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return { error: "Este producto ya no existe." };
    }
    throw err;
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/catalogo");
  revalidatePath(`/catalogo/${result.data.slug}`);
  revalidatePath("/");
  return {};
}

// Un producto con pedidos asociados no se puede borrar sin romper el historial
// de compras, así que se archiva en vez de eliminarse.
export async function archiveProduct(id: string) {
  await requireAdmin();
  await db.product.update({ where: { id }, data: { status: "archived" } });
  revalidatePath("/admin/products");
  revalidatePath("/catalogo");
  revalidatePath("/");
}

export async function restoreProduct(id: string) {
  await requireAdmin();
  await db.product.update({ where: { id }, data: { status: "active" } });
  revalidatePath("/admin/products");
  revalidatePath("/catalogo");
  revalidatePath("/");
}

export async function updateVariantStock(
  variantId: string,
  stock: number,
): Promise<{ error?: string }> {
  await requireAdmin();

  if (!Number.isInteger(stock) || stock < 0) {
    return { error: "El stock tiene que ser un entero mayor o igual a 0." };
  }

  const variant = await db.productVariant.update({
    where: { id: variantId },
    data: { stock },
    select: { productId: true },
  });

  revalidatePath(`/admin/products/${variant.productId}`);
  revalidatePath("/catalogo");
  revalidatePath("/");
  return {};
}

export async function addVariantStock(
  variantId: string,
  amount: number,
): Promise<{ error?: string; newStock?: number }> {
  await requireAdmin();

  if (!Number.isInteger(amount) || amount <= 0) {
    return { error: "Ingresá una cantidad entera mayor a 0." };
  }

  const variant = await db.productVariant.update({
    where: { id: variantId },
    data: { stock: { increment: amount } },
    select: { productId: true, stock: true },
  });

  revalidatePath(`/admin/products/${variant.productId}`);
  revalidatePath("/catalogo");
  revalidatePath("/");
  return { newStock: variant.stock };
}

export async function deleteProduct(id: string): Promise<{ error?: string }> {
  await requireAdmin();

  const orderCount = await db.orderItem.count({ where: { productId: id } });
  if (orderCount > 0) {
    return {
      error: `Este producto tiene ${orderCount} pedido(s) asociados. Archivalo en vez de borrarlo.`,
    };
  }

  await db.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  revalidatePath("/catalogo");
  revalidatePath("/");
  return {};
}
