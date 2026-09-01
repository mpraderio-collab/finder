import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trackEventSchema } from "@/lib/validation";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = trackEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Evento inválido." }, { status: 400 });
  }

  // Best-effort: un evento de analytics perdido no puede tirar abajo nada.
  await db.analyticsEvent
    .create({ data: parsed.data })
    .catch((err) => console.error("Error guardando evento de analytics:", err));

  return NextResponse.json({});
}
