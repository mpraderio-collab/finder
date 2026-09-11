import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { checkoutSchema } from "@/lib/validation";
import { createPreference, isMercadoPagoConfigured } from "@/lib/mercadopago";
import { shippingMethods } from "@/lib/shipping";
import { calculateLineTotal, normalizePromo } from "@/lib/promotions";
import { upsertCustomerFromOrder } from "@/lib/customers";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = parsed.data;

  try {
    const order = await db.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsData: {
        productId: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
        variantName?: string;
      }[] = [];

      for (const line of data.items) {
        const product = await tx.product.findUnique({
          where: { id: line.productId },
          include: { variants: true },
        });

        if (!product || product.status !== "active") {
          throw new CheckoutError(
            `Uno de los productos del carrito ya no está disponible.`,
          );
        }

        if (line.variantName) {
          const variant = product.variants.find(
            (v) => v.name === line.variantName,
          );
          if (!variant) {
            throw new CheckoutError(
              `La variante "${line.variantName}" de ${product.name} ya no existe.`,
            );
          }
          const updated = await tx.productVariant.updateMany({
            where: { id: variant.id, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });
          if (updated.count === 0) {
            throw new CheckoutError(
              `Sin stock suficiente de ${product.name} (${line.variantName}).`,
            );
          }
        } else {
          const updated = await tx.product.updateMany({
            where: { id: product.id, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });
          if (updated.count === 0) {
            throw new CheckoutError(`Sin stock suficiente de ${product.name}.`);
          }
        }

        const lineTotal = calculateLineTotal(
          product.price,
          line.quantity,
          normalizePromo(product),
        );
        subtotal += lineTotal;
        orderItemsData.push({
          productId: product.id,
          quantity: line.quantity,
          unitPrice: product.price,
          lineTotal,
          variantName: line.variantName,
        });
      }

      const shippingCost = shippingMethods[data.shippingMethod].cost;

      const customerId = await upsertCustomerFromOrder(tx, {
        name: data.customerName,
        email: data.customerEmail,
        phone: data.customerPhone,
        address: data.shippingAddress,
        city: data.shippingCity,
        province: data.shippingProvince,
        zip: data.shippingZip,
      });

      const orderData = {
        status: "pending",
        customerId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        shippingAddress: data.shippingAddress,
        shippingCity: data.shippingCity,
        shippingProvince: data.shippingProvince,
        shippingZip: data.shippingZip,
        shippingMethod: data.shippingMethod,
        shippingCost,
        subtotal,
        total: subtotal + shippingCost,
      };

      // Si este carrito ya estaba siendo trackeado (ver cart-actions.ts), se
      // reutiliza el mismo pedido en vez de crear uno duplicado — así el
      // admin ve un solo registro por compra, del carrito al envío.
      const cartOrder = data.sessionId
        ? await tx.order.findFirst({
            where: { sessionId: data.sessionId, status: "cart" },
            select: { id: true },
          })
        : null;

      if (cartOrder) {
        await tx.orderItem.deleteMany({ where: { orderId: cartOrder.id } });
        return tx.order.update({
          where: { id: cartOrder.id },
          data: { ...orderData, sessionId: null, items: { create: orderItemsData } },
          include: { items: { include: { product: true } } },
        });
      }

      return tx.order.create({
        data: { ...orderData, idempotencyKey: randomUUID(), items: { create: orderItemsData } },
        include: { items: { include: { product: true } } },
      });
    });

    if (!isMercadoPagoConfigured()) {
      return NextResponse.json({
        orderId: order.id,
        paymentUnavailable: true,
      });
    }

    const preference = await createPreference({
      orderId: order.id,
      payerEmail: order.customerEmail,
      items: [
        ...order.items.map((item) => ({
          // quantity 1 con unit_price = total de la línea: evita tener que
          // partir el precio promocional en un unit_price fraccionario
          // cuando la cantidad no es múltiplo exacto de la promo.
          title: `${item.product.name}${item.variantName ? ` (${item.variantName})` : ""} x${item.quantity}`,
          quantity: 1,
          unit_price: item.lineTotal ?? item.unitPrice * item.quantity,
          currency_id: "ARS" as const,
        })),
        ...(order.shippingCost > 0
          ? [
              {
                title: "Envío",
                quantity: 1,
                unit_price: order.shippingCost,
                currency_id: "ARS" as const,
              },
            ]
          : []),
      ],
    });

    await db.order.update({
      where: { id: order.id },
      data: { mpPreferenceId: preference.id },
    });

    return NextResponse.json({
      orderId: order.id,
      initPoint: preference.init_point,
    });
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "No pudimos procesar el pedido. Intentá de nuevo." },
      { status: 500 },
    );
  }
}

class CheckoutError extends Error {}
