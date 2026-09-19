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

// Crea y confirma la venta en un solo paso (sin pasar por borrador) —
// misma validación que createManualSale, pero descuenta stock de una y
// queda lista/enviable de entrada, como si se hubiera guardado el
// borrador y tocado "Confirmar venta" a continuación.
export async function createAndFinalizeManualSale(
  _prev: ManualSaleState,
  formData: FormData,
): Promise<ManualSaleState> {
  await requireAdmin();

  const result = parseManualSaleForm(formData);
  if (!result.success) return { error: result.error };
  const data = result.data;
  if (data.items.length === 0) {
    return { error: "Agregá al menos un producto." };
  }
  const hasRealCustomer = String(formData.get("customerName") ?? "").trim().length > 0;
  const isPaid = formData.get("isPaid") === "on";

  const subtotal = data.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  let orderId: string;
  try {
    orderId = await db.$transaction(async (tx) => {
      for (const line of data.items) {
        if (line.variantName) {
          const updated = await tx.productVariant.updateMany({
            where: { productId: line.productId, name: line.variantName, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });
          if (updated.count === 0) {
            throw new ManualSaleError("Sin stock suficiente para uno de los productos.");
          }
        } else {
          const updated = await tx.product.updateMany({
            where: { id: line.productId, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });
          if (updated.count === 0) {
            throw new ManualSaleError("Sin stock suficiente para uno de los productos.");
          }
        }
      }

      const customerId = hasRealCustomer
        ? await upsertCustomerFromOrder(tx, {
            name: data.customerName,
            phone: data.customerPhone,
          })
        : null;

      const order = await tx.order.create({
        data: {
          status: "paid",
          isPaid,
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
      return order.id;
    });
  } catch (err) {
    if (err instanceof ManualSaleError) return { error: err.message };
    throw err;
  }

  revalidateSalesPaths(orderId);
  return { orderId };
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

// Edita una venta manual ya confirmada (pagada o enviada) — a diferencia
// del borrador, acá el stock ya se descontó, así que un cambio de cantidad
// no vuelve a descontar todo de cero: se calcula la diferencia por
// producto/variante entre los ítems viejos y los nuevos, y solo se ajusta
// esa diferencia (se descuenta más si subiste la cantidad, se repone si la
// bajaste o sacaste el producto).
export async function updatePaidManualSale(
  orderId: string,
  _prev: ManualSaleState,
  formData: FormData,
): Promise<ManualSaleState> {
  await requireAdmin();

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.channel !== "manual") return { error: "Esta venta no existe." };
  if (order.status !== "paid" && order.status !== "shipped") {
    return { error: "Esta venta no se puede editar en este estado." };
  }

  const result = parseManualSaleForm(formData);
  if (!result.success) return { error: result.error };
  const data = result.data;
  const hasRealCustomer = String(formData.get("customerName") ?? "").trim().length > 0;

  const subtotal = data.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  function lineKey(productId: string, variantName?: string | null) {
    return `${productId}|${variantName ?? ""}`;
  }

  const oldQuantities = new Map<string, number>();
  for (const item of order.items) {
    const key = lineKey(item.productId, item.variantName);
    oldQuantities.set(key, (oldQuantities.get(key) ?? 0) + item.quantity);
  }
  const newQuantities = new Map<string, number>();
  for (const line of data.items) {
    const key = lineKey(line.productId, line.variantName);
    newQuantities.set(key, (newQuantities.get(key) ?? 0) + line.quantity);
  }
  const allKeys = new Set([...oldQuantities.keys(), ...newQuantities.keys()]);

  try {
    await db.$transaction(async (tx) => {
      const customerId = hasRealCustomer
        ? await upsertCustomerFromOrder(tx, {
            name: data.customerName,
            phone: data.customerPhone,
          })
        : null;

      for (const key of allKeys) {
        const [productId, variantName] = key.split("|");
        const delta = (newQuantities.get(key) ?? 0) - (oldQuantities.get(key) ?? 0);
        if (delta === 0) continue;

        if (variantName) {
          if (delta > 0) {
            const updated = await tx.productVariant.updateMany({
              where: { productId, name: variantName, stock: { gte: delta } },
              data: { stock: { decrement: delta } },
            });
            if (updated.count === 0) {
              throw new ManualSaleError("Sin stock suficiente para aplicar este cambio.");
            }
          } else {
            await tx.productVariant.updateMany({
              where: { productId, name: variantName },
              data: { stock: { increment: -delta } },
            });
          }
        } else {
          if (delta > 0) {
            const updated = await tx.product.updateMany({
              where: { id: productId, stock: { gte: delta } },
              data: { stock: { decrement: delta } },
            });
            if (updated.count === 0) {
              throw new ManualSaleError("Sin stock suficiente para aplicar este cambio.");
            }
          } else {
            await tx.product.updateMany({
              where: { id: productId },
              data: { stock: { increment: -delta } },
            });
          }
        }
      }

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
  } catch (err) {
    if (err instanceof ManualSaleError) return { error: err.message };
    throw err;
  }

  revalidateSalesPaths(orderId);
  return { orderId };
}

// El único momento en que una venta manual mueve stock: al confirmarla se
// descuenta de verdad, sin importar si ya se cobró o no — `isPaid` es
// independiente del estado (se puede vender/enviar fiado). De ahí en más
// el estado se maneja como cualquier otro pedido (ver StatusSelect), y el
// pago se puede marcar después con setManualSalePaid.
export async function finalizeManualSale(
  orderId: string,
  isPaid: boolean,
): Promise<{ error?: string }> {
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
      await tx.order.update({ where: { id: orderId }, data: { status: "paid", isPaid } });
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

// Marca (o desmarca) el cobro de una venta manual ya confirmada — para
// cuando se vendió/envió fiado y el cliente paga después. No toca stock
// ni el estado de fulfillment (status).
export async function setManualSalePaid(orderId: string, isPaid: boolean): Promise<{ error?: string }> {
  await requireAdmin();

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.channel !== "manual") return { error: "Esta venta no existe." };
  if (order.status === "draft") return { error: "Confirmá la venta antes de marcar el pago." };

  await db.order.update({ where: { id: orderId }, data: { isPaid } });

  revalidateSalesPaths(orderId);
  return {};
}
