export type Promo = { promoQuantity: number; promoPrice: number };

// Normaliza los dos campos sueltos del producto en un objeto Promo, o null
// si el producto no tiene promoción configurada (falta alguno de los dos).
export function normalizePromo(product: {
  promoQuantity: number | null;
  promoPrice: number | null;
}): Promo | null {
  if (!product.promoQuantity || !product.promoPrice) return null;
  return { promoQuantity: product.promoQuantity, promoPrice: product.promoPrice };
}

// Aplica la promo por cada grupo completo de promoQuantity unidades; el
// resto (si la cantidad no es múltiplo exacto) se cobra al precio normal.
// Ej: unitPrice 25000, promo "2 por 45000", quantity 3 -> 45000 + 25000.
export function calculateLineTotal(
  unitPrice: number,
  quantity: number,
  promo: Promo | null | undefined,
): number {
  if (!promo || quantity < promo.promoQuantity) return unitPrice * quantity;
  const sets = Math.floor(quantity / promo.promoQuantity);
  const remainder = quantity % promo.promoQuantity;
  return sets * promo.promoPrice + remainder * unitPrice;
}

// Cuánto se ahorra al comprar exactamente promoQuantity unidades — el
// número que tiene sentido mostrar en el cartel de la ficha de producto.
export function promoSavings(unitPrice: number, promo: Promo): number {
  return unitPrice * promo.promoQuantity - promo.promoPrice;
}
