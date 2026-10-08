"use server";

import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { MOCK_DATA } from "@/lib/mock-data";
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
  if (!sessionId || MOCK_DATA) return;

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
