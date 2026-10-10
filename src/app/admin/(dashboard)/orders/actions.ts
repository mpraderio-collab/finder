"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { orderStatusSchema } from "@/lib/validation";
import { setManualSalePaid } from "../sales/actions";
import { onlineSaleStates, manualSaleStates, type SaleState } from "@/lib/order-status";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<{ error?: string }> {
  await requireAdmin();

  const parsed = orderStatusSchema.safeParse(status);
  if (!parsed.success) return { error: "Estado inválido." };

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "El pedido ya no existe." };

  // Cancelar un pedido pago repone el stock reservado — de la variante
  // correcta cuando el ítem tiene una, igual que en el webhook de MP.
  if (parsed.data === "cancelled" && order.status !== "cancelled") {
    const items = await db.orderItem.findMany({ where: { orderId } });
    await db.$transaction([
      ...items.map((item) =>
        item.variantName
          ? db.productVariant.updateMany({
              where: { productId: item.productId, name: item.variantName },
              data: { stock: { increment: item.quantity } },
            })
          : db.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            }),
      ),
      db.order.update({ where: { id: orderId }, data: { status: parsed.data } }),
    ]);
  } else {
    await db.order.update({ where: { id: orderId }, data: { status: parsed.data } });
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return {};
}

// Cambia solo el estado de la VENTA (cobro / cancelación), dejando el envío
// como estaba. Por debajo usa el mismo `status` de siempre: una venta pagada
// y ya enviada sigue siendo "shipped".
export async function setSaleState(orderId: string, state: string): Promise<{ error?: string }> {
  await requireAdmin();

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "El pedido ya no existe." };
  if (order.status === "cart" || order.status === "draft") {
    return { error: "Confirmá la venta antes de cambiar su estado." };
  }

  const allowed = order.channel === "manual" ? manualSaleStates : onlineSaleStates;
  if (!allowed.includes(state as SaleState)) return { error: "Estado inválido." };

  if (state === "cancelled") return updateOrderStatus(orderId, "cancelled");

  if (order.channel === "manual") {
    // Las ventas manuales cobran con un flag aparte; el estado del envío no cambia.
    if (order.status === "cancelled") {
      const res = await updateOrderStatus(orderId, "paid");
      if (res.error) return res;
    }
    return setManualSalePaid(orderId, state === "paid");
  }

  // Online: pagada conserva el envío (shipped sigue shipped); pendiente o
  // fallida implican que todavía no hay nada para enviar.
  const next = state === "paid" ? (order.status === "shipped" ? "shipped" : "paid") : state;
  return updateOrderStatus(orderId, next);
}

// Cambia solo el estado del ENVÍO (enviado / sin enviar), dejando el cobro como estaba.
export async function setShippingState(orderId: string, shipped: boolean): Promise<{ error?: string }> {
  await requireAdmin();

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "El pedido ya no existe." };
  if (order.status === "cart" || order.status === "draft") {
    return { error: "Confirmá la venta antes de marcar el envío." };
  }
  if (order.status === "cancelled" || order.status === "failed") {
    return { error: "Una venta cancelada o con pago fallido no se envía." };
  }
  // Un pedido online que todavía no se pagó no puede salir. En una venta
  // manual se puede enviar fiado, así que ahí no se exige.
  if (shipped && order.channel === "online" && order.status === "pending") {
    return { error: "Marcá la venta como pagada antes de enviarla." };
  }

  return updateOrderStatus(orderId, shipped ? "shipped" : "paid");
}

export async function setTrackingCode(
  orderId: string,
  trackingCode: string,
): Promise<{ error?: string }> {
  await requireAdmin();

  const trimmed = trackingCode.trim();
  if (trimmed.length === 0 || trimmed.length > 60) {
    return { error: "El código tiene que tener entre 1 y 60 caracteres." };
  }

  await db.order.update({
    where: { id: orderId },
    data: { trackingCode: trimmed },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  return {};
}

// Solo aplica a pedidos que se envían sueltos (no agrupados) — el costo
// real de un envío agrupado vive en el Shipment, no acá.
export async function setActualShippingCost(
  orderId: string,
  value: string,
): Promise<{ error?: string }> {
  await requireAdmin();

  const parsed = Number(value);
  if (value.trim() === "" || !Number.isFinite(parsed) || parsed < 0) {
    return { error: "Ingresá un monto válido." };
  }

  await db.order.update({
    where: { id: orderId },
    data: { actualShippingCost: Math.round(parsed) },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  return {};
}
