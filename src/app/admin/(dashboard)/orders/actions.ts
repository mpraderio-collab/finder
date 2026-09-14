"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { orderStatusSchema } from "@/lib/validation";

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
