import { NextResponse } from "next/server";
import { getActiveProducts, getHeroImageUrl } from "@/lib/products";

export async function GET() {
  const products = await getActiveProducts();
  return NextResponse.json({
    products: products.map((p) => ({
      slug: p.slug,
      name: p.name,
      tagline: p.tagline,
      price: p.price,
      image: getHeroImageUrl(p) ?? null,
    })),
  });
}
