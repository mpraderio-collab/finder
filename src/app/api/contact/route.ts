import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validation";
import { sendContactMessage } from "@/lib/email";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Revisá los datos del formulario." }, { status: 400 });
  }

  // El campo señuelo (website) llega vacío para personas; si trae contenido
  // fingimos éxito sin mandar nada, para no delatarle al bot que lo filtramos.
  if (parsed.data.website) {
    return NextResponse.json({});
  }

  const res = await sendContactMessage({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? "",
    message: parsed.data.message,
  });

  if (res.error) {
    return NextResponse.json({ error: res.error }, { status: 502 });
  }
  return NextResponse.json({});
}
