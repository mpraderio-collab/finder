"use server";

import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { calculateLineTotals, activePromotion } from "@/lib/promotions";

export type CartSyncItem = {
  productId: string;
  quantity: number;
  variantName?: string;
};

// Mantiene un único pedido "cart" en la base por sesión anónima, para que
// el admin pueda ver qué carritos hay activos o quedaron abandonados. El
// precio nunca se confía del cliente: se recalcula acá con el producto
// real, igual que en el checkout.
export async function syncCartOrder(sessionId: string, items: CartSyncItem[]): Promise<void> {
  if (!sessionId) return;

  const existing = await db.order.findFirst({
    where: { sessionId, status: "cart" },
    select: { id: true },
  });

  if (items.length === 0) {
    if (existing) await db.order.delete({ where: { id: existing.id } });
    return;
  }

  const lines: {
    key: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    variantName?: string;
    promotion: ReturnType<typeof activePromotion>;
  }[] = [];

  for (const line of items) {
    const product = await db.product.findUnique({
      where: { id: line.productId },
      include: {
        promotions: { where: { active: true }, include: { tiers: true } },
      },
    });
    if (!product) continue; // producto borrado desde que se agregó al carrito
    lines.push({
      key: `${product.id}::${line.variantName ?? ""}`,
      productId: product.id,
      quantity: line.quantity,
      unitPrice: product.price,
      variantName: line.variantName,
      promotion: activePromotion(product),
    });
  }

  const totals = calculateLineTotals(lines);
  const orderItemsData = lines.map((l) => ({
    productId: l.productId,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    lineTotal: totals.get(l.key)!,
    variantName: l.variantName,
  }));

  if (orderItemsData.length === 0) {
    if (existing) await db.order.delete({ where: { id: existing.id } });
    return;
  }

  const subtotal = orderItemsData.reduce((sum, i) => sum + i.lineTotal, 0);

  if (existing) {
    await db.$transaction([
      db.orderItem.deleteMany({ where: { orderId: existing.id } }),
      db.orderItem.createMany({
        data: orderItemsData.map((i) => ({ ...i, orderId: existing.id })),
      }),
      db.order.update({
        where: { id: existing.id },
        data: { subtotal, total: subtotal },
      }),
    ]);
  } else {
    await db.order.create({
      data: {
        status: "cart",
        channel: "online",
        sessionId,
        subtotal,
        total: subtotal,
        idempotencyKey: randomUUID(),
        items: { create: orderItemsData },
      },
    });
  }
}

export type FreshCartItem = {
  productId: string;
  variantName?: string;
  name: string;
  price: number;
  maxStock: number;
  promotion: ReturnType<typeof activePromotion>;
  // false si el producto (o la variante) ya no se vende: se borró, se archivó
  // o la variante dejó de existir.
  available: boolean;
};

// Datos actuales de lo que el cliente tiene en el carrito: precio, stock y
// promoción vigente. El carrito vive en el navegador con una copia de esos
// datos del momento en que se agregó cada producto, así que se consulta acá
// para ponerla al día antes de mostrarle el total.
export async function getFreshCartItems(
  items: { productId: string; variantName?: string }[],
): Promise<FreshCartItem[]> {
  const ids = [...new Set(items.map((i) => i.productId))].slice(0, 100);
  if (ids.length === 0) return [];

  const products = await db.product.findMany({
    where: { id: { in: ids } },
    include: {
      variants: { select: { name: true, stock: true } },
      promotions: {
        where: { active: true },
        include: { tiers: true, products: { select: { id: true, name: true, slug: true } } },
      },
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  return items.map((item) => {
    const product = byId.get(item.productId);
    const variant = item.variantName
      ? product?.variants.find((v) => v.name === item.variantName)
      : undefined;
    const available =
      !!product && product.status === "active" && (!item.variantName || !!variant);
    return {
      productId: item.productId,
      variantName: item.variantName,
      name: product?.name ?? "",
      price: product?.price ?? 0,
      maxStock: item.variantName ? (variant?.stock ?? 0) : (product?.stock ?? 0),
      promotion: product ? activePromotion(product) : null,
      available,
    };
  });
}
