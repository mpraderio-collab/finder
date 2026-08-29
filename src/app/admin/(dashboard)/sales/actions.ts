"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { manualSaleSchema } from "@/lib/validation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}

class ManualSaleError extends Error {}

export type ManualSaleState = {
  error?: string;
  orderId?: string;
};

export async function createManualSale(
  _prev: ManualSaleState,
  formData: FormData,
): Promise<ManualSaleState> {
  await requireAdmin();

  let itemsRaw: unknown;
  try {
    itemsRaw = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Los ítems de la venta no son válidos." };
  }

  const parsed = manualSaleSchema.safeParse({
    customerName: formData.get("customerName"),
    note: formData.get("note"),
    items: itemsRaw,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisá los datos." };
  }

  const data = parsed.data;

  try {
    const order = await db.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsData: {
        productId: string;
        quantity: number;
        unitPrice: number;
        variantName?: string;
      }[] = [];

      for (const line of data.items) {
        const product = await tx.product.findUnique({
          where: { id: line.productId },
          include: { variants: true },
        });
        if (!product) {
          throw new ManualSaleError("Uno de los productos ya no existe.");
        }

        if (line.variantName) {
          const variant = product.variants.find((v) => v.name === line.variantName);
          if (!variant) {
            throw new ManualSaleError(
              `La variante "${line.variantName}" de ${product.name} ya no existe.`,
            );
          }
          const updated = await tx.productVariant.updateMany({
            where: { id: variant.id, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });
          if (updated.count === 0) {
            throw new ManualSaleError(
              `Sin stock suficiente de ${product.name} (${line.variantName}).`,
            );
          }
        } else {
          const updated = await tx.product.updateMany({
            where: { id: product.id, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });
          if (updated.count === 0) {
            throw new ManualSaleError(`Sin stock suficiente de ${product.name}.`);
          }
        }

        subtotal += line.unitPrice * line.quantity;
        orderItemsData.push({
          productId: product.id,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          variantName: line.variantName,
        });
      }

      return tx.order.create({
        data: {
          status: "paid",
          channel: "manual",
          customerName: data.customerName,
          customerEmail: "",
          customerPhone: "",
          shippingAddress: "",
          shippingCity: "",
          shippingProvince: "",
          shippingZip: "",
          note: data.note,
          subtotal,
          total: subtotal,
          idempotencyKey: randomUUID(),
          items: { create: orderItemsData },
        },
      });
    });

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/products");
    revalidatePath("/catalogo");

    return { orderId: order.id };
  } catch (err) {
    if (err instanceof ManualSaleError) return { error: err.message };
    throw err;
  }
}
