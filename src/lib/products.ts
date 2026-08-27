import { db } from "@/lib/db";

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(price);
}

const productInclude = {
  images: { orderBy: { position: "asc" as const } },
  variants: true,
  features: { orderBy: { position: "asc" as const } },
  reviews: { orderBy: { createdAt: "desc" as const } },
};

export async function getActiveProducts() {
  return db.product.findMany({
    where: { status: "active" },
    orderBy: { createdAt: "asc" },
    include: productInclude,
  });
}

export async function getProductBySlug(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: productInclude,
  });
}

export type ProductWithRelations = NonNullable<
  Awaited<ReturnType<typeof getProductBySlug>>
>;

export function getHeroImageUrl(
  product: Pick<ProductWithRelations, "images">,
): string | undefined {
  return (
    product.images.find((img) => img.isHero)?.url ?? product.images[0]?.url
  );
}

export function averageRating(
  reviews: Pick<ProductWithRelations["reviews"][number], "rating">[],
): number {
  if (reviews.length === 0) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}
