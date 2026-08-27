import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { getPayment } from "@/lib/mercadopago";

// Ver referencia de firma de webhooks de Mercado Pago:
// x-signature: "ts=...,v1=..."  x-request-id: "..."
function isValidSignature(request: Request, dataId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // sin secreto configurado todavía, no se puede validar

  const signatureHeader = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  if (!signatureHeader || !requestId) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k?.trim(), v?.trim()];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}

function mapStatus(mpStatus: string): string {
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

export async function POST(request: Request) {
  const url = new URL(request.url);
  let dataId =
    url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "";
  let type = url.searchParams.get("type") ?? url.searchParams.get("topic") ?? "";

  if (!dataId) {
    try {
      const body = await request.json();
      dataId = body?.data?.id ?? "";
      type = body?.type ?? type;
    } catch {
      // sin body JSON válido; nos quedamos con lo que había en la query
    }
  }

  // Reconoce la notificación (200) aunque no sea de pago, para que MP no reintente en loop.
  if (type !== "payment" || !dataId) {
    return NextResponse.json({ received: true });
  }

  if (!isValidSignature(request, dataId)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  try {
    const payment = await getPayment(dataId);
    const orderId = payment.external_reference;
    if (!orderId) return NextResponse.json({ received: true });

    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ received: true });

    // Notificación duplicada para el mismo pago: no reprocesar.
    if (order.mpPaymentId === String(payment.id) && order.status !== "pending") {
      return NextResponse.json({ received: true });
    }

    const nextStatus = mapStatus(payment.status);

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
    } else {
      await db.order.update({
        where: { id: orderId },
        data: {
          status: nextStatus,
          mpPaymentId: String(payment.id),
          mpStatusDetail: payment.status_detail,
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook Mercado Pago error:", err);
    // 200 igual: evita reintentos infinitos de MP por un error nuestro transitorio ya logueado.
    return NextResponse.json({ received: true });
  }
}
