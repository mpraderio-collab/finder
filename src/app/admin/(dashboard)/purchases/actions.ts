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

export type PurchaseActionState = {
  error?: string;
  purchaseId?: string;
};

function parsePurchaseForm(formData: FormData) {
  let itemsRaw: unknown;
  try {
    itemsRaw = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { success: false as const, error: "Los ítems de la compra no son válidos." };
  }

  const parsed = purchaseSchema.safeParse({
    supplierName: formData.get("supplierName"),
    purchaseDate: formData.get("purchaseDate"),
    items: itemsRaw,
  });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Revisá los datos." };
  }
  return { success: true as const, data: parsed.data };
}

function revalidatePurchasePaths(productIds: (string | null | undefined)[] = []) {
  revalidatePath("/admin/purchases");
  revalidatePath("/admin/products");
  for (const id of productIds) {
    if (id) revalidatePath(`/admin/products/${id}`);
  }
  revalidatePath("/catalogo");
  revalidatePath("/");
}

function buildItemsData(items: ReturnType<typeof purchaseSchema.parse>["items"]) {
  // Cotización, impuestos, costo por m³ y recargo por tarjeta son datos del
  // lote completo (se cargan una sola vez en el form) — los impuestos se
  // prorratean entre TODAS las unidades de la compra, no solo las de cada
  // línea; el envío se calcula por línea (una caja por línea, ver
  // calcPurchaseCosts) y nunca se prorratea entre unidades.
  const totalLotQuantity = items.reduce((sum, line) => sum + line.quantity, 0);
  return items.map((line) => {
    const costs = calcPurchaseCosts({ ...line, totalLotQuantity });
    return {
      productId: line.productId || null,
      productName: line.productName,
      quantity: line.quantity,
      unitPriceUsd: line.unitPriceUsd,
      exchangeRate: line.exchangeRate,
      taxesPesos: line.taxesPesos ?? null,
      taxesUsd: costs.taxesUsd ?? null,
      netUsd: costs.netUsd,
      totalUsd: costs.totalUsd,
      unitCostUsd: costs.unitCostUsd,
      unitCostUsdFinal: costs.unitCostUsdFinal,
      unitCostPesos: costs.unitCostPesos,
      boxWidthM: line.boxWidthM ?? null,
      boxLengthM: line.boxLengthM ?? null,
      boxHeightM: line.boxHeightM ?? null,
      costPerCubicMeterUsd: line.costPerCubicMeterUsd ?? null,
      boxShippingCostUsd: costs.boxShippingCostUsd ?? null,
      suggestedPrice: line.suggestedPrice ?? null,
    };
  });
}

// Toda compra nace como borrador — se puede seguir editando (agregar,
// sacar o cambiar líneas) hasta que se confirma. No toca stock ni costo de
// ningún producto todavía.
export async function createPurchase(
  _prev: PurchaseActionState,
  formData: FormData,
): Promise<PurchaseActionState> {
  await requireAdmin();

  const result = parsePurchaseForm(formData);
  if (!result.success) return { error: result.error };
  const data = result.data;

  const purchase = await db.$transaction(async (tx) => {
    const supplierId = data.supplierName
      ? await upsertSupplierByName(tx, data.supplierName)
      : null;

    return tx.purchase.create({
      data: {
        supplierId,
        purchaseDate: data.purchaseDate,
        status: "draft",
        items: { create: buildItemsData(data.items) },
      },
    });
  });

  revalidatePurchasePaths(data.items.map((i) => i.productId));
  return { purchaseId: purchase.id };
}

// Reemplaza proveedor/fecha/líneas enteras de un borrador — solo mientras
// sigue siendo borrador, no toca stock.
export async function updatePurchase(
  purchaseId: string,
  _prev: PurchaseActionState,
  formData: FormData,
): Promise<PurchaseActionState> {
  await requireAdmin();

  const existing = await db.purchase.findUnique({ where: { id: purchaseId } });
  if (!existing) return { error: "Esta compra no existe." };
  if (existing.status !== "draft") {
    return { error: "Esta compra ya no es un borrador y no se puede editar." };
  }

  const result = parsePurchaseForm(formData);
  if (!result.success) return { error: result.error };
  const data = result.data;

  await db.$transaction(async (tx) => {
    const supplierId = data.supplierName
      ? await upsertSupplierByName(tx, data.supplierName)
      : null;

    await tx.purchase.update({
      where: { id: purchaseId },
      data: { supplierId, purchaseDate: data.purchaseDate },
    });
    await tx.purchaseItem.deleteMany({ where: { purchaseId } });
    await tx.purchaseItem.createMany({
      data: buildItemsData(data.items).map((item) => ({ ...item, purchaseId })),
    });
  });

  revalidatePurchasePaths(data.items.map((i) => i.productId));
  return { purchaseId };
}

// draft -> confirmed: el pedido ya se hizo al proveedor, todavía no llegó.
export async function confirmPurchase(purchaseId: string): Promise<{ error?: string }> {
  await requireAdmin();

  const purchase = await db.purchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) return { error: "Esta compra no existe." };
  if (purchase.status !== "draft") return { error: "Esta compra ya no es un borrador." };

  await db.purchase.update({ where: { id: purchaseId }, data: { status: "confirmed" } });
  revalidatePurchasePaths();
  return {};
}

// confirmed -> received: acá es cuando se suma stock y se actualiza el
// costo de cada línea con producto vinculado — el único momento en que una
// compra toca el catálogo.
export async function receivePurchase(purchaseId: string): Promise<{ error?: string }> {
  await requireAdmin();

  const purchase = await db.purchase.findUnique({
    where: { id: purchaseId },
    include: { items: true },
  });
  if (!purchase) return { error: "Esta compra no existe." };
  if (purchase.status !== "confirmed") {
    return { error: "Solo se puede recibir una compra confirmada." };
  }
  const linkedItems = purchase.items.filter((i) => i.productId);
  if (linkedItems.length === 0) {
    return { error: "Vinculá al menos un producto antes de recibir esta compra." };
  }

  await db.$transaction([
    db.purchase.update({ where: { id: purchaseId }, data: { status: "received" } }),
    ...linkedItems.map((item) =>
      db.product.update({
        where: { id: item.productId! },
        data: {
          stock: { increment: item.quantity },
          costPrice: item.unitCostPesos,
        },
      }),
    ),
  ]);

  revalidatePurchasePaths(purchase.items.map((i) => i.productId));
  return {};
}

// draft o confirmed -> cancelled. No toca stock (nunca se llegó a recibir).
export async function cancelPurchase(purchaseId: string): Promise<{ error?: string }> {
  await requireAdmin();

  const purchase = await db.purchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) return { error: "Esta compra no existe." };
  if (purchase.status !== "draft" && purchase.status !== "confirmed") {
    return { error: "Esta compra ya está recibida o cancelada." };
  }

  await db.purchase.update({ where: { id: purchaseId }, data: { status: "cancelled" } });
  revalidatePurchasePaths();
  return {};
}

// Solo se puede borrar un borrador — una vez confirmada, la compra queda
// como historial (se cancela, no se borra). Las líneas se borran en
// cascada.
export async function deletePurchase(purchaseId: string): Promise<{ error?: string }> {
  await requireAdmin();

  const purchase = await db.purchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) return { error: "Esta compra no existe." };
  if (purchase.status !== "draft") {
    return { error: "Solo se pueden borrar borradores — cancelá esta compra en vez de borrarla." };
  }

  await db.purchase.delete({ where: { id: purchaseId } });
  revalidatePurchasePaths();
  return {};
}
