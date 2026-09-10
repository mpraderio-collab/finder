"use server";

import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { calculateLineTotal, normalizePromo } from "@/lib/promotions";

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

  const orderItemsData: {
    productId: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    variantName?: string;
  }[] = [];

  for (const line of items) {
    const product = await db.product.findUnique({ where: { id: line.productId } });
    if (!product) continue; // producto borrado desde que se agregó al carrito
    const lineTotal = calculateLineTotal(product.price, line.quantity, normalizePromo(product));
    orderItemsData.push({
      productId: product.id,
      quantity: line.quantity,
      unitPrice: product.price,
      lineTotal,
      variantName: line.variantName,
    });
  }

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
