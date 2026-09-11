import { db } from "@/lib/db";
import { getPayment } from "@/lib/mercadopago";
import { sendOrderConfirmationToCustomer, sendOrderNotificationToAdmin } from "@/lib/email";

function mapPaymentStatus(mpStatus: string): string {
  switch (mpStatus) {
    case "approved":
      return "paid";
    case "rejected":
      return "failed";
    case "cancelled":
    case "refunded":
    case "charged_back":
      return "cancelled";
    default:
      return "pending"; // in_process, pending, authorized, ...
  }
}

// Aplica el resultado de un pago de Mercado Pago a un pedido: descuenta o
// repone stock según corresponda, actualiza el estado, y en la transición a
// pagado registra el evento de compra y manda los mails. Se llama desde el
// webhook (camino normal) y desde la página de éxito del checkout (red de
// contención — ver comentario ahí: el webhook puede no llegar a procesar
// una notificación a tiempo, o nunca, y el pago ya está cobrado igual).
export async function applyPaymentToOrder(dataId: string): Promise<void> {
  const payment = await getPayment(dataId);
  const orderId = payment.external_reference;
  if (!orderId) return;

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return;

  // Notificación duplicada para el mismo pago: no reprocesar.
  if (order.mpPaymentId === String(payment.id) && order.status !== "pending") {
    return;
  }

  const nextStatus = mapPaymentStatus(payment.status);

  if (
    (nextStatus === "cancelled" || nextStatus === "failed") &&
    order.status !== "cancelled" &&
    order.status !== "failed"
  ) {
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
      db.order.update({
        where: { id: orderId },
        data: {
          status: nextStatus,
          mpPaymentId: String(payment.id),
          mpStatusDetail: payment.status_detail,
        },
      }),
    ]);
    return;
  }

  if (nextStatus === "paid" && order.status !== "paid") {
    const items = await db.orderItem.findMany({ where: { orderId } });
    await db.$transaction([
      ...items.map((item) =>
        item.variantName
          ? db.productVariant.updateMany({
              where: { productId: item.productId, name: item.variantName },
              data: { stock: { decrement: item.quantity } },
            })
          : db.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            }),
      ),
      db.order.update({
        where: { id: orderId },
        data: {
          status: nextStatus,
          mpPaymentId: String(payment.id),
          mpStatusDetail: payment.status_detail,
        },
      }),
    ]);

    await db.analyticsEvent
      .create({ data: { type: "purchase", value: order.total } })
      .catch((err) => console.error("Error guardando evento de compra:", err));

    const itemsWithProduct = await db.orderItem.findMany({
      where: { orderId },
      include: { product: { select: { name: true } } },
    });
    const emailData = {
      id: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingAddress: order.shippingAddress,
      shippingCity: order.shippingCity,
      shippingProvince: order.shippingProvince,
      shippingZip: order.shippingZip,
      total: order.total,
      items: itemsWithProduct.map((item) => ({
        productName: item.product.name,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
    };
    await Promise.all([
      sendOrderNotificationToAdmin(emailData).catch((err) =>
        console.error("Error notificando pedido al admin:", err),
      ),
      sendOrderConfirmationToCustomer(emailData).catch((err) =>
        console.error("Error confirmando pedido al cliente:", err),
      ),
    ]);
    return;
  }

  await db.order.update({
    where: { id: orderId },
    data: {
      status: nextStatus,
      mpPaymentId: String(payment.id),
      mpStatusDetail: payment.status_detail,
    },
  });
}
