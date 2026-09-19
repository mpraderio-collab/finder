import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const code =
    typeof body === "object" && body !== null && "code" in body
      ? String((body as { code: unknown }).code).trim().toUpperCase()
      : "";
  if (!code) {
    return NextResponse.json({ error: "Ingresá un código." }, { status: 400 });
  }

  const coupon = await db.coupon.findFirst({ where: { code, active: true } });
  if (!coupon) {
    return NextResponse.json({ error: "Ese código no existe o ya no es válido." }, { status: 404 });
  }

  return NextResponse.json({ code: coupon.code, percentOff: coupon.percentOff });
}
