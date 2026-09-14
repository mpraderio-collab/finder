import { formatPrice } from "@/lib/products";

export type PromotionTierInfo = { threshold: number; percentOff: number };

export type PromotionInfo = {
  id: string;
  triggerType: string; // "quantity" | "amount"
  tiers: PromotionTierInfo[];
  products?: { id: string; name: string; slug: string }[];
};

export type PromoLine = {
  key: string;
  unitPrice: number;
  quantity: number;
  promotion: PromotionInfo | null;
};

// El % del tramo más alto que ya se alcanzó con este total (unidades o
// pesos, según corresponda) — 0 si ninguno.
function bestPercentOff(tiers: PromotionTierInfo[], metric: number): number {
  let best = 0;
  for (const tier of tiers) {
    if (metric >= tier.threshold && tier.percentOff > best) best = tier.percentOff;
  }
  return best;
}

// Agrupa las líneas por promoción — así se combinan productos distintos de
// una misma promo (mix and match) — y devuelve el total real de cada línea
// con el descuento del tramo alcanzado ya aplicado. Las líneas sin promo (o
// cuya promo no tiene tramos) se cobran al precio normal.
export function calculateLineTotals(lines: PromoLine[]): Map<string, number> {
  const totals = new Map<string, number>();
  const groups = new Map<string, PromoLine[]>();

  for (const line of lines) {
    if (!line.promotion || line.promotion.tiers.length === 0) {
      totals.set(line.key, line.unitPrice * line.quantity);
      continue;
    }
    const list = groups.get(line.promotion.id) ?? [];
    list.push(line);
    groups.set(line.promotion.id, list);
  }

  for (const groupLines of groups.values()) {
    const promo = groupLines[0].promotion!;
    const totalQuantity = groupLines.reduce((sum, l) => sum + l.quantity, 0);
    const totalAmount = groupLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    const metric = promo.triggerType === "amount" ? totalAmount : totalQuantity;
    const percentOff = bestPercentOff(promo.tiers, metric);
    for (const line of groupLines) {
      const raw = line.unitPrice * line.quantity;
      totals.set(line.key, percentOff > 0 ? Math.round(raw * (1 - percentOff / 100)) : raw);
    }
  }

  return totals;
}

// Atajo para una sola línea (ficha de producto, antes de saber qué más hay
// en el carrito) — mismo cálculo que arriba, con un único elemento.
export function calculateSingleLineTotal(
  unitPrice: number,
  quantity: number,
  promotion: PromotionInfo | null,
): number {
  return calculateLineTotals([
    { key: "single", unitPrice, quantity, promotion },
  ]).get("single")!;
}

// El % de descuento que ya se alcanza comprando solo esta cantidad de este
// producto (sin contar el resto del carrito) — para el cartel de la ficha.
export function currentPercentOff(
  promotion: PromotionInfo | null,
  unitPrice: number,
  quantity: number,
): number {
  if (!promotion) return 0;
  const metric = promotion.triggerType === "amount" ? unitPrice * quantity : quantity;
  return bestPercentOff(promotion.tiers, metric);
}

// El % más alto que ofrece la promo en cualquier tramo — para el cartel
// corto de la tarjeta de catálogo ("Hasta 15% off").
export function maxPercentOff(promotion: PromotionInfo): number {
  return promotion.tiers.reduce((max, t) => Math.max(max, t.percentOff), 0);
}

// Texto de un tramo para mostrarlo en la ficha de producto o en el admin.
export function tierLabel(promotion: Pick<PromotionInfo, "triggerType">, tier: PromotionTierInfo): string {
  const condition =
    promotion.triggerType === "amount"
      ? `Desde ${formatPrice(tier.threshold)}`
      : `Llevando ${tier.threshold}+`;
  return `${condition}: ${tier.percentOff}% off`;
}

// Adapta la forma que devuelve Prisma (producto con su relación de
// promociones activas) a `PromotionInfo` — por convención, un producto
// participa en como máximo una promo activa a la vez.
export function activePromotion(product: {
  promotions: {
    id: string;
    triggerType: string;
    tiers: PromotionTierInfo[];
    products?: { id: string; name: string; slug: string }[];
  }[];
}): PromotionInfo | null {
  const promo = product.promotions[0];
  if (!promo) return null;
  return {
    id: promo.id,
    triggerType: promo.triggerType,
    tiers: promo.tiers,
    products: promo.products,
  };
}
