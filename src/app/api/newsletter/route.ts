import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterSchema } from "@/lib/validation";
import { sendNewsletterSignup } from "@/lib/email";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "El email no es válido." }, { status: 400 });
  }

  const existing = await db.newsletterSubscriber.findUnique({
    where: { email: parsed.data.email },
  });
  if (!existing) {
    await db.newsletterSubscriber.create({ data: { email: parsed.data.email } });
    await sendNewsletterSignup(parsed.data.email);
  }

  return NextResponse.json({});
}
