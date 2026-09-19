import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { checkoutSchema } from "@/lib/validation";
import { createPreference, isMercadoPagoConfigured } from "@/lib/mercadopago";
import { shippingMethods } from "@/lib/shipping";
import { calculateLineTotals, activePromotion } from "@/lib/promotions";
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
      const lines: {
        key: string;
        productId: string;
        quantity: number;
        unitPrice: number;
        variantName?: string;
        promotion: ReturnType<typeof activePromotion>;
      }[] = [];

      for (const line of data.items) {
        const product = await tx.product.findUnique({
          where: { id: line.productId },
          include: {
            variants: true,
            promotions: { where: { active: true }, include: { tiers: true } },
          },
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

        lines.push({
          key: `${product.id}::${line.variantName ?? ""}`,
          productId: product.id,
          quantity: line.quantity,
          unitPrice: product.price,
          variantName: line.variantName,
          promotion: activePromotion(product),
        });
      }

      const totals = calculateLineTotals(lines);
      const orderItemsData = lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        lineTotal: totals.get(l.key)!,
        variantName: l.variantName,
      }));
      const subtotal = orderItemsData.reduce((sum, i) => sum + i.lineTotal, 0);

      // El cupón se valida acá, nunca se confía en nada que mande el
      // cliente más que el código — se aplica sobre el subtotal ya con
      // promociones, nunca sobre el envío.
      const coupon = data.couponCode
        ? await tx.coupon.findFirst({
            where: { code: data.couponCode.toUpperCase(), active: true },
          })
        : null;
      if (data.couponCode && !coupon) {
        throw new CheckoutError(`El cupón "${data.couponCode}" no es válido.`);
      }
      const couponDiscount = coupon ? Math.round((subtotal * coupon.percentOff) / 100) : 0;

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
        couponId: coupon?.id ?? null,
        couponDiscount,
        subtotal,
        total: subtotal - couponDiscount + shippingCost,
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

    // Mercado Pago no acepta unit_price negativo, así que el cupón no se
    // manda como un ítem de descuento aparte: se reparte proporcionalmente
    // entre los ítems de producto (el envío queda afuera, el cupón nunca
    // aplica sobre el envío). El redondeo de cada línea se ajusta en la
    // última para que la suma coincida exacto con order.total.
    const productItemsPreDiscount = order.items.map((item) => ({
      title: `${item.product.name}${item.variantName ? ` (${item.variantName})` : ""} x${item.quantity}`,
      amount: item.lineTotal ?? item.unitPrice * item.quantity,
    }));
    const preDiscountSum = productItemsPreDiscount.reduce((sum, i) => sum + i.amount, 0);
    const targetSum = preDiscountSum - order.couponDiscount;
    let runningSum = 0;
    const productItems = productItemsPreDiscount.map((item, idx) => {
      const isLast = idx === productItemsPreDiscount.length - 1;
      const unit_price = isLast
        ? targetSum - runningSum
        : preDiscountSum > 0
          ? Math.round((item.amount / preDiscountSum) * targetSum)
          : 0;
      runningSum += unit_price;
      return { title: item.title, quantity: 1, unit_price, currency_id: "ARS" as const };
    });

    const preference = await createPreference({
      orderId: order.id,
      payerEmail: order.customerEmail,
      items: [
        ...productItems,
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
