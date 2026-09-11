"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { purchaseSchema } from "@/lib/validation";
import { calcPurchaseCosts } from "@/lib/purchases";
import { upsertSupplierByName } from "@/lib/suppliers";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}

function toFieldErrors(result: ReturnType<typeof parsePurchaseForm>) {
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

export type PurchaseActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  purchaseId?: string;
};

function parsePurchaseForm(formData: FormData) {
  const result = purchaseSchema.safeParse({
    productId: formData.get("productId"),
    productName: formData.get("productName"),
    supplierName: formData.get("supplierName"),
    purchaseDate: formData.get("purchaseDate"),
    quantity: formData.get("quantity"),
    unitPriceUsd: formData.get("unitPriceUsd"),
    exchangeRate: formData.get("exchangeRate"),
    taxesPesos: formData.get("taxesPesos"),
    shippingCostUsd: formData.get("shippingCostUsd"),
    suggestedPrice: formData.get("suggestedPrice"),
    applyToStock: formData.get("applyToStock"),
  });
  return result;
}

function revalidatePurchasePaths(productId?: string | null) {
  revalidatePath("/admin/purchases");
  revalidatePath("/admin/products");
  if (productId) revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/catalogo");
  revalidatePath("/");
}

export async function createPurchase(
  _prev: PurchaseActionState,
  formData: FormData,
): Promise<PurchaseActionState> {
  await requireAdmin();

  const result = parsePurchaseForm(formData);
  if (!result.success) {
    return {
      error: "Revisá los campos marcados.",
      fieldErrors: toFieldErrors(result),
    };
  }
  const data = result.data;
  const costs = calcPurchaseCosts(data);

  const purchase = await db.$transaction(async (tx) => {
    const supplierId = data.supplierName
      ? await upsertSupplierByName(tx, data.supplierName)
      : null;

    const applyNow = data.applyToStock && Boolean(data.productId);

    const created = await tx.purchase.create({
      data: {
        productId: data.productId ?? null,
        productName: data.productName,
        supplierId,
        purchaseDate: data.purchaseDate,
        quantity: data.quantity,
        unitPriceUsd: data.unitPriceUsd,
        exchangeRate: data.exchangeRate,
        taxesPesos: data.taxesPesos ?? null,
        taxesUsd: costs.taxesUsd ?? null,
        netUsd: costs.netUsd,
        totalUsd: costs.totalUsd,
        unitCostUsd: costs.unitCostUsd,
        shippingCostUsd: data.shippingCostUsd ?? null,
        unitShippingCostUsd: costs.unitShippingCostUsd ?? null,
        unitCostUsdFinal: costs.unitCostUsdFinal,
        unitCostPesos: costs.unitCostPesos,
        suggestedPrice: data.suggestedPrice ?? null,
        appliedToStock: applyNow,
      },
    });

    if (applyNow && data.productId) {
      await tx.product.update({
        where: { id: data.productId },
        data: {
          stock: { increment: data.quantity },
          costPrice: costs.unitCostPesos,
        },
      });
    }

    return created;
  });

  revalidatePurchasePaths(data.productId);
  return { purchaseId: purchase.id };
}

// Edita los datos de la compra. No vuelve a tocar stock/costo del producto
// si ya se habían aplicado antes — para eso existe applyPurchaseNow, que se
// usa cuando una compra se carga sin producto vinculado y después se quiere
// aplicar (por ejemplo, al dar de alta el producto nuevo).
export async function updatePurchase(
  purchaseId: string,
  _prev: PurchaseActionState,
  formData: FormData,
): Promise<PurchaseActionState> {
  await requireAdmin();

  const existing = await db.purchase.findUnique({ where: { id: purchaseId } });
  if (!existing) return { error: "Esta compra no existe." };

  const result = parsePurchaseForm(formData);
  if (!result.success) {
    return {
      error: "Revisá los campos marcados.",
      fieldErrors: toFieldErrors(result),
    };
  }
  const data = result.data;
  const costs = calcPurchaseCosts(data);

  await db.$transaction(async (tx) => {
    const supplierId = data.supplierName
      ? await upsertSupplierByName(tx, data.supplierName)
      : null;

    // Recién se puede aplicar acá si todavía no se había aplicado antes —
    // evita sumar el stock dos veces.
    const applyNow = !existing.appliedToStock && data.applyToStock && Boolean(data.productId);

    await tx.purchase.update({
      where: { id: purchaseId },
      data: {
        productId: data.productId ?? null,
        productName: data.productName,
        supplierId,
        purchaseDate: data.purchaseDate,
        quantity: data.quantity,
        unitPriceUsd: data.unitPriceUsd,
        exchangeRate: data.exchangeRate,
        taxesPesos: data.taxesPesos ?? null,
        taxesUsd: costs.taxesUsd ?? null,
        netUsd: costs.netUsd,
        totalUsd: costs.totalUsd,
        unitCostUsd: costs.unitCostUsd,
        shippingCostUsd: data.shippingCostUsd ?? null,
        unitShippingCostUsd: costs.unitShippingCostUsd ?? null,
        unitCostUsdFinal: costs.unitCostUsdFinal,
        unitCostPesos: costs.unitCostPesos,
        suggestedPrice: data.suggestedPrice ?? null,
        ...(applyNow ? { appliedToStock: true } : {}),
      },
    });

    if (applyNow && data.productId) {
      await tx.product.update({
        where: { id: data.productId },
        data: {
          stock: { increment: data.quantity },
          costPrice: costs.unitCostPesos,
        },
      });
    }
  });

  revalidatePurchasePaths(data.productId ?? existing.productId);
  return { purchaseId };
}

export async function deletePurchase(purchaseId: string): Promise<{ error?: string }> {
  await requireAdmin();

  const purchase = await db.purchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) return { error: "Esta compra no existe." };

  await db.purchase.delete({ where: { id: purchaseId } });
  revalidatePurchasePaths(purchase.productId);
  return {};
}
