import { db } from "@/lib/db";
import type { MlApiOrder } from "./types";

// Importa (o actualiza) una venta de Mercado Libre. Es idempotente: se puede
// llamar las veces que haga falta con la misma orden — por la sincronización
// periódica y por los avisos de ML — y siempre deja una sola fila por orden.
//
// `sellerShippingCost` es lo que paga el vendedor por el envío; viene de otra
// consulta a la API (el costo del envío), por eso se pasa aparte.
export async function importMlOrder(
  order: MlApiOrder,
  opts: { sellerShippingCost?: number } = {},
): Promise<{ id: string; created: boolean; unlinkedItems: number }> {
  const mlOrderId = String(order.id);
  const listings = await db.mlListing.findMany({
    where: { mlItemId: { in: order.order_items.map((i) => i.item.id) } },
  });
  const byItemId = new Map(listings.map((l) => [l.mlItemId, l]));

  const items = order.order_items.map((line) => {
    const listing = byItemId.get(line.item.id);
    return {
      mlItemId: line.item.id,
      title: line.item.title ?? "",
      quantity: line.quantity,
      unitPrice: Math.round(line.unit_price),
      saleFee: Math.round((line.sale_fee ?? 0) * line.quantity),
      productId: listing?.productId ?? null,
      variantName: listing?.variantName ?? null,
    };
  });

  const data = {
    status: order.status,
    dateCreated: new Date(order.date_created),
    buyerNickname: order.buyer?.nickname ?? "",
    totalAmount: Math.round(order.total_amount),
    sellerShippingCost: Math.round(opts.sellerShippingCost ?? 0),
    shipmentId: order.shipping?.id != null ? String(order.shipping.id) : null,
  };

  const existing = await db.mlOrder.findUnique({ where: { mlOrderId }, select: { id: true } });
  const saved = await db.$transaction(async (tx) => {
    const row = existing
      ? await tx.mlOrder.update({ where: { id: existing.id }, data })
      : await tx.mlOrder.create({ data: { mlOrderId, ...data } });
    await tx.mlOrderItem.deleteMany({ where: { orderId: row.id } });
    await tx.mlOrderItem.createMany({ data: items.map((i) => ({ ...i, orderId: row.id })) });
    return row;
  });

  return {
    id: saved.id,
    created: !existing,
    unlinkedItems: items.filter((i) => !i.productId).length,
  };
}

// Al vincular (o re-vincular) una publicación, las ventas ya importadas de
// esa publicación pasan a apuntar al producto elegido.
export async function relinkMlItems(
  mlItemId: string,
  productId: string,
  variantName: string | null,
): Promise<number> {
  const res = await db.mlOrderItem.updateMany({
    where: { mlItemId },
    data: { productId, variantName },
  });
  return res.count;
}
