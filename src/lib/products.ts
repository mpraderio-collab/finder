import { db } from "@/lib/db";
import { isMockData, mockProducts } from "@/lib/mock-data";

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(price);
}

const productInclude = {
  images: { orderBy: { position: "asc" as const } },
  variants: {
    include: { images: { orderBy: { position: "asc" as const } } },
  },
  features: { orderBy: { position: "asc" as const } },
  specs: { orderBy: { position: "asc" as const } },
  reviews: {
    where: { approved: true },
    orderBy: { createdAt: "desc" as const },
  },
  promotions: {
    where: { active: true },
    include: {
      tiers: { orderBy: { threshold: "asc" as const } },
      products: { select: { id: true, name: true, slug: true } },
    },
  },
};

function queryActiveProducts() {
  return db.product.findMany({
    where: { status: "active" },
    orderBy: { createdAt: "asc" },
    include: productInclude,
  });
}

function queryProductBySlug(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: productInclude,
  });
}

export type ProductWithRelations = NonNullable<
  Awaited<ReturnType<typeof queryProductBySlug>>
>;

export async function getActiveProducts() {
  if (isMockData()) return mockProducts as unknown as ProductWithRelations[];
  return queryActiveProducts();
}

export async function getProductBySlug(slug: string) {
  if (isMockData()) {
    const all = mockProducts as unknown as ProductWithRelations[];
    return all.find((p) => p.slug === slug) ?? null;
  }
  return queryProductBySlug(slug);
}

export function getHeroImageUrl(
  product: Pick<ProductWithRelations, "images">,
): string | undefined {
  // Un video nunca sirve de portada donde se necesita una <Image> estática
  // (tarjetas de catálogo, carrito, home).
  const photos = product.images.filter((img) => img.type !== "video");
  return photos.find((img) => img.isHero)?.url ?? photos[0]?.url;
}

export function averageRating(
  reviews: Pick<ProductWithRelations["reviews"][number], "rating">[],
): number {
  if (reviews.length === 0) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}
