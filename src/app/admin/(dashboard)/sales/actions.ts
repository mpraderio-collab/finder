"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { manualSaleSchema } from "@/lib/validation";
import { upsertCustomerFromOrder } from "@/lib/customers";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}

class ManualSaleError extends Error {}

export type ManualSaleState = {
  error?: string;
  orderId?: string;
};

function parseManualSaleForm(formData: FormData) {
  let itemsRaw: unknown;
  try {
    itemsRaw = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { success: false as const, error: "Los ítems de la venta no son válidos." };
  }

  const parsed = manualSaleSchema.safeParse({
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    note: formData.get("note"),
    items: itemsRaw,
  });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Revisá los datos." };
  }
  return { success: true as const, data: parsed.data };
}

function revalidateSalesPaths(orderId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/sales");
  if (orderId) revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/products");
  revalidatePath("/catalogo");
  revalidatePath("/");
}

// Nace como borrador: no toca stock ni se cuenta como venta real hasta que
// se confirma con finalizeManualSale — así se puede seguir editando (items,
// cantidades, cliente) sin tener que ir reservando y liberando stock en
// cada cambio.
export async function createManualSale(
  _prev: ManualSaleState,
  formData: FormData,
): Promise<ManualSaleState> {
  await requireAdmin();

  const result = parseManualSaleForm(formData);
  if (!result.success) return { error: result.error };
  const data = result.data;
  // El nombre por defecto ("Venta manual") no identifica a nadie real, así
  // que no genera un registro en la tabla de clientes.
  const hasRealCustomer = String(formData.get("customerName") ?? "").trim().length > 0;

  const subtotal = data.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const order = await db.$transaction(async (tx) => {
    const customerId = hasRealCustomer
      ? await upsertCustomerFromOrder(tx, {
          name: data.customerName,
          phone: data.customerPhone,
        })
      : null;

    return tx.order.create({
      data: {
        status: "draft",
        channel: "manual",
        customerId,
        customerName: data.customerName,
        customerEmail: "",
        customerPhone: data.customerPhone ?? "",
        shippingAddress: "",
        shippingCity: "",
        shippingProvince: "",
        shippingZip: "",
        note: data.note,
        subtotal,
        total: subtotal,
        idempotencyKey: randomUUID(),
        items: {
          create: data.items.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            lineTotal: line.unitPrice * line.quantity,
            variantName: line.variantName,
          })),
        },
      },
    });
  });

  revalidateSalesPaths();
  return { orderId: order.id };
}

// Reemplaza cliente/nota/items enteros de un borrador — solo mientras
// sigue siendo borrador, no toca stock.
export async function updateManualSale(
  orderId: string,
  _prev: ManualSaleState,
  formData: FormData,
): Promise<ManualSaleState> {
  await requireAdmin();

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.channel !== "manual") return { error: "Esta venta no existe." };
  if (order.status !== "draft") {
    return { error: "Esta venta ya está confirmada y no se puede editar." };
  }

  const result = parseManualSaleForm(formData);
  if (!result.success) return { error: result.error };
  const data = result.data;
  const hasRealCustomer = String(formData.get("customerName") ?? "").trim().length > 0;

  const subtotal = data.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  await db.$transaction(async (tx) => {
    const customerId = hasRealCustomer
      ? await upsertCustomerFromOrder(tx, {
          name: data.customerName,
          phone: data.customerPhone,
        })
      : null;

    await tx.order.update({
      where: { id: orderId },
      data: {
        customerId,
        customerName: data.customerName,
        customerPhone: data.customerPhone ?? "",
        note: data.note,
        subtotal,
        total: subtotal,
      },
    });
    await tx.orderItem.deleteMany({ where: { orderId } });
    await tx.orderItem.createMany({
      data: data.items.map((line) => ({
        orderId,
        productId: line.productId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.unitPrice * line.quantity,
        variantName: line.variantName,
      })),
    });
  });

  revalidateSalesPaths(orderId);
  return { orderId };
}

// El único momento en que una venta manual mueve stock: al confirmarla se
// descuenta de verdad y pasa a contar como venta pagada. De ahí en más el
// estado se maneja como cualquier otro pedido (ver StatusSelect).
export async function finalizeManualSale(orderId: string): Promise<{ error?: string }> {
  await requireAdmin();

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: { select: { name: true } } } } },
  });
  if (!order || order.channel !== "manual") return { error: "Esta venta no existe." };
  if (order.status !== "draft") return { error: "Esta venta ya está confirmada." };
  if (order.items.length === 0) {
    return { error: "Agregá al menos un producto antes de confirmar." };
  }

  try {
    await db.$transaction(async (tx) => {
      for (const item of order.items) {
        if (item.variantName) {
          const updated = await tx.productVariant.updateMany({
            where: {
              productId: item.productId,
              name: item.variantName,
              stock: { gte: item.quantity },
            },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            throw new ManualSaleError(
              `Sin stock suficiente de ${item.product.name} (${item.variantName}).`,
            );
          }
        } else {
          const updated = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            throw new ManualSaleError(`Sin stock suficiente de ${item.product.name}.`);
          }
        }
      }
      await tx.order.update({ where: { id: orderId }, data: { status: "paid" } });
    });
  } catch (err) {
    if (err instanceof ManualSaleError) return { error: err.message };
    throw err;
  }

  revalidateSalesPaths(orderId);
  return {};
}

// Borra el borrador entero — no hay stock que reponer porque un borrador
// nunca llegó a descontarlo.
export async function discardManualSale(orderId: string): Promise<{ error?: string }> {
  await requireAdmin();

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.channel !== "manual") return { error: "Esta venta no existe." };
  if (order.status !== "draft") return { error: "Solo se pueden descartar borradores." };

  await db.order.delete({ where: { id: orderId } });

  revalidateSalesPaths();
  return {};
}
