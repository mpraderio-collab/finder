import { NextResponse } from "next/server";
import { reviewSchema } from "@/lib/validation";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Revisá los datos del formulario." }, { status: 400 });
  }

  // El campo señuelo (website) llega vacío para personas; si trae contenido
  // fingimos éxito sin guardar nada, para no delatarle al bot que lo filtramos.
  if (parsed.data.website) {
    return NextResponse.json({});
  }

  const product = await db.product.findUnique({
    where: { id: parsed.data.productId, status: "active" },
    select: { id: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  await db.review.create({
    data: {
      productId: product.id,
      author: parsed.data.author,
      rating: parsed.data.rating,
      text: parsed.data.text,
      photoUrl: parsed.data.photoUrl || null,
      approved: false,
      isMocked: false,
    },
  });

  return NextResponse.json({});
}
