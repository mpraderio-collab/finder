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

  // Cancelar un pedido pago repone el stock reservado.
  if (parsed.data === "cancelled" && order.status !== "cancelled") {
    const items = await db.orderItem.findMany({ where: { orderId } });
    await db.$transaction([
      ...items.map((item) =>
        db.product.update({
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
