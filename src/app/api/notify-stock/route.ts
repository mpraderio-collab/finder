import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stockNotifySchema } from "@/lib/validation";
import { sendStockNotificationSignup } from "@/lib/email";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = stockNotifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "El email no es válido." }, { status: 400 });
  }

  const product = await db.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true, name: true },
  });
  if (!product) {
    return NextResponse.json({ error: "El producto ya no existe." }, { status: 404 });
  }

  await db.stockNotification.upsert({
    where: {
      productId_email: { productId: product.id, email: parsed.data.email },
    },
    create: { productId: product.id, email: parsed.data.email },
    update: {},
  });

  await sendStockNotificationSignup({
    email: parsed.data.email,
    productName: product.name,
  });

  return NextResponse.json({});
}
