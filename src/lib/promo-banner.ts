import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";

const SHIPPING_MESSAGE = "Envío a todo el país";

function percent(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value).replace(".", ",");
}

type BannerPromo = {
  triggerType: string;
  tiers: { threshold: number; percentOff: number }[];
  productCount: number;
};

// Texto de una promoción para la franja de arriba del sitio, armado con sus
// tramos reales: "10% off llevando 3 productos — combinalos como quieras".
export function promotionBannerMessage(promo: BannerPromo): string | null {
  if (promo.tiers.length === 0 || promo.productCount === 0) return null;
  const tiers = [...promo.tiers].sort((a, b) => a.threshold - b.threshold);
  if (promo.triggerType === "amount") {
    return tiers
      .map((t) => `${percent(t.percentOff)}% off en compras desde ${formatPrice(t.threshold)}`)
      .join(" · ");
  }
  const text = tiers
    .map(
      (t) =>
        `${percent(t.percentOff)}% off llevando ${t.threshold} ${t.threshold === 1 ? "producto" : "productos"}`,
    )
    .join(" · ");
  return promo.productCount > 1 ? `${text} — combinalos como quieras` : text;
}

// Mensajes de la franja del header: el envío y una frase por cada promoción
// activa. Se leen de la base, así cambian apenas se crea o edita una promo.
export async function getBannerMessages(): Promise<string[]> {
  const promotions = await db.promotion.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    include: {
      tiers: { select: { threshold: true, percentOff: true } },
      _count: { select: { products: true } },
    },
  });
  const messages = promotions
    .map((p) =>
      promotionBannerMessage({
        triggerType: p.triggerType,
        tiers: p.tiers,
        productCount: p._count.products,
      }),
    )
    .filter((m): m is string => m !== null);
  return [SHIPPING_MESSAGE, ...messages];
}
