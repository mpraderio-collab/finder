"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { shipmentSchema } from "@/lib/validation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}

export type ShipmentActionState = {
  error?: string;
  shipmentId?: string;
};

// Agrupa los pedidos elegidos (web o manuales, de cualquier cliente) en un
// mismo envío: crea el registro y pasa todos los pedidos a "shipped" de una,
// con el mismo transporte/código de seguimiento si se cargó uno.
export async function createShipment(
  _prev: ShipmentActionState,
  formData: FormData,
): Promise<ShipmentActionState> {
  await requireAdmin();

  const result = shipmentSchema.safeParse({
    orderIds: formData.getAll("orderIds"),
    shippingMethod: formData.get("shippingMethod"),
    trackingCode: formData.get("trackingCode"),
    note: formData.get("note"),
  });
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Revisá los datos." };
  }
  const data = result.data;

  const orders = await db.order.findMany({
    where: { id: { in: data.orderIds } },
    select: { id: true, status: true },
  });
  if (orders.length !== data.orderIds.length) {
    return { error: "Alguno de los pedidos elegidos ya no existe." };
  }
  const notPaid = orders.find((o) => o.status !== "paid");
  if (notPaid) {
    return { error: "Todos los pedidos elegidos tienen que estar pagados, pendientes de envío." };
  }

  const shipment = await db.$transaction(async (tx) => {
    const created = await tx.shipment.create({
      data: {
        shippingMethod: data.shippingMethod ?? null,
        trackingCode: data.trackingCode ?? null,
        note: data.note ?? null,
      },
    });

    await tx.order.updateMany({
      where: { id: { in: data.orderIds } },
      data: {
        shipmentId: created.id,
        status: "shipped",
        ...(data.trackingCode ? { trackingCode: data.trackingCode } : {}),
        ...(data.shippingMethod ? { shippingMethod: data.shippingMethod } : {}),
      },
    });

    return created;
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin/sales");
  revalidatePath("/admin/shipments");
  for (const id of data.orderIds) revalidatePath(`/admin/orders/${id}`);

  return { shipmentId: shipment.id };
}
