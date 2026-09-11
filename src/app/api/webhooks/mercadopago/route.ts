import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { applyPaymentToOrder } from "@/lib/order-fulfillment";

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
    await applyPaymentToOrder(dataId);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook Mercado Pago error:", err);
    // 500, no 200: si devolvemos "recibido" con un error real (DB caída,
    // MP_ACCESS_TOKEN vencido, etc.) Mercado Pago nunca reintenta y el pago
    // queda acreditado en MP pero invisible acá para siempre — ya pasó una
    // vez. Con 500, MP reintenta la notificación varias veces.
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
