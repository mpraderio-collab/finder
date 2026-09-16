"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { promotionSchema } from "@/lib/validation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}

export type PromotionActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function parseForm(formData: FormData) {
  let tiers: unknown = [];
  try {
    tiers = JSON.parse(String(formData.get("tiersJson") ?? "[]"));
  } catch {
    tiers = [];
  }
  return promotionSchema.safeParse({
    name: formData.get("name"),
    triggerType: formData.get("triggerType"),
    active: formData.get("active") === "on",
    productIds: formData.getAll("productIds"),
    tiers,
  });
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

async function revalidateProductPages(productIds: string[]) {
  if (productIds.length === 0) return;
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { slug: true },
  });
  for (const p of products) {
    revalidatePath(`/catalogo/${p.slug}`);
  }
}

// Un producto participa en, como máximo, una promoción activa a la vez —
// evita que dos promos compitan por el mismo producto con tramos distintos.
async function findConflictingProducts(productIds: string[], excludePromotionId?: string) {
  const products = await db.product.findMany({
    where: {
      id: { in: productIds },
      promotions: {
        some: {
          active: true,
          ...(excludePromotionId ? { id: { not: excludePromotionId } } : {}),
        },
      },
    },
    select: { name: true },
  });
  return products.map((p) => p.name);
}

export async function createPromotion(
  _prev: PromotionActionState,
  formData: FormData,
): Promise<PromotionActionState> {
  await requireAdmin();

  const result = parseForm(formData);
  if (!result.success) {
    return { error: "Revisá los campos marcados.", fieldErrors: toFieldErrors(result) };
  }
  const data = result.data;

  if (data.active) {
    const conflicts = await findConflictingProducts(data.productIds);
    if (conflicts.length > 0) {
      return {
        error: `Ya tienen otra promo activa: ${conflicts.join(", ")}.`,
        fieldErrors: { productIds: "Elegí productos sin otra promo activa" },
      };
    }
  }

  const promotion = await db.promotion.create({
    data: {
      name: data.name,
      triggerType: data.triggerType,
      active: data.active,
      products: { connect: data.productIds.map((id) => ({ id })) },
      tiers: {
        create: data.tiers.map((t) => ({ threshold: t.threshold, percentOff: t.percentOff })),
      },
    },
  });

  await revalidateProductPages(data.productIds);
  revalidatePath("/admin/promotions");
  revalidatePath("/admin/products");
  revalidatePath("/catalogo");
  revalidatePath("/");
  redirect(`/admin/promotions/${promotion.id}`);
}

export async function updatePromotion(
  id: string,
  _prev: PromotionActionState,
  formData: FormData,
): Promise<PromotionActionState> {
  await requireAdmin();

  const result = parseForm(formData);
  if (!result.success) {
    return { error: "Revisá los campos marcados.", fieldErrors: toFieldErrors(result) };
  }
  const data = result.data;

  if (data.active) {
    const conflicts = await findConflictingProducts(data.productIds, id);
    if (conflicts.length > 0) {
      return {
        error: `Ya tienen otra promo activa: ${conflicts.join(", ")}.`,
        fieldErrors: { productIds: "Elegí productos sin otra promo activa" },
      };
    }
  }

  const previous = await db.promotion.findUnique({
    where: { id },
    select: { products: { select: { id: true } } },
  });

  await db.$transaction([
    db.promotion.update({
      where: { id },
      data: {
        name: data.name,
        triggerType: data.triggerType,
        active: data.active,
        products: { set: data.productIds.map((pid) => ({ id: pid })) },
      },
    }),
    db.promotionTier.deleteMany({ where: { promotionId: id } }),
    db.promotionTier.createMany({
      data: data.tiers.map((t) => ({
        promotionId: id,
        threshold: t.threshold,
        percentOff: t.percentOff,
      })),
    }),
  ]);

  const previousIds = previous?.products.map((p) => p.id) ?? [];
  await revalidateProductPages([...new Set([...previousIds, ...data.productIds])]);
  revalidatePath("/admin/promotions");
  revalidatePath(`/admin/promotions/${id}`);
  revalidatePath("/admin/products");
  revalidatePath("/catalogo");
  revalidatePath("/");
  return {};
}

export async function deletePromotion(id: string): Promise<{ error?: string }> {
  await requireAdmin();

  const promotion = await db.promotion.delete({
    where: { id },
    include: { products: { select: { id: true } } },
  });

  await revalidateProductPages(promotion.products.map((p) => p.id));
  revalidatePath("/admin/promotions");
  revalidatePath("/admin/products");
  revalidatePath("/catalogo");
  revalidatePath("/");
  return {};
}
